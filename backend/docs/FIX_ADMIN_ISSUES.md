# Fix Admin Dashboard Issues

## The Problems

1. **Adding Listing**: `no such column: core_partner.slug`
2. **Adding Booking**: `no such column: core_listing.pictures`

## The Cause

Old `core` migrations created tables without all the fields that new models need:
- `core_partner` missing `slug`, `phone`, `city`, etc.
- `core_listing` missing `pictures`, `fuel_type`, etc.

## The Solution

**Run this one command:**

```bash
cd backend
python3 fix_all_tables.py
```

This will:
1. ✅ Drop all old `core_*` tables
2. ✅ Recreate them with correct schema via new app migrations
3. ✅ All columns will be present

## What Gets Fixed

- ✅ `core_partner` - will have `slug`, `phone`, `city`, `state`, `zip_code`, etc.
- ✅ `core_listing` - will have `pictures`, `fuel_type`, `transmission`, etc.
- ✅ `core_booking` - will have all required fields
- ✅ `core_review` - will have all required fields
- ✅ `core_favorite` - will have all required fields

## After Running

You'll be able to:
- ✅ Add listings from admin dashboard
- ✅ Add bookings from admin dashboard
- ✅ Use all admin features without errors
- ✅ All API endpoints will work

## Alternative: Fresh Start

If you don't have important data:

```bash
cd backend
rm db.sqlite3
python3 manage.py migrate --fake-initial
```

This creates a completely fresh database with all tables correctly structured.

