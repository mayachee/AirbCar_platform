# AirBcar API Architecture & Testing Flow

## 🏗️ API Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    AIRBCAR PLATFORM API                         │
│                  (51 Endpoints, 5 Key Modules)                  │
└────────────────────────────────────────────────────────────────┘

                              BASE URL
                   http://localhost:8000/api/
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼─────────┐  ┌────▼──────────┐  ┌──▼──────────┐
        │   HEALTH (1)    │  │ AUTH SYSTEM   │  │  CORE DATA  │
        │   - Health Check│  │   (9 Auth)    │  │  MANAGEMENT │
        │                 │  │               │  │   (23 CRUD) │
        └─────────────────┘  └────┬──────────┘  └──┬───────────┘
                                  │                 │
                          ┌───────┴──────────┐     │
                          │                  │     │
                    ┌─────▼──────────┐  ┌───▼─────▼────────┐
                    │  LOGIN/LOGOUT  │  │  USERS, LISTINGS,│
                    │  REGISTER      │  │  BOOKINGS, FAV   │
                    │  TOKENS        │  │  REVIEWS,        │
                    │  PASSWORD RST  │  │  PARTNERS        │
                    │  EMAIL VERIFY  │  │                  │
                    │  GOOGLE AUTH   │  │  NOTIFICATIONS   │
                    └────────────────┘  └──────────────────┘

                              FEATURES
                ┌─────────────────────────────────────┐
                │                                     │
        ┌───────▼────────┐  ┌──────────────┐  ┌─────▼────────┐
        │  RESERVATION   │  │   PARTNER    │  │   CUSTOMER   │
        │   MANAGEMENT   │  │   EARNINGS   │  │   PROFILE    │
        │                │  │   & STATS    │  │   MANAGEMENT │
        │  - Bookings    │  │              │  │              │
        │  - Favorites   │  │  - Analytics │  │  - Settings  │
        │  - Reviews     │  │  - Revenue   │  │  - Docs      │
        │                │  │  - Reviews   │  │  - History   │
        └────────────────┘  └──────────────┘  └──────────────┘

                         ADMIN DASHBOARD
                   ┌──────────────────────────┐
                   │   - Platform Stats       │
                   │   - Revenue Tracking     │
                   │   - Analytics            │
                   │   - User Management      │
                   └──────────────────────────┘
```

---

## 🔄 Complete User Journey & API Flow

### **1. Registration & Authentication Flow**

```
┌─ USER REGISTERS ──────────────────────┐
│                                       │
│  1. POST /api/register/               │
│     ├─ Submit email, password, name   │
│     └─ Receive: access_token, user    │
│                                       │
├─ VERIFY EMAIL                        │
│  2. POST /api/verify-email/           │
│     ├─ Check verification code        │
│     └─ Email marked as verified       │
│                                       │
├─ LOGIN (Alternative)                 │
│  3. POST /api/login/                  │
│     ├─ Submit email, password         │
│     └─ Receive: tokens                │
│                                       │
└─ TOKEN MANAGEMENT                    │
   4. POST /api/token/refresh/          │
      ├─ Submit refresh_token           │
      └─ Receive: new access_token      │
```

### **2. User Profile & Identity Management**

```
┌─ SETUP PROFILE ─────────────────┐
│  1. GET /api/users/me/          │
│     └─ Retrieve current profile  │
│                                 │
├─ UPDATE PROFILE                │
│  2. PATCH /api/users/me/        │
│     ├─ Update personal info      │
│     ├─ Upload license docs       │
│     └─ Update preferences        │
│                                 │
├─ CHANGE PASSWORD               │
│  3. POST /api/users/me/         │
│     │    change-password/       │
│     └─ Secure password change   │
│                                 │
└─ VIEW STATS                    │
   4. GET /api/users/me/stats/   │
      └─ Bookings, reviews, etc  │
```

### **3. Car Search & Listing Workflow**

```
┌─ SEARCH LISTINGS ──────────────────┐
│  1. GET /api/listings/             │
│     ├─ Search by brand/model       │
│     ├─ Filter by price, location   │
│     └─ Paginated results           │
│                                    │
├─ VIEW LISTING DETAILS            │
│  2. GET /api/listings/<id>/       │
│     ├─ Full car details            │
│     ├─ Images                      │
│     ├─ Partner info                │
│     └─ Reviews & ratings           │
│                                    │
└─ FAVORITE (Optional)             │
   3. POST /api/favorites/          │
      └─ Save to favorites          │
```

### **4. Booking Lifecycle**

```
┌─ CREATE BOOKING ────────────────────┐
│  1. POST /api/bookings/             │
│     ├─ Select dates, car            │
│     ├─ Review price                 │
│     └─ Submit booking request       │
│        Status: PENDING              │
│                                     │
├─ WAIT FOR PARTNER RESPONSE         │
│  2. GET /api/bookings/<id>/         │
│     └─ Check booking status         │
│                                     │
├─ PARTNER ACCEPTS/REJECTS          │
│  3a. POST /api/bookings/<id>/accept/│
│      └─ Status: ACCEPTED            │
│                                     │
│  3b. POST /api/bookings/<id>/reject/│
│      └─ Status: REJECTED            │
│                                     │
├─ USE CAR (Hypothetical)            │
│  4. Booking period occurs            │
│     └─ Status: COMPLETED            │
│                                     │
└─ CANCEL (If needed)                │
   5. POST /api/bookings/<id>/cancel/ │
      └─ Refund processed            │
