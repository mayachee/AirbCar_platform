#!/usr/bin/env python
"""Test POST /listings endpoint with bearer token"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from partners.models import Partner
import requests

User = get_user_model()

print("=" * 70)
print("🧪 TESTING POST /listings/")
print("=" * 70)
print()

# Setup user
print("1️⃣  Setting up user...")
try:
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'username': 'testuser',
            'is_active': True,
        }
    )
    if created or not user.has_usable_password():
        user.set_password('testpass123')
        user.save()
    print(f"   ✅ User: {user.email} (ID: {user.id})")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print()

# Ensure partner exists with all required fields
print("2️⃣  Setting up partner...")
try:
    partner, created = Partner.objects.get_or_create(
        user=user,
        defaults={
            'company_name': 'Test Company',
            'tax_id': 'TEST123',
            'phone': '1234567890',  # Required
            'city': 'Test City',  # Required
        }
    )
    # Update if missing required fields
    if not created:
        if not partner.phone:
            partner.phone = '1234567890'
        if not partner.city:
            partner.city = 'Test City'
        partner.save()
    
    print(f"   ✅ Partner: {partner.company_name} (ID: {partner.id})")
    print(f"      Phone: {partner.phone}")
    print(f"      City: {partner.city}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Generate token
print("3️⃣  Generating JWT token...")
try:
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    print(f"   ✅ Token generated: {token[:50]}...")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print()

# Test POST
print("4️⃣  Testing POST /listings/...")
try:
    url = 'http://localhost:8000/listings/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    
    # Note: partner is NOT in the data - it's set automatically in perform_create
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
        'vehicle_description': 'Test car description',
        'features': [],
        'pictures': [],
    }
    
    print(f"   URL: {url}")
    print(f"   Method: POST")
    print(f"   Headers: Authorization: Bearer {token[:30]}...")
    print(f"   Data keys: {list(data.keys())}")
    print()
    print("   Sending request...")
    
    response = requests.post(url, json=data, headers=headers, timeout=10)
    
    print()
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code in [200, 201]:
        result = response.json()
        print(f"   ✅ SUCCESS! Listing created!")
        print(f"   Listing ID: {result.get('id')}")
        print(f"   Make/Model: {result.get('make')} {result.get('model')}")
        print(f"   Year: {result.get('year')}")
        print(f"   Price: ${result.get('price_per_day')}/day")
    else:
        print(f"   ❌ FAILED")
        print(f"   Response: {response.text[:500]}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Could not connect to server")
    print("   Make sure server is running: python3 manage.py runserver")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 70)
print("✅ TEST COMPLETE")
print("=" * 70)
print()

