# AirBcar API - Professional Testing Guide

**Purpose**: Comprehensive testing suite for production-ready deployment
**Date**: February 4, 2026
**Audience**: QA Team, Developers, DevOps

---

## 📋 Testing Overview

This document provides a professional testing framework for all 51 AirBcar API endpoints. Tests cover:
- ✅ Happy path scenarios
- ✅ Error handling & edge cases
- ✅ Authentication & authorization
- ✅ Data validation
- ✅ Response format compliance
- ✅ Performance metrics
- ✅ Security compliance

---

## 🚀 Quick Start

### 1. Import Postman Collection
```
File → Import → POSTMAN_COLLECTION_COMPLETE.json
```

### 2. Set Environment Variables
```
base_url: http://localhost:8000
access_token: (auto-populated after login)
refresh_token: (auto-populated after login)
```

### 3. Run Full Test Suite
```
Collection → Run → Select all tests → Run
```

---

## 🧪 Detailed Testing Plan

### PHASE 1: AUTHENTICATION & AUTHORIZATION (Critical)

#### Test Case 1.1: User Registration
```
Endpoint: POST /api/register/
Method: POST
Status Expected: 201 or 200
Tests:
  ✓ Email validation (valid, invalid, duplicate)
  ✓ Password strength requirements
  ✓ Required fields presence
  ✓ Response contains access_token
  ✓ Response contains refresh_token
  ✓ User created in database
  ✓ Email verification email sent
```

**Test Data**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser123",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Edge Cases**:
- Empty email field
- Email already exists
- Password < 8 characters
- Missing required fields
- Invalid email format
- XSS injection in names
- SQL injection attempt

---

#### Test Case 1.2: User Login
```
Endpoint: POST /api/login/
Method: POST
Status Expected: 200
Tests:
  ✓ Valid credentials return tokens
  ✓ Invalid password rejected
  ✓ Non-existent email rejected
  ✓ Response includes user object
  ✓ Token is valid JWT format
  ✓ Refresh token is different from access token
```

**Test Data**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Edge Cases**:
- Empty credentials
- Case sensitivity (email)
- Whitespace in credentials
- Account lockout after N failed attempts
- SQL injection attempts
- Brute force protection

---

#### Test Case 1.3: Token Refresh
```
Endpoint: POST /api/token/refresh/
Method: POST
Status Expected: 200
Tests:
  ✓ Invalid refresh token rejected
  ✓ New access token is valid
  ✓ Old access token can still be used briefly
  ✓ Refresh token cannot be used for access
```

**Test Data**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

#### Test Case 1.4: Token Verification
```
Endpoint: POST /api/verify-token/
Method: POST
Status Expected: 200
Tests:
  ✓ Valid token returns true
  ✓ Invalid token returns false
  ✓ Expired token returns false
  ✓ Missing token returns 401
```

---

### PHASE 2: USER PROFILE MANAGEMENT

#### Test Case 2.1: Get Current User Profile
```
Endpoint: GET /api/users/me/
Method: GET
Status Expected: 200 (Authenticated), 401 (Not authenticated)
Tests:
  ✓ Requires valid token
  ✓ Returns authenticated user's data only
  ✓ Includes all user fields
  ✓ No sensitive data leakage
  ✓ Response time < 200ms
```

---

#### Test Case 2.2: Update User Profile
```
Endpoint: PATCH /api/users/me/
Method: PATCH / PUT
Status Expected: 200
Tests:
  ✓ Only authenticated user can update own profile
  ✓ Cannot update role or is_verified
  ✓ Phone number validated
  ✓ Date of birth format validated
  ✓ Profile picture URL validated
  ✓ License fields updated correctly
  ✓ File uploads to Supabase storage
  ✓ File URLs saved in database
```

**Test Data**:
```json
{
  "first_name": "John",
  "phone_number": "+1234567890",
  "date_of_birth": "1990-01-01",
  "nationality": "USA",
  "license_number": "DL123456",
  "license_origin_country": "USA",
  "issue_date": "2020-01-01",
  "expiry_date": "2025-12-31"
}
```

**Edge Cases**:
- Empty update (should succeed)
- Invalid date formats
- Future expiry dates
- NULL values for optional fields
- File upload without form-data header
- Large file uploads (test max size)
- Invalid file types

---

#### Test Case 2.3: Change Password
```
Endpoint: POST /api/users/me/change-password/
Method: POST
Status Expected: 200
Tests:
  ✓ Old password required and validated
  ✓ New password meets strength requirements
  ✓ Cannot use old password as new password
  ✓ Password actually changed in database
  ✓ Old access token still valid after change
  ✓ New login with new password works
```

