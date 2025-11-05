# Quick Start: Public Partner Profile

## 🚀 Quick Example

### Step 1: Create a Test Partner (Django Shell)

```bash
cd backend/airbcar_backend
python manage.py shell
```

Then run:

```python
from core.models import Partner, User, Listing

# Create user
user = User.objects.create_user(
    email='testpartner@example.com',
    username='testpartner',
    first_name='Test',
    last_name='Partner',
    is_partner=True
)

# Create partner (slug will be auto-generated)
partner = Partner.objects.create(
    user=user,
    company_name='Test Car Rental',
    tax_id='TAX123',
    verification_status='approved',
    agree_on_terms=True,
    description='A test car rental company for demonstration purposes.',
    phone='+212 6XX XXX XXX',
    address='123 Test Street, Casablanca, Morocco',
    website='https://example.com',
    logo='https://via.placeholder.com/200'
)

# The slug will be auto-generated as "test-car-rental"
print(f"Partner created with slug: {partner.slug}")
print(f"Access at: http://localhost:3000/partner/{partner.slug}")
```

### Step 2: Test the API

```bash
# Using curl
curl http://localhost:8000/partners/public/test-car-rental/

# Or using Python script
python test_partner_profile.py test-car-rental
```

### Step 3: View in Browser

Open: `http://localhost:3000/partner/test-car-rental`

---

## 📸 Example URLs

### API Endpoint
```
GET http://localhost:8000/partners/public/acme-car-rental/
```

### Frontend Page
```
http://localhost:3000/partner/acme-car-rental
```

---

## 🎯 Example Response

```json
{
  "id": 1,
  "company_name": "ACME Car Rental",
  "slug": "acme-car-rental",
  "description": "Premium car rental service...",
  "logo": "https://example.com/logo.png",
  "website": "https://www.acmecarrental.com",
  "phone": "+212 6XX XXX XXX",
  "address": "123 Avenue Mohammed V, Casablanca",
  "verification_status": "approved",
  "total_listings": 5,
  "average_rating": 4.7,
  "listings": [...]
}
```

---

## 🔗 Link to Partner from Anywhere

```jsx
// In any component
import Link from 'next/link';

<Link href={`/partner/${partnerSlug}`}>
  View Partner Profile
</Link>
```

---

## ✅ Quick Test Checklist

1. ✅ Run migration: `python manage.py migrate`
2. ✅ Create a partner with `verification_status='approved'`
3. ✅ Partner should have a slug (auto-generated)
4. ✅ Test API: `GET /partners/public/{slug}/`
5. ✅ Visit frontend: `http://localhost:3000/partner/{slug}`

That's it! 🎉


