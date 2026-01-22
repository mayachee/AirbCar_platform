# Quick Fix for Partner Table Error

## The Error
```
sqlite3.OperationalError: no such column: core_partner.slug
```

## The Problem
The `core_partner` table exists (from old core migrations) but is missing the `slug` column that the new Partner model needs.

## Quick Fix - Option 1 (Recommended)

**Drop and recreate the table:**

```bash
cd backend
python3 -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()
from django.db import connection
with connection.cursor() as c:
    c.execute('DROP TABLE IF EXISTS core_partner')
    c.execute('DROP TABLE IF EXISTS core_partner_verific_d03d23_idx')
    c.execute('DROP TABLE IF EXISTS core_partner_slug_4e9d41_idx')
print('✅ Tables dropped')
"
python3 manage.py migrate partners
```

## Quick Fix - Option 2 (Automated)

Run the fix script:

```bash
cd backend
python3 fix_partner_table.py
```

This will:
1. Check the table state
2. Ask if you want to drop/recreate
3. Apply the migration

## Quick Fix - Option 3 (Fresh Start)

Delete database and start fresh:

```bash
cd backend
rm db.sqlite3
python3 manage.py migrate --fake-initial
```

## Why This Happened

1. Old `core` migrations created `core_partner` table (without slug)
2. New `partners` migration expects to create table with slug
3. Table already exists, so migration doesn't run
4. Model tries to use slug → error

**Solution:** Drop the old table and let the new migration create it properly.

## After Fixing

The `/partners/` endpoint should work! 🎉