---

#### Test Case 2.4: User Stats
```
Endpoint: GET /api/users/me/stats/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns accurate booking count
  ✓ Returns accurate review count
  ✓ Returns accurate rating
  ✓ Data is consistent with database
```

---

### PHASE 3: LISTINGS MANAGEMENT

#### Test Case 3.1: List All Listings
```
Endpoint: GET /api/listings/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns paginated results
  ✓ Pagination works (page, limit)
  ✓ Search filter works
  ✓ Price filter works
  ✓ Location filter works
  ✓ Only active listings returned
  ✓ Response time < 500ms
  ✓ Large dataset handled efficiently
```

**Query Parameters**:
```
?page=1&limit=10&search=Tesla&price_min=0&price_max=1000
```

---

#### Test Case 3.2: Get Listing Detail
```
Endpoint: GET /api/listings/<id>/
Method: GET
Status Expected: 200 (exists), 404 (not found)
Tests:
  ✓ Returns complete listing details
  ✓ Includes all images
  ✓ Includes partner details
  ✓ 404 for non-existent ID
  ✓ 404 for inactive listings (non-partner view)
  ✓ Partner can view own inactive listings
```

---

### PHASE 4: BOOKINGS MANAGEMENT

#### Test Case 4.1: Create Booking
```
Endpoint: POST /api/bookings/
Method: POST
Status Expected: 201
Tests:
  ✓ Requires authenticated user
  ✓ Validates date range
  ✓ Prevents double-booking
  ✓ Validates start_date < end_date
  ✓ Prevents booking in the past
  ✓ Price calculated correctly
  ✓ Notification sent to partner
  ✓ Booking status set to "pending"
```

**Test Data**:
```json
{
  "listing_id": 1,
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "special_requests": "Extra insurance needed"
}
```

**Edge Cases**:
- Overlapping bookings
- Invalid listing ID
- Start date = end date
- Dates in the past
- Very long booking periods
- Special character injection

---

#### Test Case 4.2: List My Bookings
```
Endpoint: GET /api/bookings/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns only user's bookings
  ✓ Excludes other users' bookings
  ✓ Status filter works
  ✓ Pagination works
  ✓ Shows past and future bookings
  ✓ Accurate booking count
```

---

#### Test Case 4.3: Accept Booking (Partner)
```
Endpoint: POST /api/bookings/<id>/accept/
Method: POST
Status Expected: 200
Tests:
  ✓ Only partner owner can accept
  ✓ Can only accept pending bookings
  ✓ Status changes to "accepted"
  ✓ Customer notified
  ✓ Blocks conflicting dates for other customers
  ✓ 403 if not partner owner
  ✓ 404 if booking not found
```

---

#### Test Case 4.4: Reject Booking (Partner)
```
Endpoint: POST /api/bookings/<id>/reject/
Method: POST
Status Expected: 200
Tests:
  ✓ Only partner owner can reject
  ✓ Reason captured in database
  ✓ Customer refunded
  ✓ Customer notified with reason
  ✓ Booking status = "rejected"
  ✓ Dates released for other bookings
```

**Test Data**:
```json
{
  "reason": "Vehicle unavailable on those dates"
}
```

---

#### Test Case 4.5: Cancel Booking (Customer)
```
Endpoint: POST /api/bookings/<id>/cancel/
Method: POST
Status Expected: 200
Tests:
  ✓ Only booking customer can cancel
  ✓ Can cancel pending or accepted bookings
  ✓ Cannot cancel completed bookings
  ✓ Refund policy applied correctly
  ✓ Partner notified
  ✓ Reason recorded
```

---

### PHASE 5: FAVORITES MANAGEMENT

#### Test Case 5.1: Add to Favorites
```
Endpoint: POST /api/favorites/
Method: POST
Status Expected: 201
Tests:
  ✓ Requires authenticated user
  ✓ Validates listing_id exists
  ✓ Prevents duplicate favorites
  ✓ Returns favorite object with ID
```

**Test Data**:
```json
{
  "listing_id": 1
}
```

---

#### Test Case 5.2: List My Favorites
```
Endpoint: GET /api/favorites/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns only user's favorites
  ✓ Pagination works
  ✓ Accurate count
  ✓ Includes listing details
```

---

#### Test Case 5.3: Remove Favorite
```
Endpoint: DELETE /api/favorites/<id>/
Method: DELETE
Status Expected: 204
Tests:
  ✓ Only favorite owner can delete
  ✓ 404 if not found
  ✓ 403 if not owner
  ✓ Favorite removed from database
```

