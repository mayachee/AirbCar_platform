#!/usr/bin/env python
"""Run this once to fix the database - it will work automatically after"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.core.management import call_command

print("=" * 70)
print("🔧 FIXING DATABASE (ONE-TIME FIX)")
print("=" * 70)
print()

# Run the management command
call_command('fix_database_schema', verbosity=2)

print()
print("=" * 70)
print("✅ DONE!")
print("=" * 70)
print()
print("The database is now fixed. Restart your server:")
print("  python3 manage.py runserver")
print()
print("Future fixes will happen automatically on server startup.")
print()

