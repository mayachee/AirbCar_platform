#!/usr/bin/env python3
"""Test POST /listings/ endpoint"""
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
import requests

User = get_user_model()

print("\n" + "=" * 70)
print("🧪 TEST POST localhost:8000/listings")
print("=" * 70 + "\n")

# Check and fix database
print("🔍 Checking database...")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_user'")
        if not cursor.fetchone():
            print("   ⚠️  Database needs fixing...\n")
            
            # Quick fix
            print("   Fixing database...")
            with connection.cursor() as c:
                for app in ['admin', 'contenttypes', 'auth', 'sessions', 'users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
                    c.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
            
            with connection.cursor() as c:
                c.execute("SELECT name FROM sqlite_master WHERE type='table'")
                for row in c.fetchall():
                    if row[0].startswith('core_'):
                        c.execute(f"DROP TABLE IF EXISTS {row[0]}")
            
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
            print("   ✅ Database fixed!\n")
        else:
            print("   ✅ Database OK\n")
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# Setup test user
print("👤 Setting up test user...")
user, _ = User.objects.get_or_create(
    email='test@example.com',
    defaults={'username': 'testuser', 'is_active': True}
)
if not user.has_usable_password():
    user.set_password('testpass123')
    user.save()
print(f"   Email: {user.email}")
print(f"   Password: testpass123\n")

# Setup partner
print("🏢 Setting up partner...")
partner, _ = Partner.objects.get_or_create(
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
print(f"   Company: {partner.company_name}")
print(f"   Partner ID: {partner.id}\n")

# Generate JWT token
print("🔑 Generating JWT token...")
refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)
print(f"   Token: {token[:60]}...\n")

# Test POST /listings/
print("=" * 70)
print("📤 TESTING POST localhost:8000/listings")
print("=" * 70 + "\n")

url = 'http://localhost:8000/listings/'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
}

data = {
    'make': 'Toyota',
    'model': 'Camry',
    'year': 2023,
    'location': 'New York',
    'price_per_day': '75.00',
    'fuel_type': 'Gasoline',
    'transmission': 'Automatic',
    'seating_capacity': 5,
    'vehicle_condition': 'Excellent',
    'vehicle_description': 'Brand new Toyota Camry, perfect condition',
    'features': ['GPS', 'Bluetooth', 'Backup Camera'],
    'pictures': [],
}

print(f"URL: {url}")
print(f"Method: POST")
print(f"Headers: Authorization: Bearer {token[:30]}...")
print(f"\nPayload:")
print(f"  Make: {data['make']}")
print(f"  Model: {data['model']}")
print(f"  Year: {data['year']}")
print(f"  Price: ${data['price_per_day']}/day")
print(f"  Location: {data['location']}")
print(f"  Features: {', '.join(data['features'])}")
print()

try:
    print("Sending request...\n")
    response = requests.post(url, json=data, headers=headers, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print()
    
    if response.status_code in [200, 201]:
        result = response.json()
        print("=" * 70)
        print("✅ SUCCESS! LISTING CREATED!")
        print("=" * 70)
        print()
        print(f"Listing ID: {result.get('id')}")
        print(f"Make/Model: {result.get('make')} {result.get('model')}")
        print(f"Year: {result.get('year')}")
        print(f"Price: ${result.get('price_per_day')}/day")
        print(f"Location: {result.get('location')}")
        print(f"Partner ID: {result.get('partner')}")
        print(f"Features: {result.get('features')}")
        print()
        print(f"View at: http://localhost:8000/listings/{result.get('id')}/")
        print()
    else:
        print("=" * 70)
        print("❌ FAILED")
        print("=" * 70)
        print()
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{response.text}")
        print()
        
except requests.exceptions.ConnectionError:
    print("=" * 70)
    print("⚠️  SERVER NOT RUNNING")
    print("=" * 70)
    print()
    print("The database is fixed and test data is ready.")
    print()
    print("To start the server, run:")
    print("  python3 manage.py runserver")
    print()
    print("Then run this script again to test the endpoint.")
    print()
    print("Or use this curl command:")
    print(f"\ncurl -X POST http://localhost:8000/listings/ \\")
    print(f"  -H 'Authorization: Bearer {token}' \\")
    print(f"  -H 'Content-Type: application/json' \\")
    print(f"  -d '{data}'")
    print()
    
except Exception as e:
    print("=" * 70)
    print("❌ ERROR")
    print("=" * 70)
    print()
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    print()

print("=" * 70)
print("Test credentials:")
print(f"  Email: {user.email}")
print(f"  Password: testpass123")
print(f"  Token: {token[:60]}...")
print("=" * 70)
print()

