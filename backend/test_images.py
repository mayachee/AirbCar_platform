#!/usr/bin/env python
"""Test script to check if images field works with only() optimization."""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/amine/projects/Startup/backend/airbcar_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import Listing

print("=" * 60)
print("TESTING IMAGES FIELD WITH only() OPTIMIZATION")
print("=" * 60)

# Test 1: Get listing with only() - mimics GET request optimization
print("\n1. Testing with only() (like GET request):")
listing_with_only = Listing.objects.only('id', 'make', 'model', 'images').first()
if listing_with_only:
    print(f"   Listing ID: {listing_with_only.id}")
    print(f"   Make/Model: {listing_with_only.make} {listing_with_only.model}")
    print(f"   Images type: {type(listing_with_only.images)}")
    print(f"   Images count: {len(listing_with_only.images) if listing_with_only.images else 0}")
    if listing_with_only.images:
        print(f"   First image: {listing_with_only.images[0][:100] if listing_with_only.images[0] else 'None'}...")
else:
    print("   No listings found")

# Test 2: Get listing without only() - mimics UPDATE request
print("\n2. Testing without only() (like UPDATE request):")
listing_full = Listing.objects.first()
if listing_full:
    print(f"   Listing ID: {listing_full.id}")
    print(f"   Make/Model: {listing_full.make} {listing_full.model}")
    print(f"   Images type: {type(listing_full.images)}")
    print(f"   Images count: {len(listing_full.images) if listing_full.images else 0}")
    if listing_full.images:
        print(f"   First image: {listing_full.images[0][:100] if listing_full.images[0] else 'None'}...")
else:
    print("   No listings found")

# Test 3: Check if all listings have images
print("\n3. Checking all listings:")
total_listings = Listing.objects.count()
listings_with_images = Listing.objects.exclude(images=[]).count()
print(f"   Total listings: {total_listings}")
print(f"   Listings with images: {listings_with_images}")
print(f"   Listings without images: {total_listings - listings_with_images}")

# Test 4: Sample some image URLs
print("\n4. Sample image URLs from first 5 listings:")
for listing in Listing.objects.only('id', 'make', 'images')[:5]:
    img_count = len(listing.images) if listing.images else 0
    print(f"   Listing {listing.id} ({listing.make}): {img_count} images")
    if listing.images:
        for i, img_url in enumerate(listing.images[:2]):  # Show max 2 URLs
            if isinstance(img_url, str):
                # Check if it's a Supabase URL
                if 'supabase.co' in img_url:
                    print(f"      [{i+1}] ✓ Supabase: {img_url[:80]}...")
                elif 'http' in img_url:
                    print(f"      [{i+1}] ? External: {img_url[:80]}...")
                else:
                    print(f"      [{i+1}] ✗ Local/Invalid: {img_url[:80]}...")
            else:
                print(f"      [{i+1}] ✗ Invalid type: {type(img_url)}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
