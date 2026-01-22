#!/usr/bin/env python
"""Simple fix: Drop and recreate partner table"""
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

print("🔧 Fixing partner table...")
print()

with connection.cursor() as cursor:
    # Drop the old table and indexes
    print("🗑️  Dropping old core_partner table...")
    cursor.execute("DROP TABLE IF EXISTS core_partner")
    cursor.execute("DROP INDEX IF EXISTS core_partner_verific_d03d23_idx")
    cursor.execute("DROP INDEX IF EXISTS core_partner_slug_4e9d41_idx")
    print("✅ Dropped")

print()
print("🔄 Creating new table with partners migration...")
call_command('migrate', 'partners', verbosity=1)

print()
print("✅ Done! The partner table now has all required fields including 'slug'")
print()
print("Try accessing /partners/ again - it should work now! 🎉")

