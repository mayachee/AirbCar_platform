#!/usr/bin/env python
"""Run this before starting the server to auto-fix database"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

import django
django.setup()

from django.core.management import call_command

# Run the fix command
call_command('fix_database_schema')

