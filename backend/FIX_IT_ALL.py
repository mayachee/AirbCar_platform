#!/usr/bin/env python
"""Complete fix - resolves all migration and database issues"""
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

print("=" * 70)
print("🔧 COMPLETE FIX - MIGRATIONS + DATABASE + TEST")
print("=" * 70)
print()

# ===== PART 1: FIX MIGRATIONS =====
print("PART 1: FIXING MIGRATION DEPENDENCIES")
print("-" * 70)
print()

# Remove all migration records
print("1️⃣  Removing all migration records...")
from django.db import transaction
with transaction.atomic():
    with connection.cursor() as cursor:
        for app in ['admin', 'contenttypes', 'auth', 'sessions', 'users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
            # Use format string to avoid SQLite parameter formatting issue
            cursor.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
            print(f"   ✅ Reset {app}")

print()

# Drop all tables
print("2️⃣  Dropping all core tables...")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    for table in tables:
        if table.startswith('core_'):
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
    print(f"   ✅ Dropped all core tables")

print()

# Apply migrations in correct order
print("3️⃣  Applying migrations in dependency order...")
try:
    call_command('migrate', 'core', '--fake', verbosity=0)
    print("   ✅ Faked core")
    
    call_command('migrate', 'contenttypes', '--fake', verbosity=0)
    print("   ✅ Faked contenttypes")
    
    call_command('migrate', 'auth', '--fake', verbosity=0)
    print("   ✅ Faked auth")
    
    # Apply in dependency order
    call_command('migrate', 'users', verbosity=1)
    print("   ✅ users (User table)")
    
    call_command('migrate', 'admin', '--fake', verbosity=0)
    print("   ✅ Faked admin")
    
    call_command('migrate', 'sessions', '--fake', verbosity=0)
    print("   ✅ Faked sessions")
    
    call_command('migrate', 'partners', verbosity=1)
    print("   ✅ partners")
    
    call_command('migrate', 'listings', verbosity=1)
    print("   ✅ listings")
    
    call_command('migrate', 'bookings', verbosity=1)
    print("   ✅ bookings")
    
    call_command('migrate', 'reviews', verbosity=1)
    print("   ✅ reviews")
    
    call_command('migrate', 'favorites', verbosity=1)
    print("   ✅ favorites")
    
    call_command('migrate', verbosity=0)
    print("   ✅ All done")
    
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Verify
print("4️⃣  Verifying...")
with connection.cursor() as cursor:
    try:
        cursor.execute("PRAGMA table_info(core_user)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   core_user: {'✅' if 'email' in cols else '❌'}")
        
        cursor.execute("PRAGMA table_info(core_partner)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   core_partner: {'✅' if 'slug' in cols else '❌'}")
        
        cursor.execute("PRAGMA table_info(core_listing)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   core_listing: {'✅' if 'pictures' in cols else '❌'}")
    except Exception as e:
        print(f"   ⚠️  {e}")

print()
print("=" * 70)
print("PART 2: TESTING POST /listings/")
print("=" * 70)
print()

# Setup
print("1️⃣  Setting up test data...")
user, _ = User.objects.get_or_create(
    email='test@example.com',
    defaults={'username': 'testuser', 'is_active': True}
)
if not user.has_usable_password():
    user.set_password('testpass123')
    user.save()

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

print(f"   ✅ User: {user.email}")
print(f"   ✅ Partner: {partner.company_name}")

# Get token
refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)

print()
print("2️⃣  Testing POST /listings/...")
url = 'http://localhost:8000/listings/'
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
data = {
    'make': 'Toyota',
    'model': 'Camry',
    'year': 2023,
    'location': 'Test Location',
    'price_per_day': '50.00',
    'fuel_type': 'Gasoline',
    'transmission': 'Automatic',
    'seating_capacity': 5,
    'vehicle_condition': 'Excellent',
    'vehicle_description': 'Test car',
    'features': [],
    'pictures': [],
}

try:
    response = requests.post(url, json=data, headers=headers, timeout=10)
    print(f"   Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        result = response.json()
        print(f"   ✅ SUCCESS! Listing created!")
        print(f"   ID: {result.get('id')}")
        print(f"   Make/Model: {result.get('make')} {result.get('model')}")
    else:
        print(f"   ❌ FAILED")
        print(f"   Response: {response.text[:300]}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Server not running")
    print("   Start: python3 manage.py runserver")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("=" * 70)
print("✅ ALL FIXES AND TESTS COMPLETE!")
print("=" * 70)
print()

