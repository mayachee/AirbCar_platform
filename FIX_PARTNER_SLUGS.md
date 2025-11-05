# Fix: Partner Profile 404 Error

## Problem
When accessing `/partner/47`, you get a 404 error because the endpoint expects a slug, not an ID.

## Solution Applied

### 1. Backend Fix ✅
The endpoint now accepts both **slug** and **ID**:
- First tries to find partner by slug
- If not found and parameter is numeric, tries to find by ID
- Works for both `/partners/public/acme-car-rental/` and `/partners/public/47/`

### 2. Frontend Fix ✅
The frontend now:
- Accepts both slug and ID in the URL
- Automatically redirects to the slug URL if accessed via ID
- Example: `/partner/47` → `/partner/acme-car-rental`

## How to Fix Existing Partners

If you have existing partners without slugs, run this in Django shell:

```python
from core.models import Partner

# Generate slugs for all partners without one
partners_without_slug = Partner.objects.filter(slug__isnull=True) | Partner.objects.filter(slug='')

for partner in partners_without_slug:
    # Clear slug to trigger auto-generation
    partner.slug = None
    partner.save()
    print(f"Generated slug '{partner.slug}' for {partner.company_name}")
```

## Testing

1. **Test with ID:**
   ```
   http://localhost:3000/partner/47
   ```
   Should redirect to slug URL if partner has slug.

2. **Test with slug:**
   ```
   http://localhost:3000/partner/acme-car-rental
   ```
   Should work directly.

3. **Test API directly:**
   ```bash
   curl http://localhost:8000/partners/public/47/
   curl http://localhost:8000/partners/public/acme-car-rental/
   ```

## Important Notes

- Partners **must** have `verification_status='approved'` to be visible publicly
- Slugs are **auto-generated** when partners are saved (if not provided)
- If a partner doesn't have a slug, it will be generated on next save


