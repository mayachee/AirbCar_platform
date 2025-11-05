# Public Partner Profile - Examples

## 📋 Table of Contents
- [API Endpoint](#api-endpoint)
- [Example API Response](#example-api-response)
- [Frontend URL](#frontend-url)
- [Testing the Endpoint](#testing-the-endpoint)
- [Creating Example Partner Data](#creating-example-partner-data)

---

## 🔗 API Endpoint

### Get Public Partner Profile by Slug

**Endpoint:** `GET /partners/public/{slug}/`

**Example URL:**
```
http://localhost:8000/partners/public/acme-car-rental/
```

**Authentication:** Not required (public endpoint)

**Response Codes:**
- `200 OK` - Partner profile found and returned
- `404 Not Found` - Partner not found or not approved

---

## 📄 Example API Response

### Success Response (200 OK)

```json
{
  "id": 1,
  "company_name": "ACME Car Rental",
  "slug": "acme-car-rental",
  "description": "Premium car rental service in Morocco. We offer a wide selection of vehicles from economy to luxury, all maintained to the highest standards. Book with confidence and experience the best rental service in the region.",
  "logo": "https://example.com/logos/acme-logo.png",
  "website": "https://www.acmecarrental.com",
  "phone": "+212 6XX XXX XXX",
  "address": "123 Avenue Mohammed V, Casablanca, Morocco",
  "verification_status": "approved",
  "created_at": "2024-01-15T10:30:00Z",
  "total_listings": 12,
  "average_rating": 4.7,
  "user": {
    "first_name": "Ahmed",
    "last_name": "Benali",
    "profile_picture": "https://example.com/profiles/ahmed.jpg"
  },
  "listings": [
    {
      "id": 101,
      "make": "Toyota",
      "model": "Corolla",
      "year": 2023,
      "location": "Casablanca",
      "price_per_day": "45.00",
      "pictures": [
        "https://example.com/cars/toyota-corolla-1.jpg",
        "https://example.com/cars/toyota-corolla-2.jpg"
      ],
      "rating": 4.8
    },
    {
      "id": 102,
      "make": "Mercedes-Benz",
      "model": "C-Class",
      "year": 2024,
      "location": "Casablanca",
      "price_per_day": "120.00",
      "pictures": [
        "https://example.com/cars/mercedes-c-class-1.jpg"
      ],
      "rating": 4.9
    },
    {
      "id": 103,
      "make": "BMW",
      "model": "3 Series",
      "year": 2023,
      "location": "Rabat",
      "price_per_day": "110.00",
      "pictures": [
        "https://example.com/cars/bmw-3series-1.jpg"
      ],
      "rating": 4.7
    }
  ]
}
```

### Error Response (404 Not Found)

```json
{
  "error": "Partner not found"
}
```

or

```json
{
  "error": "Partner profile not available"
}
```

---

## 🌐 Frontend URL

### Example Frontend URLs

```
http://localhost:3000/partner/acme-car-rental
http://localhost:3000/partner/premium-rentals
http://localhost:3000/partner/morocco-auto-services
```

---

## 🧪 Testing the Endpoint

### Using cURL

```bash
# Test with curl
curl http://localhost:8000/partners/public/acme-car-rental/

# With pretty JSON formatting
curl http://localhost:8000/partners/public/acme-car-rental/ | python -m json.tool
```

### Using JavaScript/Fetch

```javascript
// Frontend example
const slug = 'acme-car-rental';
const apiUrl = 'http://localhost:8000';

fetch(`${apiUrl}/partners/public/${slug}/`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Partner not found');
    }
    return response.json();
  })
  .then(data => {
    console.log('Partner Profile:', data);
    console.log('Company:', data.company_name);
    console.log('Total Vehicles:', data.total_listings);
    console.log('Average Rating:', data.average_rating);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Using Python Requests

```python
import requests

slug = 'acme-car-rental'
api_url = 'http://localhost:8000'

response = requests.get(f'{api_url}/partners/public/{slug}/')

if response.status_code == 200:
    partner = response.json()
    print(f"Company: {partner['company_name']}")
    print(f"Description: {partner['description']}")
    print(f"Total Listings: {partner['total_listings']}")
    print(f"Average Rating: {partner['average_rating']}")
else:
    print(f"Error: {response.status_code} - {response.json()}")
```

### Using Postman

1. **Method:** GET
2. **URL:** `http://localhost:8000/partners/public/acme-car-rental/`
3. **Headers:** None required (no authentication)
4. **Body:** None

---

## 📝 Creating Example Partner Data

### Using Django Shell

```python
# Run: python manage.py shell

from core.models import Partner, User, Listing

# Create or get a user
user, created = User.objects.get_or_create(
    email='partner@example.com',
    defaults={
        'username': 'partner_user',
        'first_name': 'Ahmed',
        'last_name': 'Benali',
        'is_partner': True
    }
)

# Create a partner with public profile data
partner, created = Partner.objects.get_or_create(
    user=user,
    defaults={
        'company_name': 'ACME Car Rental',
        'tax_id': 'TAX123456',
        'verification_status': 'approved',
        'agree_on_terms': True,
        'slug': 'acme-car-rental',  # Will be auto-generated if not provided
        'description': 'Premium car rental service in Morocco. We offer a wide selection of vehicles from economy to luxury.',
        'logo': 'https://example.com/logos/acme-logo.png',
        'website': 'https://www.acmecarrental.com',
        'phone': '+212 6XX XXX XXX',
        'address': '123 Avenue Mohammed V, Casablanca, Morocco'
    }
)

# Create some listings for this partner
listing1 = Listing.objects.create(
    partner=partner,
    make='Toyota',
    model='Corolla',
    year=2023,
    location='Casablanca',
    price_per_day=45.00,
    fuel_type='Gasoline',
    transmission='Automatic',
    seating_capacity=5,
    vehicle_condition='Excellent',
    vehicle_description='Clean and well-maintained Toyota Corolla',
    rating=4.8,
    pictures=['https://example.com/cars/toyota-corolla-1.jpg'],
    availability=True
)

listing2 = Listing.objects.create(
    partner=partner,
    make='Mercedes-Benz',
    model='C-Class',
    year=2024,
    location='Casablanca',
    price_per_day=120.00,
    fuel_type='Gasoline',
    transmission='Automatic',
    seating_capacity=5,
    vehicle_condition='Excellent',
    vehicle_description='Luxury Mercedes-Benz C-Class',
    rating=4.9,
    pictures=['https://example.com/cars/mercedes-c-class-1.jpg'],
    availability=True
)

print(f"Partner created: {partner.company_name}")
print(f"Slug: {partner.slug}")
print(f"Public URL: http://localhost:3000/partner/{partner.slug}")
print(f"API URL: http://localhost:8000/partners/public/{partner.slug}/")
```

### Using Django Admin

1. Go to Django Admin: `http://localhost:8000/admin/`
2. Navigate to **Core > Partners**
3. Create or edit a partner
4. Fill in the public profile fields:
   - **Slug:** (auto-generated from company name)
   - **Description:** Company description
   - **Logo:** URL to company logo
   - **Website:** Company website URL
   - **Phone:** Contact phone number
   - **Address:** Business address
5. Set **Verification status** to "approved"
6. Save

---

## 🎨 Frontend Example Usage

### Example: Link to Partner Profile

```jsx
// In a component showing a listing
import Link from 'next/link';

function ListingCard({ listing }) {
  return (
    <div className="listing-card">
      <h3>{listing.make} {listing.model}</h3>
      <p>Price: ${listing.price_per_day}/day</p>
      
      {/* Link to partner profile */}
      {listing.partner?.slug && (
        <Link href={`/partner/${listing.partner.slug}`}>
          <a className="text-orange-500 hover:underline">
            View Partner Profile →
          </a>
        </Link>
      )}
    </div>
  );
}
```

### Example: Display Partner Info in Listing Page

```jsx
// In car/[id]/page.js
function CarDetails({ vehicle }) {
  const [partner, setPartner] = useState(null);
  
  useEffect(() => {
    if (vehicle.partner_id) {
      fetch(`${API_BASE_URL}/partners/public/${vehicle.partner_slug}/`)
        .then(res => res.json())
        .then(data => setPartner(data));
    }
  }, [vehicle]);
  
  return (
    <div>
      {/* Car details */}
      
      {/* Partner section */}
      {partner && (
        <div className="partner-section">
          <h3>Rented by {partner.company_name}</h3>
          <Link href={`/partner/${partner.slug}`}>
            <a>View Full Profile →</a>
          </Link>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Checklist for Testing

- [ ] Partner has `verification_status = 'approved'`
- [ ] Partner has a `slug` (auto-generated or manually set)
- [ ] Partner has at least one listing
- [ ] Backend server is running on `http://localhost:8000`
- [ ] Frontend server is running on `http://localhost:3000`
- [ ] Test API endpoint: `GET /partners/public/{slug}/`
- [ ] Test frontend page: `http://localhost:3000/partner/{slug}`

---

## 🔍 Debugging Tips

1. **Check if slug exists:**
   ```python
   Partner.objects.filter(slug='your-slug').exists()
   ```

2. **Check verification status:**
   ```python
   partner = Partner.objects.get(slug='your-slug')
   print(partner.verification_status)  # Should be 'approved'
   ```

3. **Regenerate slug for existing partners:**
   ```python
   partner = Partner.objects.get(id=1)
   partner.slug = None  # Clear slug
   partner.save()  # Auto-generate new slug
   ```

4. **Check API endpoint in browser:**
   ```
   http://localhost:8000/partners/public/acme-car-rental/
   ```

---

## 📚 Additional Notes

- Slugs are **auto-generated** from company names when partners are saved
- Only **approved** partners are visible in public profiles
- Public profiles **exclude sensitive data** like tax_id and verification documents
- The endpoint is **public** (no authentication required)
- Slugs should be **URL-friendly** (lowercase, hyphens, no special characters)