```

### **5. Reviews & Ratings**

```
┌─ CHECK ELIGIBILITY ────────────────┐
│  1. GET /api/reviews/can_review/   │
│     ├─ Has completed booking?       │
│     └─ Not reviewed yet?            │
│                                    │
├─ LEAVE REVIEW                     │
│  2. POST /api/reviews/             │
│     ├─ Rating (1-5)                │
│     ├─ Comment                     │
│     └─ Recommendation              │
│        ↓                           │
│        Partner rating updated      │
│        Average recalculated        │
│                                    │
└─ VIEW REVIEWS                     │
   3. GET /api/reviews/              │
      ├─ By listing                  │
      ├─ By partner                  │
      └─ Filtered by rating          │
```

### **6. Partner Registration & Management**

```
┌─ BECOME PARTNER ────────────────────┐
│  1. POST /api/partners/             │
│     ├─ Company name                 │
│     ├─ Description                  │
│     ├─ Upload logo                  │
│     └─ User role → "partner"        │
│                                     │
├─ SETUP FLEET                       │
│  2. POST /api/listings/             │
│     ├─ Add each vehicle             │
│     ├─ Set pricing                  │
│     └─ Upload photos               │
│                                     │
├─ MANAGE BOOKINGS                  │
│  3a. GET /api/bookings/             │
│       pending-requests/             │
│       └─ Review new requests        │
│                                     │
│  3b. POST /api/bookings/<id>/       │
│       accept/ or /reject/           │
│       └─ Accept/reject requests     │
│                                     │
├─ VIEW EARNINGS                     │
│  4. GET /api/partners/me/earnings/  │
│     ├─ Total revenue                │
│     ├─ Pending payments             │
│     └─ Payment history              │
│                                     │
├─ CHECK ANALYTICS                   │
│  5. GET /api/partners/me/analytics/ │
│     ├─ Acceptance rate              │
│     ├─ Revenue trends               │
│     └─ Customer feedback            │
│                                     │
└─ MANAGE PROFILE                    │
   6. PUT /api/partners/me/           │
      └─ Update company info          │
```

---

## 🧪 Testing Flow & Execution Order

```
┌────────────────────────────────────────────────────┐
│            START: PRE-TEST VERIFICATION             │
├────────────────────────────────────────────────────┤
│  • Backend running?                                 │
│  • Database migrated?                               │
│  • Environment variables set?                       │
│  • Postman collection imported?                     │
│  • Test data prepared?                              │
└──────────────────┬─────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ PHASE 1: HEALTH (5m) │
        │ GET /api/health/    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │ PHASE 2: AUTH (1 hour)   │
        │ • Register              │
        │ • Login                 │
        │ • Token mgmt            │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ PHASE 3: USERS (45 min)      │
        │ • Profile CRUD              │
        │ • Change password           │
        │ • View stats                │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ PHASE 4: LISTINGS (45 min)   │
        │ • List cars                 │
        │ • Search & filter           │
        │ • View details              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ PHASE 5: BOOKINGS (1 hour)   │
        │ • Create booking            │
        │ • List bookings             │
        │ • Accept/reject/cancel      │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────────┐
        │ PHASE 6: FAV & REVIEW (45 min)   │
        │ • Add to favorites              │
        │ • Leave reviews                 │
        │ • View reviews                  │
        └──────────┬──────────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ PHASE 7: PARTNERS (45 min)   │
        │ • Create partner profile    │
        │ • View earnings             │
        │ • Check analytics           │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼────────────────────┐
        │ PHASE 8: NOTIF & ADMIN (1 hr)  │
        │ • List notifications           │
        │ • Admin stats                  │
        │ • Admin analytics              │
        └──────────┬────────────────────┘
                   │
        ┌──────────▼──────────────────────┐
        │ PHASE 9: SECURITY (1 hour)       │
        │ • Auth bypass attempts          │
        │ • XSS/SQL injection             │
        │ • File upload security          │
        └──────────┬──────────────────────┘
                   │
        ┌──────────▼──────────────────────┐
        │ PHASE 10: INTEGRATION (1 hour)   │
        │ • End-to-end flows              │
        │ • Email notifications           │
        │ • File uploads                  │
        └──────────┬──────────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ DOCUMENTATION & SIGN-OFF     │
        │ • Issue tracking             │
        │ • Team reviews               │
        │ • Final approval             │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ DEPLOYMENT READY ✅           │
        └──────────────────────────────┘
