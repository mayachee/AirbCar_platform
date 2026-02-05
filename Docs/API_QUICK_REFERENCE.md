# AirBcar API - Quick Reference Card

**Base URL**: `http://localhost:8000` (local) | `https://yourdomain.com` (production)
**API Version**: v1 | **Last Updated**: February 4, 2026

---

## 📊 API ENDPOINTS SUMMARY (51 Total)

```
┌─────────────────────────────────────────────────────────────┐
│                  HEALTH & STATUS (1)                        │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/health/               │ 🔓 Public  │ Server OK   │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION (9)                         │
├──────────────────────────────────┬────────────┬─────────────┤
│ POST  /api/register/             │ 🔓 Public  │ Create user │
│ POST  /api/login/                │ 🔓 Public  │ Auth user   │
│ POST  /api/token/refresh/        │ 🔓 Public  │ New token   │
│ POST  /api/verify-token/         │ 🔐 Auth    │ Check token │
│ POST  /api/verify-email/         │ 🔓 Public  │ Verify code │
│ POST  /api/resend-verification/  │ 🔓 Public  │ Resend code │
│ POST  /api/password-reset/       │ 🔓 Public  │ Reset link  │
│ POST  /api/password-reset/confirm/│ 🔓 Public │ Confirm pwd │
│ POST  /api/auth/google/          │ 🔓 Public  │ OAuth token │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  USERS (6)                                  │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/users/                │ 🔓 Public  │ List users  │
│ GET   /api/users/me/             │ 🔐 Auth    │ My profile  │
│ PUT   /api/users/me/             │ 🔐 Auth    │ Update me   │
│ PATCH /api/users/me/             │ 🔐 Auth    │ Partial upd │
│ GET   /api/users/me/stats/       │ 🔐 Auth    │ My stats    │
│ POST  /api/users/me/change-password/ │ 🔐 Auth │ Change pwd │
│ GET   /api/users/<id>/           │ 🔓 Public  │ User detail │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  LISTINGS (5)                               │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/listings/             │ 🔓 Public  │ List cars   │
│ POST  /api/listings/             │ 🔐 Partner │ Create      │
│ GET   /api/listings/<id>/        │ 🔓 Public  │ Details     │
│ PUT   /api/listings/<id>/        │ 🔐 Owner   │ Update      │
│ PATCH /api/listings/<id>/        │ 🔐 Owner   │ Partial     │
│ DELETE /api/listings/<id>/       │ 🔐 Owner   │ Delete      │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  BOOKINGS (8)                               │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/bookings/             │ 🔐 Auth    │ My bookings │
│ POST  /api/bookings/             │ 🔐 Auth    │ Create book │
│ GET   /api/bookings/<id>/        │ 🔐 Auth    │ Book detail │
│ GET   /api/bookings/pending-requests/ │ 🔐 Partner │ Pending │
│ GET   /api/bookings/upcoming/    │ 🔐 Auth    │ My upcoming │
│ POST  /api/bookings/<id>/accept/ │ 🔐 Partner │ Accept req  │
│ POST  /api/bookings/<id>/reject/ │ 🔐 Partner │ Reject req  │
│ POST  /api/bookings/<id>/cancel/ │ 🔐 Auth    │ Cancel book │
│ GET   /api/bookings/<id>/customer-info/ │ 🔐 Partner │ Cust info │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  FAVORITES (5)                              │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/favorites/            │ 🔐 Auth    │ List favs   │
│ GET   /api/favorites/my-favorites/ │ 🔐 Auth  │ My favs     │
│ POST  /api/favorites/            │ 🔐 Auth    │ Add to fav  │
│ POST  /api/favorites/my-favorites/ │ 🔐 Auth  │ Add to fav  │
│ GET   /api/favorites/<id>/       │ 🔐 Auth    │ Fav detail  │
│ DELETE /api/favorites/<id>/      │ 🔐 Auth    │ Remove fav  │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  REVIEWS (3)                                │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/reviews/              │ 🔓 Public  │ List review │
│ POST  /api/reviews/              │ 🔐 Auth    │ Create rev  │
│ GET   /api/reviews/can_review/   │ 🔐 Auth    │ Can I review│
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  PARTNERS (8)                               │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/partners/             │ 🔓 Public  │ List part   │
│ POST  /api/partners/             │ 🔐 Auth    │ Create part │
│ GET   /api/partners/me/          │ 🔐 Partner │ My profile  │
│ PUT   /api/partners/me/          │ 🔐 Partner │ Update      │
│ PATCH /api/partners/me/          │ 🔐 Partner │ Partial     │
│ GET   /api/partners/me/earnings/ │ 🔐 Partner │ Earnings    │
│ GET   /api/partners/me/analytics/│ 🔐 Partner │ Analytics   │
│ GET   /api/partners/me/reviews/  │ 🔐 Partner │ My reviews  │
│ GET   /api/partners/me/activity/ │ 🔐 Partner │ Activity    │
│ GET   /api/partners/<id>/        │ 🔓 Public  │ Partner det │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  NOTIFICATIONS (3)                          │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/notifications/        │ 🔐 Auth    │ List notifs │
│ POST  /api/notifications/<id>/read/ │ 🔐 Auth │ Mark read   │
│ POST  /api/notifications/read-all/  │ 🔐 Auth │ Mark all    │
└──────────────────────────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ADMIN (3)                                  │
├──────────────────────────────────┬────────────┬─────────────┤
│ GET   /api/admin/stats/          │ 🔐 Admin   │ Stats       │
│ GET   /api/admin/analytics/      │ 🔐 Admin   │ Analytics   │
│ GET   /api/admin/revenue/        │ 🔐 Admin   │ Revenue     │
└──────────────────────────────────┴────────────┴─────────────┘
```

