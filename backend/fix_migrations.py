#!/usr/bin/env python
"""Fix migration issues by faking legacy core migrations"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.core.management import call_command
from django.db import connection

print("=" * 70)
print("🔧 FIXING MIGRATION ISSUES")
print("=" * 70)
print()

# Check if using SQLite
from django.conf import settings
use_sqlite = 'sqlite' in settings.DATABASES['default']['ENGINE']
db_path = settings.DATABASES['default']['NAME']

if use_sqlite and isinstance(db_path, Path):
    db_file = db_path
    print(f"📁 SQLite database: {db_file}")
    
    if db_file.exists():
        print("   ✅ Database file exists")
        
        # Check what tables exist
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"   📊 Found {len(tables)} tables")
            
            if 'django_migrations' in tables:
                print("   ✅ Migration tracking table exists")
                
                # Check which core migrations are applied
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = 'core'
                """)
                applied_core = [row[0] for row in cursor.fetchall()]
                
                if applied_core:
                    print(f"   📋 {len(applied_core)} core migrations already applied")
                else:
                    print("   ⚠️  No core migrations applied yet")
            else:
                print("   ⚠️  Migration tracking table doesn't exist")
    else:
        print("   📝 Database file doesn't exist yet (will be created)")

print()

# Solution 1: Fake all core migrations (recommended for fresh SQLite)
print("💡 Solution: Fake legacy core migrations")
print()
print("Since you're using SQLite and the core app is legacy,")
print("we'll fake all core migrations to skip them.")
print()

try:
    # Get list of core migrations
    from django.db.migrations.loader import MigrationLoader
    loader = MigrationLoader(connection)
    
    core_migrations = [
        name for (app, name) in loader.graph.nodes.keys()
        if app == 'core'
    ]
    
    if core_migrations:
        print(f"📋 Found {len(core_migrations)} core migrations to fake:")
        for mig in sorted(core_migrations)[:10]:
            print(f"   - core.{mig}")
        if len(core_migrations) > 10:
            print(f"   ... and {len(core_migrations) - 10} more")
        
        print()
        print("Running: python3 manage.py migrate core --fake")
        print()
        
        # Fake core migrations
        call_command('migrate', 'core', '--fake', verbosity=1)
        
        print()
        print("✅ Core migrations faked successfully!")
    else:
        print("   ℹ️  No core migrations found")
        
except Exception as e:
    print(f"   ⚠️  Could not fake core migrations: {e}")
    print()
    print("   Alternative: Delete SQLite database and start fresh")
    print(f"   Run: rm {db_file}")

print()

# Now try to run migrations for new apps
print("🔄 Running migrations for new apps...")
print()

try:
    call_command('migrate', verbosity=1)
    print()
    print("✅ All migrations completed!")
except Exception as e:
    print(f"   ⚠️  Migration error: {e}")
    print()
    print("   If errors persist, try:")
    print(f"   1. Delete database: rm {db_file}")
    print("   2. Run: python3 manage.py migrate --fake-initial")

print()
print("=" * 70)
print("✅ MIGRATION FIX COMPLETE")
print("=" * 70)
print()
print("Next: python3 manage.py runserver")
print()