```

---

## 📊 API Endpoints by Category

```
CATEGORY                COUNT    METHODS
─────────────────────────────────────────
System/Health            1       GET
Authentication           9       POST
User Management          6       GET, PUT, PATCH, POST
Listings                 5       GET, POST, PUT, PATCH, DELETE
Bookings                 8       GET, POST
Favorites                5       GET, POST, DELETE
Reviews                  3       GET, POST
Partners                 8       GET, POST, PUT, PATCH
Notifications            3       GET, POST
Admin                    3       GET
─────────────────────────────────────────
TOTAL                   51       All REST methods
```

---

## 🔐 Security Testing Coverage

```
┌─────────────────────────────────────┐
│    SECURITY TEST CATEGORIES          │
├─────────────────────────────────────┤
│                                     │
│  AUTHENTICATION                     │
│  ├─ Token validation                │
│  ├─ Token expiration                │
│  └─ Password hashing                │
│                                     │
│  AUTHORIZATION                      │
│  ├─ Role-based access               │
│  ├─ Resource ownership               │
│  └─ Permission enforcement          │
│                                     │
│  INPUT VALIDATION                   │
│  ├─ Email format                    │
│  ├─ Date validation                 │
│  ├─ String length limits            │
│  └─ Special characters              │
│                                     │
│  INJECTION ATTACKS                  │
│  ├─ SQL injection                   │
│  ├─ XSS (HTML injection)            │
│  ├─ Command injection               │
│  └─ Path traversal                  │
│                                     │
│  FILE UPLOADS                       │
│  ├─ File type validation            │
│  ├─ File size limits                │
│  ├─ Virus scanning                  │
│  └─ Safe storage                    │
│                                     │
│  DATA PROTECTION                    │
│  ├─ Sensitive data masking          │
│  ├─ No credentials in responses     │
│  ├─ HTTPS enforcement               │
│  └─ Secure headers                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 📈 Performance Testing Checklist

```
┌─────────────────────────────────────────┐
│    PERFORMANCE TARGETS & MONITORING      │
├─────────────────────────────────────────┤
│                                         │
│  Single Object Retrieval                │
│  └─ Target: < 200ms (✓ pass if met)    │
│                                         │
│  List Operations (10 items)             │
│  └─ Target: < 500ms (✓ pass if met)    │
│                                         │
│  Create Operations                      │
│  └─ Target: < 500ms (✓ pass if met)    │
│                                         │
│  File Uploads                           │
│  └─ Target: < 5s (✓ pass if met)       │
│                                         │
│  Database Queries                       │
│  └─ Target: < 100ms (✓ pass if met)    │
│                                         │
│  Concurrent Requests (10 users)         │
│  └─ All should succeed without timeout │
│                                         │
│  Concurrent Requests (50 users)         │
│  └─ All should succeed without timeout │
│                                         │
│  Pagination Limits                      │
│  └─ Max 100 items per request enforced │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Testing Success Metrics

```
TEST SUITE RESULTS
┌──────────────────────────────────────┐
│ METRIC              │ TARGET │ RESULT │
├──────────────────────────────────────┤
│ Pass Rate           │  100%  │  _____ │
│ Critical Issues     │    0   │  _____ │
│ Major Issues        │    0   │  _____ │
│ Minor Issues        │   < 5  │  _____ │
│ Code Coverage       │  > 80% │  _____ │
│ Performance         │  > 95% │  _____ │
│ Security Compliance │  100%  │  _____ │
│ Auth Tests Pass     │  100%  │  _____ │
│ API Tests Pass      │  100%  │  _____ │
│ Integration Pass    │  100%  │  _____ │
└──────────────────────────────────────┘
```

---

## 📍 API Response Standard

```
SUCCESS RESPONSE (200, 201)
┌─────────────────────────────────┐
│ {                               │
│   "id": 1,                      │
│   "data": {...},                │
│   "message": "Success"          │
│ }                               │
└─────────────────────────────────┘

ERROR RESPONSE (400, 401, 403, etc)
┌─────────────────────────────────┐
│ {                               │
│   "error": "Error type",        │
│   "detail": "Specific message", │
│   "status": 400,                │
│   "timestamp": "2025-02-04..."  │
│ }                               │
└─────────────────────────────────┘

PAGINATED RESPONSE
┌─────────────────────────────────┐
│ {                               │
│   "count": 100,                 │
│   "next": "...?page=2",         │
│   "previous": null,             │
│   "results": [...]              │
│ }                               │
└─────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

```
BEFORE PRODUCTION DEPLOYMENT

□ All 51 endpoints documented
□ All 150+ test cases executed
□ Health check passes
□ Authentication working
□ Authorization enforced
□ Data validation complete
□ Security audit passed
□ Performance tests passed
□ No SQL injection vulnerabilities
□ No XSS vulnerabilities
□ File uploads secure
□ Error handling comprehensive
□ Database transactions correct
□ Email notifications working
□ Supabase storage configured
□ HTTPS enforced
□ CORS configured
□ Rate limiting ready
□ Monitoring setup
□ Logging enabled
□ Backup configured
□ Team trained
□ Documentation complete
□ Sign-offs obtained

IF ALL CHECKED: ✅ READY FOR PRODUCTION
```

---

**Document**: API Architecture & Testing Flow
**Status**: Ready for Execution
**Date**: February 4, 2026