---

### PHASE 6: REVIEWS & RATINGS

#### Test Case 6.1: Create Review
```
Endpoint: POST /api/reviews/
Method: POST
Status Expected: 201
Tests:
  ✓ Only after completed booking
  ✓ Prevents duplicate reviews
  ✓ Rating 1-5 only
  ✓ Comment max 500 chars
  ✓ Partner rating updated correctly
  ✓ Partner average rating calculated
  ✓ Review visible immediately
```

**Test Data**:
```json
{
  "booking_id": 1,
  "rating": 5,
  "comment": "Excellent service and beautiful car!",
  "would_recommend": true
}
```

**Edge Cases**:
- Rating = 0
- Rating = 6
- Negative rating
- Empty comment
- XSS in comment
- Review before booking complete
- Multiple reviews for same booking

---

#### Test Case 6.2: Can Review Check
```
Endpoint: GET /api/reviews/can_review/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns true if eligible
  ✓ Returns false if not eligible
  ✓ Validates booking_id
```

---

### PHASE 7: PARTNER MANAGEMENT

#### Test Case 7.1: Create Partner Profile
```
Endpoint: POST /api/partners/
Method: POST
Status Expected: 201
Tests:
  ✓ User role changed to "partner"
  ✓ Company name validated
  ✓ Logo uploaded to Supabase
  ✓ Logo URL saved
  ✓ Partner object created
```

**Test Data**:
```json
{
  "company_name": "John's Car Rentals",
  "description": "Premium luxury car rentals",
  "logo": "<file>"
}
```

---

#### Test Case 7.2: Get Partner Profile
```
Endpoint: GET /api/partners/me/
Method: GET
Status Expected: 200 (partner), 404 (non-partner)
Tests:
  ✓ Returns partner details
  ✓ Includes company info
  ✓ 404 for non-partner users
```

---

#### Test Case 7.3: Partner Earnings
```
Endpoint: GET /api/partners/me/earnings/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns total earnings
  ✓ Earnings calculated correctly
  ✓ Includes pending earnings
  ✓ Payment history included
```

---

#### Test Case 7.4: Partner Analytics
```
Endpoint: GET /api/partners/me/analytics/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns total bookings
  ✓ Returns acceptance rate
  ✓ Returns cancellation rate
  ✓ Returns revenue trend
  ✓ Data accuracy verified
```

---

### PHASE 8: NOTIFICATIONS

#### Test Case 8.1: List Notifications
```
Endpoint: GET /api/notifications/
Method: GET
Status Expected: 200
Tests:
  ✓ Returns user's notifications only
  ✓ Pagination works
  ✓ Unread_only filter works
  ✓ Ordered by created_at DESC
  ✓ Accurate unread count
```

---

#### Test Case 8.2: Mark as Read
```
Endpoint: POST /api/notifications/<id>/read/
Method: POST
Status Expected: 200
Tests:
  ✓ Marks notification as read
  ✓ 404 if not found
  ✓ 403 if not owner
```

---

#### Test Case 8.3: Mark All as Read
```
Endpoint: POST /api/notifications/read-all/
Method: POST
Status Expected: 200
Tests:
  ✓ Marks all notifications as read
  ✓ Returns count of updated
```

---

### PHASE 9: ADMIN ENDPOINTS

#### Test Case 9.1: Admin Stats
```
Endpoint: GET /api/admin/stats/
Method: GET
Status Expected: 200 (admin), 403 (non-admin)
Tests:
  ✓ Admin access only
  ✓ Returns total users
  ✓ Returns total bookings
  ✓ Returns total revenue
  ✓ Returns platform metrics
```

---

#### Test Case 9.2: Admin Analytics
```
Endpoint: GET /api/admin/analytics/
Method: GET
Status Expected: 200 (admin), 403 (non-admin)
Tests:
  ✓ Admin access only
  ✓ Returns booking trends
  ✓ Returns revenue trends
  ✓ Returns user growth
```

---

### PHASE 10: SECURITY & PERFORMANCE

#### Test Case 10.1: Authentication Security
```
Tests:
  ✓ Token expiration (typically 24 hours)
  ✓ Refresh token expiration (typically 7 days)
  ✓ CSRF protection
  ✓ XSS prevention in responses
  ✓ SQL injection prevention
  ✓ Rate limiting (if implemented)
  ✓ HTTPS enforcement in production
  ✓ CORS properly configured
```

