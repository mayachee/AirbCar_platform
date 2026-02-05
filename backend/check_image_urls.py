#!/usr/bin/env python3
"""Check listings with images."""
import os
import sys
import django

sys.path.insert(0, '/home/amine/projects/Startup/backend/airbcar_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import Listing

print("=" * 80)
print("LISTINGS WITH IMAGES")
print("=" * 80)

# Get listings with images
listings_with_images = Listing.objects.exclude(images=[]).only('id', 'make', 'model', 'images')

for listing in listings_with_images:
    print(f"\nListing {listing.id}: {listing.make} {listing.model}")
    print(f"  Image count: {len(listing.images)}")
    for i, img in enumerate(listing.images):
        print(f"  [{i+1}] Type: {type(img).__name__}, Value: {str(img)[:120]}")
        
        # Analyze the URL
        if isinstance(img, str):
            if 'supabase.co' in img:
                print(f"      → ✓ Valid Supabase URL")
            elif img.startswith(('http://', 'https://')):
                print(f"      → ? External URL")
            elif img.startswith('/'):
                print(f"      → ✗ Local path (will be filtered out)")
            else:
                print(f"      → ✗ Invalid format")
        elif isinstance(img, dict):
            print(f"      → ? Dict with keys: {list(img.keys())}")
        else:
            print(f"      → ✗ Invalid type")

print("\n" + "=" * 80)
