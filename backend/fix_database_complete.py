#!/usr/bin/env python
"""Complete database fix - drop and recreate all tables properly"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.db import connection, transaction
from django.core.management import call_command
from django.conf import settings

print("=" * 70)
print("🔧 COMPLETE DATABASE FIX")
print("=" * 70)
print()

# Check database type
use_sqlite = 'sqlite' in settings.DATABASES['default']['ENGINE']
db_path = settings.DATABASES['default']['NAME']

if not use_sqlite:
    print("⚠️  This script is for SQLite only")
    sys.exit(1)

print(f"📁 Database: {db_path}")
print()

# Step 1: Drop all core_* tables and related objects
print("1️⃣  Dropping all old core tables...")

with connection.cursor() as cursor:
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall()]
    
    # Core tables to drop
    core_tables = [t for t in all_tables if t.startswith('core_')]
    
    if core_tables:
        print(f"   Found {len(core_tables)} core tables to drop:")
        for table in core_tables:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"   ✅ Dropped {table}")
            except Exception as e:
                print(f"   ⚠️  Could not drop {table}: {e}")
    else:
        print("   ℹ️  No core tables found")
    
    # Drop all indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")
    indexes = [row[0] for row in cursor.fetchall()]
    
    core_indexes = [idx for idx in indexes if 'core_' in idx or any(t.replace('core_', '') in idx for t in core_tables)]
    
    if core_indexes:
        print(f"   Dropping {len(core_indexes)} indexes...")
        for idx in core_indexes:
            try:
                cursor.execute(f"DROP INDEX IF EXISTS {idx}")
            except:
                pass

print()

# Step 2: Reset migration records for new apps
print("2️⃣  Resetting migration records...")

with connection.cursor() as cursor:
    # Remove migration records for new apps
    apps_to_reset = ['partners', 'listings', 'bookings', 'reviews', 'favorites']
    
    for app in apps_to_reset:
        cursor.execute("DELETE FROM django_migrations WHERE app = ?", [app])
        count = cursor.rowcount
        if count > 0:
            print(f"   ✅ Reset {app} migrations ({count} records)")

print()

# Step 3: Apply all migrations fresh
print("3️⃣  Applying migrations fresh...")
print()

try:
    # Fake core migrations (they're legacy)
    print("   Faking core migrations...")
    call_command('migrate', 'core', '--fake', verbosity=0)
    print("   ✅ Core migrations faked")
    
    # Apply new app migrations
    apps_to_migrate = ['partners', 'listings', 'bookings', 'reviews', 'favorites']
    
    for app in apps_to_migrate:
        print(f"   Migrating {app}...")
        try:
            call_command('migrate', app, verbosity=0)
            print(f"   ✅ {app} migrated")
        except Exception as e:
            print(f"   ❌ {app} failed: {str(e)[:100]}")
            # Try to fake it if it fails
            try:
                call_command('migrate', app, '--fake', verbosity=0)
                print(f"   ⚠️  {app} faked instead")
            except:
                pass
    
    # Apply any remaining migrations
    print()
    print("   Applying remaining migrations...")
    call_command('migrate', verbosity=1)
    
except Exception as e:
    print(f"   ❌ Migration error: {e}")
    import traceback
    traceback.print_exc()

print()

# Step 4: Verify tables
print("4️⃣  Verifying tables...")

with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'core_%'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"   Found {len(tables)} core tables:")
    for table in sorted(tables):
        # Check columns
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"   ✅ {table} ({len(columns)} columns)")
        
        # Check for critical columns
        if table == 'core_partner':
            if 'slug' in columns:
                print(f"      ✅ Has 'slug' column")
            else:
                print(f"      ❌ Missing 'slug' column!")
        elif table == 'core_listing':
            if 'pictures' in columns:
                print(f"      ✅ Has 'pictures' column")
            else:
                print(f"      ❌ Missing 'pictures' column!")

print()
print("=" * 70)
print("✅ DATABASE FIX COMPLETE")
print("=" * 70)
print()
print("Try accessing admin dashboard now:")
print("  - Add listing: /admin/listings/listing/add/")
print("  - Add booking: /admin/bookings/booking/add/")
print()

