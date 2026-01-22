#!/usr/bin/env python
"""Complete fix and test - fixes database then tests POST /listings"""
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
print("🔧 COMPLETE FIX AND TEST")
print("=" * 70)
print()

# ===== PART 1: FIX DATABASE =====
print("PART 1: FIXING DATABASE")
print("-" * 70)
print()

# Step 1: Drop tables
print("1️⃣  Dropping old core tables...")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    for table in tables:
        if table.startswith('core_'):
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"   ✅ Dropped {table}")
            except:
                pass

print()

# Step 2: Reset migrations
print("2️⃣  Resetting migrations...")
with connection.cursor() as cursor:
    for app in ['partners', 'listings', 'bookings', 'reviews', 'favorites']:
        cursor.execute("DELETE FROM django_migrations WHERE app = ?", (app,))
        print(f"   ✅ Reset {app}")

print()

# Step 3: Apply migrations
print("3️⃣  Applying migrations...")
try:
    call_command('migrate', 'core', '--fake', verbosity=0)
    print("   ✅ Faked core")
    
    for app in ['partners', 'listings', 'bookings', 'reviews', 'favorites']:
        call_command('migrate', app, verbosity=0)
        print(f"   ✅ Migrated {app}")
    
    call_command('migrate', verbosity=0)
    print("   ✅ All migrations applied")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print()

# Verify
print("4️⃣  Verifying...")
with connection.cursor() as cursor:
    try:
        cursor.execute("PRAGMA table_info(core_partner)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   core_partner: {'✅ has slug' if 'slug' in cols else '❌ missing slug'}")
        
        cursor.execute("PRAGMA table_info(core_listing)")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   core_listing: {'✅ has pictures' if 'pictures' in cols else '❌ missing pictures'}")
    except Exception as e:
        print(f"   ⚠️  Verification error: {e}")

print()
print("=" * 70)
print("PART 2: TESTING POST /listings")
print("=" * 70)
print()

# ===== PART 2: TEST ENDPOINT =====
# Setup user and partner
print("1️⃣  Setting up test user...")
try:
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={'username': 'testuser', 'is_active': True}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    print(f"   ✅ User: {user.email}")
    
    partner, created = Partner.objects.get_or_create(
        user=user,
        defaults={
            'company_name': 'Test Company',
            'tax_id': 'TEST123',
            'phone': '1234567890',
            'city': 'Test City',
        }
    )
    print(f"   ✅ Partner: {partner.company_name} (ID: {partner.id})")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print()

# Generate token
print("2️⃣  Generating JWT token...")
try:
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    print(f"   ✅ Token: {token[:30]}...")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print()

# Test POST
print("3️⃣  Testing POST /listings/...")
try:
    url = 'http://localhost:8000/listings/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    
    data = {
        'partner': partner.id,
        'make': 'Toyota',
        'model': 'Camry',
        'year': 2023,
        'location': 'Test Location',
        'price_per_day': '50.00',
        'fuel_type': 'Gasoline',
        'transmission': 'Automatic',
        'seating_capacity': 5,
        'vehicle_condition': 'Excellent',
        'vehicle_description': 'Test description',
        'features': [],
        'pictures': [],
    }
    
    print(f"   URL: {url}")
    print(f"   Partner ID: {partner.id}")
    print()
    
    response = requests.post(url, json=data, headers=headers, timeout=5)
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        result = response.json()
        print(f"   ✅ SUCCESS! Listing created!")
        print(f"   Listing ID: {result.get('id')}")
        print(f"   Make/Model: {result.get('make')} {result.get('model')}")
    else:
        print(f"   ❌ FAILED")
        print(f"   Response: {response.text[:500]}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Server not running")
    print("   Start server: python3 manage.py runserver")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 70)
print("✅ COMPLETE")
print("=" * 70)
print()

