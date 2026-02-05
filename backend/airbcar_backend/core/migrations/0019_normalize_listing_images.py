# Generated migration to normalize listing images to URL strings only

from django.db import migrations
import json


def normalize_listing_images(apps, schema_editor):
    """
    Normalize all listing images to URL strings only.
    Converts dict objects like {'url': '...', 'name': '...', 'size': ...} to just the URL string.
    """
    Listing = apps.get_model('core', 'Listing')
    
    updated_count = 0
    for listing in Listing.objects.all():
        if not listing.images:
            continue
            
        # Parse images if it's a string
        if isinstance(listing.images, str):
            try:
                listing.images = json.loads(listing.images)
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Check if images need normalization
        needs_update = False
        normalized_images = []
        
        for img in listing.images:
            if isinstance(img, str):
                # Already a URL string - keep it
                normalized_images.append(img)
            elif isinstance(img, dict) and 'url' in img:
                # Dict with URL - extract just the URL string
                normalized_images.append(img['url'])
                needs_update = True
            elif isinstance(img, dict):
                # Dict without URL - try to find a URL in values
                # This is a fallback for unusual cases
                for value in img.values():
                    if isinstance(value, str) and ('http' in value or value.startswith('/')):
                        normalized_images.append(value)
                        needs_update = True
                        break
        
        if needs_update and normalized_images:
            listing.images = normalized_images
            listing.save(update_fields=['images'])
            updated_count += 1
    
    if updated_count > 0:
        print(f"✅ Normalized images for {updated_count} listing(s)")


def reverse_normalize(apps, schema_editor):
    """
    Reverse migration - not really necessary since we're just extracting URLs,
    but we can leave it as a no-op.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_user_license_back_document_url_and_more'),
    ]

    operations = [
        migrations.RunPython(normalize_listing_images, reverse_normalize),
    ]
