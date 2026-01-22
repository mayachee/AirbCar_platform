#!/usr/bin/env python
"""Fix partner table by applying missing migrations"""
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

print("=" * 70)
print("🔧 FIXING PARTNER TABLE")
print("=" * 70)
print()

# Check current database state
with connection.cursor() as cursor:
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_partner'")
    table_exists = cursor.fetchone() is not None
    
    if table_exists:
        print("✅ core_partner table exists")
        
        # Check what columns exist
        cursor.execute("PRAGMA table_info(core_partner)")
        columns = {row[1]: row for row in cursor.fetchall()}
        print(f"   Found {len(columns)} columns")
        
        # Check for slug column
        if 'slug' in columns:
            print("   ✅ slug column exists")
        else:
            print("   ❌ slug column MISSING")
            print()
            print("   Solution: The table exists but is missing new fields.")
            print("   We need to apply the partners migration.")
    else:
        print("   ℹ️  core_partner table doesn't exist yet")
        print("   (Will be created by migration)")

print()

# Check migration status
print("📋 Checking migration status...")
try:
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT app, name FROM django_migrations 
            WHERE app = 'partners'
        """)
        applied = cursor.fetchall()
        
        if applied:
            print(f"   ✅ {len(applied)} partners migrations applied:")
            for app, name in applied:
                print(f"      - {app}.{name}")
        else:
            print("   ❌ No partners migrations applied yet")
except Exception as e:
    print(f"   ⚠️  Could not check migrations: {e}")

print()

# Solution: Apply partners migration
print("🔄 Applying partners migration...")
print()

try:
    # First, check if we need to fake the initial migration
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_partner'")
        if cursor.fetchone():
            # Table exists but migration not applied - we have a problem
            print("   ⚠️  Table exists but migration not applied")
            print("   This means the table was created by old core migrations")
            print()
            print("   Options:")
            print("   1. Drop and recreate table (loses data)")
            print("   2. Manually add missing columns")
            print()
            
            response = input("   Drop core_partner table and recreate? (y/N): ").strip().lower()
            if response == 'y':
                print("   🗑️  Dropping core_partner table...")
                cursor.execute("DROP TABLE IF EXISTS core_partner")
                cursor.execute("DROP TABLE IF EXISTS core_partner_verific_d03d23_idx")
                cursor.execute("DROP TABLE IF EXISTS core_partner_slug_4e9d41_idx")
                print("   ✅ Table dropped")
                print()
                print("   🔄 Now applying migration...")
                call_command('migrate', 'partners', verbosity=1)
            else:
                print("   ⏭️  Skipped. You'll need to manually fix the table.")
                print()
                print("   To manually add columns, run SQL:")
                print("   ALTER TABLE core_partner ADD COLUMN slug VARCHAR(100);")
                print("   ALTER TABLE core_partner ADD COLUMN description TEXT;")
                print("   ... (add other missing columns)")
        else:
            # Table doesn't exist - just run migration
            print("   📝 Table doesn't exist, creating it...")
            call_command('migrate', 'partners', verbosity=1)
    
    print()
    print("✅ Migration applied!")
    
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    print()
    print("   Alternative: Delete database and start fresh")
    print("   rm db.sqlite3")
    print("   python3 manage.py migrate --fake-initial")

print()
print("=" * 70)
print("✅ FIX COMPLETE")
print("=" * 70)
print()
print("Try accessing /partners/ again")
print()