---

#### Test Case 10.2: Authorization
```
Tests:
  ✓ Users can only access own data
  ✓ Users cannot access other users' data
  ✓ Partners can only manage own listings/bookings
  ✓ Admins have full access
  ✓ 403 for unauthorized access
  ✓ 401 for missing authentication
```

---

#### Test Case 10.3: Data Validation
```
Tests:
  ✓ Email validation (RFC 5322)
  ✓ Phone number validation
  ✓ Date format validation (ISO 8601)
  ✓ Currency/price validation
  ✓ Enum field validation
  ✓ String length limits enforced
  ✓ Max file size enforced
  ✓ File type validation
```

---

#### Test Case 10.4: Performance
```
Tests:
  ✓ GET requests < 200ms (for single objects)
  ✓ GET requests < 500ms (for lists)
  ✓ POST requests < 500ms
  ✓ File uploads < 5 seconds
  ✓ Database queries optimized (no N+1 queries)
  ✓ Pagination limits prevent large data transfers
  ✓ Caching implemented where appropriate
```

---

#### Test Case 10.5: Error Handling
```
Tests:
  ✓ 400 Bad Request for invalid data
  ✓ 401 Unauthorized for missing token
  ✓ 403 Forbidden for insufficient permissions
  ✓ 404 Not Found for missing resources
  ✓ 409 Conflict for business logic violations
  ✓ 500 Server Error with proper logging
  ✓ All errors include descriptive messages
  ✓ No sensitive data in error messages
  ✓ Proper Content-Type in error responses
```

---

## 🔄 Testing Workflow

### Step 1: Pre-Test Setup
```bash
# Start backend
docker compose up -d web

# Verify health check
curl http://localhost:8000/api/health/

# Clear test data (optional)
docker compose exec web python manage.py flush --no-input
```

### Step 2: Run Test Suite
```
In Postman:
1. Select "AirBcar API - Comprehensive Test Suite"
2. Click "Run"
3. Select all test cases
4. Run Collection
```

### Step 3: Generate Report
```
Postman → Run results → Export as HTML
Share report with team
```

### Step 4: Document Issues
```
Create GitHub issues for any failures:
- Title: [API TEST] Endpoint name - Issue description
- Description: 
  - Expected behavior
  - Actual behavior
  - Steps to reproduce
  - Severity level
```

---

## 📊 Expected Results

### Success Criteria
- ✅ All authentication tests pass
- ✅ All CRUD operations work
- ✅ All error cases handled properly
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ No authentication bypass
- ✅ Authorization properly enforced
- ✅ All responses valid JSON
- ✅ Response times acceptable
- ✅ File uploads work end-to-end

### Failure Response Format
```json
{
  "error": "Invalid request",
  "detail": "Specific error message",
  "status": 400,
  "timestamp": "2025-02-04T12:00:00Z"
}
```

---

## 🚨 Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Email verification delayed | Investigating | Check spam folder |
| File uploads > 5MB | Not supported | Compress files before upload |
| Password reset tokens expire after 1 hour | By design | Request new token if needed |

---

## 📈 Metrics to Track

- **Request Success Rate**: Aim for > 99%
- **Average Response Time**: Aim for < 300ms
- **Error Rate**: Aim for < 1%
- **Uptime**: Aim for > 99.9%
- **Authentication Failures**: Monitor for attacks

---

## 🔗 Related Documents

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [POSTMAN_COLLECTION.json](POSTMAN_COLLECTION.json) - Original collection
- [POSTMAN_COLLECTION_COMPLETE.json](POSTMAN_COLLECTION_COMPLETE.json) - Full test suite

---

## 👥 Team Responsibilities

| Role | Responsibility |
|------|-----------------|
| QA | Run full test suite, document bugs |
| Backend Dev | Fix failing tests |
| DevOps | Monitor production metrics |
| PM | Track deployment blockers |

---

## 📅 Testing Timeline

**Phase 1** (Hours 1-2): Authentication & Security
**Phase 2** (Hours 2-3): User Management
**Phase 3** (Hours 3-4): Listing & Booking Core
**Phase 4** (Hours 4-5): Favorites & Reviews
**Phase 5** (Hours 5-6): Partner Features
**Phase 6** (Hours 6-7): Admin & Notifications
**Phase 7** (Hours 7-8): Performance & Load Testing

**Total Estimated Time**: 8 hours for comprehensive testing

---

**Last Updated**: February 4, 2026
**Next Review**: Before production deployment
**Document Status**: Final for Release Candidate

