"""
Management command to migrate local media files to Supabase Storage.
This is needed because Render's filesystem is ephemeral.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Listing
from core.supabase_storage import upload_file_to_supabase, get_supabase_client
import os
from pathlib import Path


class Command(BaseCommand):
    help = 'Migrate local media files to Supabase Storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually uploading',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Check if Supabase is configured
        supabase = get_supabase_client()
        if not supabase:
            self.stdout.write(
                self.style.ERROR('❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
            )
            return
        
        self.stdout.write(self.style.SUCCESS('✓ Supabase client initialized'))
        
        # Get all listings with images
        listings = Listing.objects.exclude(images=[]).exclude(images__isnull=True)
        total_listings = listings.count()
        
        if total_listings == 0:
            self.stdout.write(self.style.WARNING('No listings with images found.'))
            return
        
        self.stdout.write(f'Found {total_listings} listings with images')
        
        migrated_count = 0
        failed_count = 0
        
        for listing in listings:
            if not listing.images:
                continue
            
            updated_images = []
            needs_update = False
            
            for img in listing.images:
                if isinstance(img, str):
                    # Check if it's a local media path
                    if '/media/' in img or img.startswith('/media/'):
                        # Extract the file path
                        if '/media/' in img:
                            media_index = img.find('/media/')
                            file_path = img[media_index + 7:]  # Remove '/media/'
                        else:
                            file_path = img.replace('/media/', '')
                        
                        # Check if file exists locally
                        local_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
                        
                        if os.path.exists(local_file_path):
                            if not dry_run:
                                # Upload to Supabase - all media goes to 'Pics' bucket
                                bucket_name = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'Pics')
                                
                                # Determine folder within Pics bucket based on file path
                                if 'profiles' in file_path:
                                    folder = 'profiles'
                                elif 'partner_logos' in file_path:
                                    folder = 'partner_logos'
                                else:
                                    folder = 'listings'
                                
                                # Extract just the filename for Supabase path
                                filename = os.path.basename(file_path)
                                supabase_path = f"{folder}/{filename}"
                                
                                try:
                                    with open(local_file_path, 'rb') as f:
                                        supabase_url = upload_file_to_supabase(
                                            f,
                                            bucket_name,
                                            supabase_path
                                        )
                                    
                                    if supabase_url:
                                        updated_images.append(supabase_url)
                                        needs_update = True
                                        self.stdout.write(
                                            self.style.SUCCESS(f'  ✓ Migrated: {filename}')
                                        )
                                    else:
                                        updated_images.append(img)  # Keep original if upload fails
                                        self.stdout.write(
                                            self.style.WARNING(f'  ⚠ Upload failed: {filename}')
                                        )
                                        failed_count += 1
                                except Exception as e:
                                    self.stdout.write(
                                        self.style.ERROR(f'  ✗ Error uploading {filename}: {str(e)}')
                                    )
                                    updated_images.append(img)  # Keep original
                                    failed_count += 1
                            else:
                                self.stdout.write(f'  [DRY RUN] Would migrate: {file_path}')
                                updated_images.append(img)  # Keep original in dry run
                        else:
                            # File doesn't exist locally, keep the URL as-is (might work in Docker)
                            updated_images.append(img)
                            if not dry_run:
                                self.stdout.write(
                                    self.style.WARNING(f'  ⚠ File not found locally: {file_path}')
                                )
                    elif img.startswith('http://') or img.startswith('https://'):
                        # Already a full URL (Supabase or external), keep it
                        updated_images.append(img)
                    else:
                        # Unknown format, keep as-is
                        updated_images.append(img)
                
                elif isinstance(img, dict):
                    # Handle dictionary format: {'url': '...', 'name': '...'}
                    img_url = img.get('url', '')
                    
                    if '/media/' in img_url or img_url.startswith('/media/'):
                        # Extract the file path
                        if '/media/' in img_url:
                            media_index = img_url.find('/media/')
                            file_path = img_url[media_index + 7:]
                        else:
                            file_path = img_url.replace('/media/', '')
                        
                        local_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
                        
                        if os.path.exists(local_file_path):
                            if not dry_run:
                                bucket_name = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'Pics')
                                filename = os.path.basename(file_path)
                                supabase_path = f"listings/{filename}"
                                
                                try:
                                    with open(local_file_path, 'rb') as f:
                                        supabase_url = upload_file_to_supabase(
                                            f,
                                            bucket_name,
                                            supabase_path
                                        )
                                    
                                    if supabase_url:
                                        img['url'] = supabase_url
                                        updated_images.append(img)
                                        needs_update = True
                                        self.stdout.write(
                                            self.style.SUCCESS(f'  ✓ Migrated: {filename}')
                                        )
                                    else:
                                        updated_images.append(img)
                                        failed_count += 1
                                except Exception as e:
                                    self.stdout.write(
                                        self.style.ERROR(f'  ✗ Error: {str(e)}')
                                    )
                                    updated_images.append(img)
                                    failed_count += 1
                            else:
                                self.stdout.write(f'  [DRY RUN] Would migrate: {file_path}')
                                updated_images.append(img)
                        else:
                            updated_images.append(img)
                    else:
                        # Already a full URL or unknown format
                        updated_images.append(img)
                else:
                    # Unknown format, keep as-is
                    updated_images.append(img)
            
            # Update listing if images were migrated
            if needs_update and not dry_run:
                listing.images = updated_images
                listing.save(update_fields=['images'])
                migrated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Updated listing ID {listing.id}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        if dry_run:
            self.stdout.write(self.style.SUCCESS('DRY RUN COMPLETE'))
            self.stdout.write(f'Would migrate {total_listings} listings')
        else:
            self.stdout.write(self.style.SUCCESS('MIGRATION COMPLETE'))
            self.stdout.write(f'Migrated: {migrated_count} listings')
            self.stdout.write(f'Failed: {failed_count} files')
        
        if not dry_run and migrated_count > 0:
            self.stdout.write(
                self.style.SUCCESS('\n✓ Images have been migrated to Supabase Storage!')
            )
            self.stdout.write(
                self.style.WARNING('\n⚠ Note: Local files were not deleted. You may want to clean them up manually.')
            )

