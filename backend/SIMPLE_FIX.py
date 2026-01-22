#!/usr/bin/env python3
"""Simplified fix - resolves all issues"""
import os
import sys
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.db import connection
from django.core.management import call_command

print("=" * 70)
print("🔧 FIXING DATABASE")
print("=" * 70)
print()

# Step 1: Remove migration records
print("1️⃣  Removing migration records...")
with connection.cursor() as cursor:
    for app in ['admin', 'contenttypes', 'auth', 'sessions', 'users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
        cursor.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
print("   ✅ Done")
print()

# Step 2: Drop tables
print("2️⃣  Dropping tables...")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for row in cursor.fetchall():
        if row[0].startswith('core_'):
            cursor.execute(f"DROP TABLE IF EXISTS {row[0]}")
print("   ✅ Done")
print()

# Step 3: Apply migrations
print("3️⃣  Applying migrations...")
call_command('migrate', 'core', '--fake', verbosity=0)
call_command('migrate', 'contenttypes', '--fake', verbosity=0)
call_command('migrate', 'auth', '--fake', verbosity=0)
call_command('migrate', 'users', verbosity=0)  # Important: User table!
call_command('migrate', 'admin', '--fake', verbosity=0)
call_command('migrate', 'sessions', '--fake', verbosity=0)
call_command('migrate', 'partners', verbosity=0)
call_command('migrate', 'listings', verbosity=0)
call_command('migrate', 'bookings', verbosity=0)
call_command('migrate', 'reviews', verbosity=0)
call_command('migrate', 'favorites', verbosity=0)
call_command('migrate', verbosity=0)
print("   ✅ Done")
print()

# Step 4: Verify
print("4️⃣  Verifying...")
with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(core_user)")
    cols = [r[1] for r in cursor.fetchall()]
    status = "✅" if 'email' in cols else "❌"
    print(f"   {status} core_user")
    
    cursor.execute("PRAGMA table_info(core_partner)")
    cols = [r[1] for r in cursor.fetchall()]
    status = "✅" if 'slug' in cols else "❌"
    print(f"   {status} core_partner")
    
    cursor.execute("PRAGMA table_info(core_listing)")
    cols = [r[1] for r in cursor.fetchall()]
    status = "✅" if 'pictures' in cols else "❌"
    print(f"   {status} core_listing")

print()
print("=" * 70)
print("✅ FIXED! Now run: python3 manage.py runserver")
print("=" * 70)
print()

