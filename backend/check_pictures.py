#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Setup path
backend_dir = Path(__file__).parent
django_dir = backend_dir / 'airbcar_backend'
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(django_dir))
os.chdir(django_dir)

load_dotenv(backend_dir / '.env', override=True)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.core.management import execute_from_command_line
sys.path.insert(0, str(backend_dir))

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
