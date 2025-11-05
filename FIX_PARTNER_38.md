# Fix Partner 38 - Step by Step Guide

## Quick Fix Commands

### Step 1: Check and Fix Partner 38

Run this in your terminal:

```bash
cd backend/airbcar_backend
python manage.py shell
```

Then paste this:

```python
from core.models import Partner

# Get partner 38
try:
    partner = Partner.objects.get(id=38)
    
    print(f"Company: {partner.company_name}")
    print(f"Status: {partner.verification_status}")
    print(f"Slug: {partner.slug or 'NOT SET'}")
    
    # Fix 1: Set to approved
    if partner.verification_status != 'approved':
        partner.verification_status = 'approved'
        print("✅ Set status to 'approved'")
    
    # Fix 2: Generate slug if missing
    if not partner.slug:
        partner.slug = None  # This triggers auto-generation
        print("✅ Generating slug...")
    
    partner.save()
    
    print(f"\n✅ Fixed! Partner slug: {partner.slug}")
    print(f"\n🌐 Access at:")
    print(f"   http://localhost:3000/partner/{partner.slug}")
    print(f"   http://localhost:8000/partners/public/{partner.slug}/")
    
except Partner.DoesNotExist:
    print("❌ Partner 38 does not exist!")
    print("\nAvailable partners:")
    for p in Partner.objects.all()[:10]:
        print(f"  ID {p.id}: {p.company_name}")
```

### Step 2: Run Migration (if not done)

```bash
cd backend/airbcar_backend
python manage.py migrate
```

### Step 3: Test the Endpoint

```bash
# Test with ID
curl http://localhost:8000/partners/public/38/

# Or using the test script
python test_partner_endpoint.py 38
```

### Step 4: Check in Browser

Visit: `http://localhost:3000/partner/38`

---

## Common Issues

### Issue 1: Partner doesn't exist
**Solution:** Check available partners:
```python
Partner.objects.all().values_list('id', 'company_name', 'verification_status')
```

### Issue 2: Partner not approved
**Solution:** Set verification_status to 'approved':
```python
partner = Partner.objects.get(id=38)
partner.verification_status = 'approved'
partner.save()
```

### Issue 3: No slug
**Solution:** Generate slug:
```python
partner = Partner.objects.get(id=38)
partner.slug = None  # Triggers auto-generation
partner.save()
print(f"Slug: {partner.slug}")
```

### Issue 4: Migration not run
**Solution:** Run migration:
```bash
python manage.py migrate
```

---

## Using the Helper Scripts

### Check Partner:
```bash
python check_partner.py 38
```

### Test Endpoint:
```bash
python test_partner_endpoint.py 38
```

---

## Expected Results

After fixing, you should see:
- ✅ Partner status: `approved`
- ✅ Partner has a slug (e.g., `company-name`)
- ✅ API endpoint works: `http://localhost:8000/partners/public/38/`
- ✅ Frontend works: `http://localhost:3000/partner/38`