---

## 🔐 Authentication

### Obtain Token
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Use Token in Requests
```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"eyJ0eXAiOiJKV1QiLCJhbGc..."}'
```

---

## 📝 Common Request/Response Examples

### Create Booking
```bash
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "start_date": "2025-03-01",
    "end_date": "2025-03-05",
    "special_requests": "Extra insurance"
  }'
```

### Response
```json
{
  "id": 42,
  "listing_id": 1,
  "customer": {
    "id": 10,
    "email": "customer@example.com",
    "first_name": "John"
  },
  "partner": {
    "id": 5,
    "company_name": "Premium Cars"
  },
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "total_price": 500.00,
  "status": "pending",
  "created_at": "2025-02-04T12:00:00Z"
}
```

---

## 🔍 Query Parameters

### Pagination
```
?page=1&limit=10
```

### Filtering
```
?status=pending&search=Tesla&price_min=0&price_max=1000
```

### Common Parameters by Endpoint
```
Listings:     ?page=1&search=model&price_min=0&price_max=10000
Bookings:     ?page=1&status=pending
Notifications: ?page=1&unread_only=true
Reviews:      ?page=1&rating=5
Partners:     ?page=1&search=company_name
```

---

## ⚡ Quick Curl Commands

### Health Check
```bash
curl http://localhost:8000/api/health/
```

### Get All Listings (First 10)
```bash
curl http://localhost:8000/api/listings/?limit=10
```

### Get My Bookings (Authenticated)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/bookings/
```

### Update My Profile
```bash
curl -X PATCH http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+1234567890","first_name":"John"}'
```

### Upload License Document
```bash
curl -X PATCH http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "license_front_document=@/path/to/license_front.jpg" \
  -F "license_back_document=@/path/to/license_back.jpg"
```

---

## 🐛 Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | Successful GET/PATCH/DELETE |
| **201** | Created | Successful POST (resource created) |
| **204** | No Content | Successful DELETE (no response body) |
| **400** | Bad Request | Invalid input data |
| **401** | Unauthorized | Missing/invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Business logic violation (e.g., duplicate) |
| **500** | Server Error | Unexpected backend error |

### Error Response Example
```json
{
  "error": "Invalid email or password",
  "detail": "Authentication failed",
  "status": 401,
  "timestamp": "2025-02-04T12:00:00Z"
}
```

---

## 🚀 Status Legend

- 🔓 **Public** - No authentication required
- 🔐 **Auth** - JWT token required (any authenticated user)
- 🔐 **Partner** - JWT token + Partner role required
- 🔐 **Owner** - JWT token + Resource owner/Partner owner required
- 🔐 **Admin** - JWT token + Admin role required

---

## 📱 Common Use Cases

### 1. User Registration & Login Flow
```
1. POST /api/register/          → Get access_token
2. GET  /api/users/me/          → Verify user
3. PATCH /api/users/me/         → Complete profile
```

### 2. Search & Book Car Flow
```
1. GET  /api/listings/          → Find cars
2. GET  /api/listings/<id>/     → View details
3. POST /api/bookings/          → Create booking
4. GET  /api/bookings/<id>/     → Check status
```

### 3. Partner Setup & Earn Flow
```
1. POST /api/partners/          → Create partner profile
2. POST /api/listings/          → Add cars
3. GET  /api/bookings/pending-requests/ → Review requests
4. POST /api/bookings/<id>/accept/ → Accept booking
5. GET  /api/partners/me/earnings/ → Check earnings
```

### 4. Review & Rate Flow
```
1. GET  /api/reviews/can_review/ → Check eligibility
2. POST /api/reviews/            → Leave review
3. GET  /api/partners/<id>/      → Check partner rating
```

---

## 🧪 Testing Tools

### Recommended Tools
- **Postman** - Visual API testing & collection runner
- **Insomnia** - REST client with environment support
- **cURL** - Command-line HTTP client
- **HTTPie** - User-friendly HTTP CLI
- **Thunder Client** - VS Code extension

### Quick Test
```bash
# Install HTTPie
pip install httpie

# Test health endpoint
http GET localhost:8000/api/health/

# Test with auth
http GET localhost:8000/api/users/me/ \
  "Authorization: Bearer $TOKEN"
```

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Health Check | < 100ms |
| GET Single | < 200ms |
| GET List (10 items) | < 500ms |
| POST/PATCH | < 500ms |
| File Upload | < 5s |
| DB Query | < 100ms |

---

## 🔗 Useful Links

- [Full API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](API_TESTING_GUIDE.md)
- [Postman Collection](POSTMAN_COLLECTION_COMPLETE.json)
- [Backend README](backend/README.md)

---

**Version**: 1.0 | **Status**: Production Ready | **Last Updated**: Feb 4, 2026

