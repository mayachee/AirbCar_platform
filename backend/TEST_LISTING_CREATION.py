#!/usr/bin/env python3
"""Test creating a listing - includes database fix"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.db import connection
from django.core.management import call_command
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from partners.models import Partner
from listings.models import Listing

User = get_user_model()

print("\n" + "=" * 70)
print("🧪 TESTING LISTING CREATION")
print("=" * 70 + "\n")

# First, check if database needs fixing
print("Checking database status...")
needs_fix = False
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_user'")
        if not cursor.fetchone():
            needs_fix = True
            print("   ⚠️  core_user table missing")
except:
    needs_fix = True

if needs_fix:
    print("\n🔧 Fixing database first...\n")
    
    # Remove migration records
    print("1️⃣  Clearing migration records...")
    with connection.cursor() as cursor:
        for app in ['admin', 'contenttypes', 'auth', 'sessions', 'users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
            cursor.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
    print("   ✅ Done\n")
    
    # Drop tables
    print("2️⃣  Dropping old tables...")
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        for row in cursor.fetchall():
            if row[0].startswith('core_'):
                cursor.execute(f"DROP TABLE IF EXISTS {row[0]}")
    print("   ✅ Done\n")
    
    # Apply migrations
    print("3️⃣  Applying migrations...")
    call_command('migrate', 'core', '--fake', verbosity=0)
    call_command('migrate', 'contenttypes', '--fake', verbosity=0)
    call_command('migrate', 'auth', '--fake', verbosity=0)
    call_command('migrate', 'users', verbosity=0)
    call_command('migrate', 'admin', '--fake', verbosity=0)
    call_command('migrate', 'sessions', '--fake', verbosity=0)
    call_command('migrate', 'partners', verbosity=0)
    call_command('migrate', 'listings', verbosity=0)
    call_command('migrate', 'bookings', verbosity=0)
    call_command('migrate', 'reviews', verbosity=0)
    call_command('migrate', 'favorites', verbosity=0)
    call_command('migrate', verbosity=0)
    print("   ✅ Done\n")
    
    print("✅ Database fixed!\n")

# Create test data
print("=" * 70)
print("CREATING TEST DATA")
print("=" * 70 + "\n")

print("1️⃣  Creating test user...")
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={'username': 'testuser', 'is_active': True}
)
if created or not user.has_usable_password():
    user.set_password('testpass123')
    user.save()
print(f"   ✅ User: {user.email} (ID: {user.id})\n")

print("2️⃣  Creating test partner...")
partner, created = Partner.objects.get_or_create(
    user=user,
    defaults={
        'company_name': 'Test Company',
        'tax_id': 'TEST123',
        'phone': '1234567890',
        'city': 'Test City',
    }
)
if not partner.phone:
    partner.phone = '1234567890'
if not partner.city:
    partner.city = 'Test City'
partner.save()
print(f"   ✅ Partner: {partner.company_name} (ID: {partner.id})\n")

# Method 1: Create listing directly via Django ORM
print("=" * 70)
print("METHOD 1: CREATE LISTING VIA DJANGO ORM")
print("=" * 70 + "\n")

try:
    listing = Listing.objects.create(
        partner=partner,
        make='Toyota',
        model='Camry',
        year=2023,
        location='Test Location',
        price_per_day=50.00,
        fuel_type='Gasoline',
        transmission='Automatic',
        seating_capacity=5,
        vehicle_condition='Excellent',
        vehicle_description='Test car created directly via ORM',
        features=[],
        pictures=[],
    )
    
    print("✅ SUCCESS! Listing created via ORM")
    print(f"   ID: {listing.id}")
    print(f"   Make/Model: {listing.make} {listing.model}")
    print(f"   Year: {listing.year}")
    print(f"   Price: ${listing.price_per_day}/day")
    print(f"   Partner: {listing.partner.company_name}")
    print(f"   Location: {listing.location}")
    
except Exception as e:
    print(f"❌ Failed to create listing: {e}")
    import traceback
    traceback.print_exc()

print()

# Method 2: Test via API endpoint (if server is running)
print("=" * 70)
print("METHOD 2: TEST VIA API ENDPOINT")
print("=" * 70 + "\n")

print("Generating JWT token...")
refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)
print(f"   ✅ Token: {token[:50]}...\n")

try:
    import requests
    
    url = 'http://localhost:8000/listings/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    
    data = {
        'make': 'Honda',
        'model': 'Accord',
        'year': 2024,
        'location': 'API Test Location',
        'price_per_day': '60.00',
        'fuel_type': 'Hybrid',
        'transmission': 'Automatic',
        'seating_capacity': 5,
        'vehicle_condition': 'Excellent',
        'vehicle_description': 'Test car created via API',
        'features': ['GPS', 'Bluetooth'],
        'pictures': [],
    }
    
    print(f"Testing POST {url}")
    response = requests.post(url, json=data, headers=headers, timeout=5)
    
    print(f"Status Code: {response.status_code}\n")
    
    if response.status_code in [200, 201]:
        result = response.json()
        print("✅ SUCCESS! Listing created via API")
        print(f"   ID: {result.get('id')}")
        print(f"   Make/Model: {result.get('make')} {result.get('model')}")
        print(f"   Year: {result.get('year')}")
        print(f"   Price: ${result.get('price_per_day')}/day")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
except requests.exceptions.ConnectionError:
    print("⚠️  Server not running")
    print("Start server: python3 manage.py runserver")
    print()
    print("You can still use the ORM-created listing above!")
except Exception as e:
    print(f"⚠️  API test error: {e}")

# Show all listings
print()
print("=" * 70)
print("ALL LISTINGS IN DATABASE")
print("=" * 70 + "\n")

listings = Listing.objects.all()
print(f"Total listings: {listings.count()}\n")

for listing in listings:
    print(f"  • ID {listing.id}: {listing.year} {listing.make} {listing.model}")
    print(f"    Price: ${listing.price_per_day}/day | Location: {listing.location}")
    print(f"    Partner: {listing.partner.company_name}\n")

print("=" * 70)
print("✅ TEST COMPLETE!")
print("=" * 70)
print()
print("Summary:")
print(f"  • User: {user.email}")
print(f"  • Partner: {partner.company_name}")
print(f"  • Listings created: {listings.count()}")
print()

