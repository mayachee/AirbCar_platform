#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from listings.models import Listing
from listings.serializers import ListingSerializer

# Check first 5 listings
listings = Listing.objects.all()[:5]
print(f'Total listings in database: {Listing.objects.count()}')
print('=' * 80)
print()

for listing in listings:
    print(f'ID: {listing.id}')
    print(f'Vehicle: {listing.make} {listing.model} ({listing.year})')
    print(f'Pictures field type: {type(listing.pictures).__name__}')
    print(f'Pictures value: {listing.pictures}')
    print()
    
    # Also check what the serializer returns
    serializer = ListingSerializer(listing)
    print(f'Serializer pictures field: {serializer.data.get("pictures")}')
    print('-' * 80)
    print()
