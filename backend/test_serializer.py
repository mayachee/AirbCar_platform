#!/usr/bin/env python3
"""Test serializer image processing."""
import os
import sys
import django

sys.path.insert(0, '/home/amine/projects/Startup/backend/airbcar_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import Listing
from core.serializers import ListingSerializer

print("=" * 80)
print("TESTING LISTING SERIALIZER IMAGE PROCESSING")
print("=" * 80)

# Get a listing with images
listing = Listing.objects.filter(id=33).select_related('partner__user').first()

if not listing:
    print("ERROR: Listing 33 not found!")
    sys.exit(1)

print(f"\nListing: {listing.id} - {listing.make} {listing.model}")
print(f"Raw images field: {listing.images}")
print(f"Image count: {len(listing.images)}")

# Serialize
serializer = ListingSerializer(listing)
data = serializer.data

print(f"\nSerialized data - images field:")
print(f"  Type: {type(data['images'])}")
print(f"  Count: {len(data['images'])}")
print(f"  Values:")
for i, img in enumerate(data['images']):
    print(f"    [{i+1}] {img[:100] if isinstance(img, str) else img}...")

# Test with only()
print("\n" + "=" * 80)
print("TESTING WITH only() OPTIMIZATION")
print("=" * 80)

base_fields = ['id', 'make', 'model', 'year', 'price_per_day', 'location', 'images', 
               'transmission', 'fuel_type', 'seating_capacity', 'rating', 'review_count', 'is_available',
               'created_at', 'updated_at', 'partner_id', 'vehicle_style', 'color']

listing_optimized = Listing.objects.filter(id=33).select_related('partner__user').only(
    *base_fields, 'partner__business_name', 'partner__user__first_name', 'partner__user__last_name'
).first()

print(f"\nListing (optimized): {listing_optimized.id} - {listing_optimized.make} {listing_optimized.model}")
print(f"Raw images field: {listing_optimized.images}")
print(f"Image count: {len(listing_optimized.images)}")

# Serialize
serializer_optimized = ListingSerializer(listing_optimized)
data_optimized = serializer_optimized.data

print(f"\nSerialized data (optimized) - images field:")
print(f"  Type: {type(data_optimized['images'])}")
print(f"  Count: {len(data_optimized['images'])}")
print(f"  Values:")
for i, img in enumerate(data_optimized['images']):
    print(f"    [{i+1}] {img[:100] if isinstance(img, str) else img}...")

# Compare
print("\n" + "=" * 80)
if data['images'] == data_optimized['images']:
    print("✅ SUCCESS: Both methods return identical images!")
else:
    print("❌ FAILURE: Images differ between methods!")
    print(f"   Full: {data['images']}")
    print(f"   Optimized: {data_optimized['images']}")
print("=" * 80)
