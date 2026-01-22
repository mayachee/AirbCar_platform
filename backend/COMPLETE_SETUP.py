#!/usr/bin/env python3
"""Complete setup - fix database, run migrations, and test"""
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

print("\n" + "=" * 70)
print("🚀 COMPLETE SETUP - FIX, MIGRATE, AND TEST")
print("=" * 70 + "\n")

# ============================================================================
# PART 1: FIX DATABASE
# ============================================================================
print("PART 1: FIXING DATABASE")
print("-" * 70 + "\n")

print("1️⃣  Removing old migration records...")
try:
    with connection.cursor() as cursor:
        # Remove all migrations that depend on our custom apps
        for app in ['admin', 'contenttypes', 'auth', 'sessions', 'users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
            cursor.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
    print("   ✅ Done\n")
except Exception as e:
    print(f"   ⚠️  Warning: {e}\n")

print("2️⃣  Dropping old tables...")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        dropped = 0
        for table in tables:
            if table.startswith('core_'):
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                dropped += 1
    print(f"   ✅ Dropped {dropped} tables\n")
except Exception as e:
    print(f"   ⚠️  Warning: {e}\n")

# ============================================================================
# PART 2: RUN MIGRATIONS
# ============================================================================
print("=" * 70)
print("PART 2: RUNNING MIGRATIONS")
print("=" * 70 + "\n")

print("1️⃣  Running makemigrations...")
try:
    call_command('makemigrations', verbosity=1)
    print("   ✅ makemigrations complete\n")
except Exception as e:
    print(f"   ⚠️  {e}\n")

print("2️⃣  Running migrate...")
try:
    # Fake core first
    call_command('migrate', 'core', '--fake', verbosity=0)
    print("   ✅ Faked core")
    
    # Apply Django's built-in apps first (they need to be faked since we deleted their records)
    call_command('migrate', 'contenttypes', '--fake', verbosity=0)
    print("   ✅ Faked contenttypes")
    
    call_command('migrate', 'auth', '--fake', verbosity=0)
    print("   ✅ Faked auth")
    
    # Now apply users (our custom User model)
    call_command('migrate', 'users', verbosity=0)
    print("   ✅ Migrated users")
    
    # Fake admin now that users exists
    call_command('migrate', 'admin', '--fake', verbosity=0)
    print("   ✅ Faked admin")
    
    call_command('migrate', 'sessions', '--fake', verbosity=0)
    print("   ✅ Faked sessions")
    
    # Now migrate our custom apps in dependency order
    apps = ['partners', 'listings', 'bookings', 'reviews', 'favorites']
    for app in apps:
        call_command('migrate', app, verbosity=0)
        print(f"   ✅ Migrated {app}")
    
    # Final migrate to catch anything else
    call_command('migrate', verbosity=0)
    print("   ✅ All migrations applied\n")
    
except Exception as e:
    print(f"   ❌ Error: {e}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ============================================================================
# PART 3: VERIFY
# ============================================================================
print("=" * 70)
print("PART 3: VERIFYING DATABASE")
print("=" * 70 + "\n")

tables_to_check = [
    ('core_user', ['email', 'username', 'password']),
    ('core_partner', ['slug', 'phone', 'city']),
    ('core_listing', ['pictures', 'fuel_type', 'transmission']),
    ('core_booking', ['status', 'start_time', 'end_time']),
    ('core_review', ['rating', 'comment']),
    ('core_favorite', ['user_id', 'listing_id']),
]

all_good = True
for table, required_cols in tables_to_check:
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in cursor.fetchall()]
            
            missing = [c for c in required_cols if c not in cols]
            if missing:
                print(f"   ❌ {table}: missing {missing}")
                all_good = False
            else:
                print(f"   ✅ {table}: all required columns present")
    except Exception as e:
        print(f"   ❌ {table}: {e}")
        all_good = False

print()

if all_good:
    print("=" * 70)
    print("✅ DATABASE SETUP COMPLETE!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Start server: python3 manage.py runserver")
    print("  2. Test endpoint: python3 TEST_POST_LISTING.py")
    print()
else:
    print("⚠️  Some tables have issues. Check the errors above.")
    sys.exit(1)

# ============================================================================
# PART 4: SHOW MIGRATION STATUS
# ============================================================================
print("Migration Status:")
print("-" * 70)
try:
    call_command('showmigrations', '--list', verbosity=1)
except:
    pass

print()

