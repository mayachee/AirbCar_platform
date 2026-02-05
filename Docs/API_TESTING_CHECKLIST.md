# AirBcar API - Testing Execution Checklist

**Project**: AirBcar Platform - Production Deployment
**Date**: February 4, 2026
**Tested By**: _______________
**QA Sign-Off**: _______________

---

## 📋 PRE-TESTING REQUIREMENTS

### Infrastructure Setup
- [ ] Backend container running (`docker compose up -d web`)
- [ ] Database migrations applied (`python manage.py migrate`)
- [ ] Supabase connection verified (storage & auth)
- [ ] Email service configured (SMTP or SendGrid)
- [ ] BASE_URL set correctly in Postman environment
- [ ] All environment variables loaded

### Test Data
- [ ] Test user account created
- [ ] Test partner account created
- [ ] Test listings created (at least 3)
- [ ] Test images uploaded
- [ ] Test database is clean or isolated

### Tools Ready
- [ ] Postman installed and updated
- [ ] Collection imported
- [ ] Environment variables configured
- [ ] Browser console ready for debugging
- [ ] Server logs accessible

---

## ✅ PHASE 1: HEALTH & SETUP (CRITICAL)

### Health Check
- [ ] GET /api/health/ returns 200
- [ ] Response time < 100ms
- [ ] Contains "status": "OK" or similar
- [ ] Server connectivity confirmed

---

## ✅ PHASE 2: AUTHENTICATION (CRITICAL)

### Registration Tests
- [ ] **Happy Path**: New user registration succeeds
  - [ ] Returns 201 or 200 status
  - [ ] Response includes access_token
  - [ ] Response includes refresh_token
  - [ ] Response includes user object
  - [ ] User can be queried from database

- [ ] **Validation Tests**:
  - [ ] Empty email rejected (400)
  - [ ] Invalid email format rejected (400)
  - [ ] Duplicate email rejected (400)
  - [ ] Missing password rejected (400)
  - [ ] Password too short rejected (400)
  - [ ] Missing first_name rejected (or accepts)
  - [ ] Missing last_name rejected (or accepts)
  - [ ] Username special characters handled

- [ ] **Security Tests**:
  - [ ] XSS in first_name escaped
  - [ ] SQL injection in email prevented
  - [ ] Password hashed in database (not plaintext)
  - [ ] Response doesn't expose password

### Login Tests
- [ ] **Happy Path**: Login with valid credentials
  - [ ] Returns 200
  - [ ] Returns access_token
  - [ ] Returns refresh_token
  - [ ] Returns user object with correct email

- [ ] **Invalid Credentials**:
  - [ ] Wrong password returns 401
  - [ ] Wrong email returns 401 (or 404)
  - [ ] Empty credentials returns 400
  - [ ] Case sensitivity handled correctly

- [ ] **Token Quality**:
  - [ ] Access token is valid JWT
  - [ ] Refresh token is valid JWT
  - [ ] Tokens are different
  - [ ] Token can decode with secret key

### Token Verification Tests
- [ ] **Valid Token**:
  - [ ] POST /api/verify-token/ returns 200
  - [ ] Response contains "valid": true

- [ ] **Invalid Token**:
  - [ ] Expired token returns false or 401
  - [ ] Malformed token returns 401
  - [ ] Missing token returns 401
  - [ ] Empty token returns 401

### Token Refresh Tests
- [ ] **Valid Refresh Token**:
  - [ ] Returns 200
  - [ ] Returns new access_token
  - [ ] New token is different from old
  - [ ] New token is valid JWT

- [ ] **Invalid Refresh Token**:
  - [ ] Invalid token returns 401
  - [ ] Expired token returns 401 or 400
  - [ ] Missing token returns 400

### Email Verification Tests
- [ ] **Resend Verification**:
  - [ ] POST /api/resend-verification/ returns 200
  - [ ] Email sent to registered email
  - [ ] Email contains verification code/link
  - [ ] Can call multiple times

- [ ] **Verify Email**:
  - [ ] Valid code sets email as verified
  - [ ] Invalid code rejected
  - [ ] Expired code rejected
  - [ ] Code can only be used once

### Password Reset Tests
- [ ] **Request Reset**:
  - [ ] Valid email sends reset email
  - [ ] Returns 200
  - [ ] Email contains reset token/link
  - [ ] Non-existent email handled gracefully

- [ ] **Confirm Reset**:
  - [ ] Valid token resets password
  - [ ] User can login with new password
  - [ ] Old password no longer works
  - [ ] Token can only be used once
  - [ ] Expired token rejected

---

## ✅ PHASE 3: USER PROFILE MANAGEMENT

### Get Current User
- [ ] Authenticated user can retrieve own profile
- [ ] Returns 200
- [ ] Contains all user fields (id, email, first_name, etc.)
- [ ] No sensitive data exposed
- [ ] Unauthenticated request returns 401

### Update User Profile
- [ ] **Successful Updates**:
  - [ ] first_name updates
  - [ ] phone_number updates and validates
  - [ ] date_of_birth updates
  - [ ] nationality updates
  - [ ] Can update multiple fields at once
  - [ ] Partial update (PATCH) works

- [ ] **Field Validation**:
  - [ ] Invalid phone_number rejected
  - [ ] Invalid date_of_birth rejected
  - [ ] Empty strings handled
  - [ ] NULL values accepted for optional fields

- [ ] **Security**:
  - [ ] Cannot update role
  - [ ] Cannot update is_verified
  - [ ] Cannot update id
  - [ ] Cannot update date_joined
  - [ ] Users cannot update other users' profiles (403)

- [ ] **File Upload** (License Documents):
  - [ ] license_front_document uploads successfully
  - [ ] license_back_document uploads successfully
  - [ ] Files stored in Supabase
  - [ ] URLs returned in response
  - [ ] File size limit enforced
  - [ ] Invalid file types rejected
  - [ ] Large files handled gracefully

### User Stats
- [ ] Authenticated user can retrieve own stats
- [ ] Returns booking count
- [ ] Returns review count
- [ ] Returns average rating
- [ ] Stats are accurate (verified against database)
- [ ] Response time acceptable

### Change Password
- [ ] **Valid Change**:
  - [ ] Old password required
  - [ ] New password different from old
  - [ ] Password strength requirements met
  - [ ] Returns 200 on success

- [ ] **Error Cases**:
  - [ ] Wrong old password rejected (400 or 401)
  - [ ] New password same as old rejected
  - [ ] Weak password rejected
  - [ ] Missing fields rejected

- [ ] **Verification**:
  - [ ] Can login with new password
  - [ ] Old password no longer works
  - [ ] Old tokens still valid (or require re-login)

### List Users
- [ ] GET /api/users/ returns 200
- [ ] Results are paginated
- [ ] Returns array of users
- [ ] Each user has id, email, first_name, etc.
- [ ] Sensitive fields not exposed
- [ ] Pagination parameters work (?page=1&limit=10)

---

## ✅ PHASE 4: LISTINGS MANAGEMENT

### List Listings
- [ ] GET /api/listings/ returns 200
- [ ] Results paginated (page, limit, count, next, previous)
- [ ] Empty list returns empty results (not error)
- [ ] Filtering works:
  - [ ] Search by car model/brand works
  - [ ] Price filter works (min/max)
  - [ ] Location filter works
  - [ ] Partner filter works
- [ ] Sorting works (if implemented)
- [ ] Only active listings shown (unless partner viewing own)
- [ ] Response time acceptable for large datasets

### Get Listing Detail
- [ ] Valid listing ID returns 200 with full details
- [ ] Invalid listing ID returns 404
- [ ] Response includes:
  - [ ] Car details (brand, model, year, etc.)
  - [ ] Images/image URLs
  - [ ] Partner information
  - [ ] Price and availability
  - [ ] Reviews/ratings
  - [ ] Description
- [ ] Inactive listings:
  - [ ] Return 404 for non-partners
  - [ ] Accessible to partner owner (if applicable)

---

## ✅ PHASE 5: BOOKINGS MANAGEMENT

### Create Booking
- [ ] **Valid Booking**:
  - [ ] Valid listing_id, dates create booking
  - [ ] Returns 201
  - [ ] Booking status = "pending"
  - [ ] Customer receives confirmation notification
  - [ ] Partner receives booking notification

- [ ] **Date Validation**:
  - [ ] start_date < end_date enforced
  - [ ] Cannot book in the past
  - [ ] Overlapping bookings prevented
  - [ ] Invalid date formats rejected

- [ ] **Price Calculation**:
  - [ ] Daily rate applied correctly
  - [ ] Total price calculated (days × daily_rate)
  - [ ] Seasonal prices considered (if applicable)
  - [ ] Price shown in response

### List My Bookings
- [ ] Authenticated user can list own bookings
- [ ] Returns paginated results
- [ ] Only shows user's bookings (not others')
- [ ] Status filter works (pending, accepted, completed, etc.)
- [ ] Sorting by date works
- [ ] Includes relevant booking details

### Get Booking Detail
- [ ] Valid booking_id returns 200
- [ ] Invalid booking_id returns 404
- [ ] Unauthorized users get 403
- [ ] Response includes:
  - [ ] Customer info
  - [ ] Partner info
  - [ ] Car details
  - [ ] Dates
  - [ ] Price
  - [ ] Status
  - [ ] Comments/notes

### Pending Requests (Partner)
- [ ] Partner can view pending booking requests
- [ ] Non-partner gets 403
- [ ] Returns paginated list
- [ ] Shows customer info, car requested, dates
- [ ] Shows accept/reject options

### Upcoming Bookings
- [ ] User can view upcoming bookings
- [ ] Shows only future bookings
- [ ] Sorted by start_date ascending
- [ ] Includes confirmed bookings only

### Accept Booking (Partner)
- [ ] Only booking's partner can accept
- [ ] Booking must be "pending"
- [ ] Returns 200 on success
- [ ] Status changes to "accepted"
- [ ] Customer notified
- [ ] Other overlapping requests auto-rejected
- [ ] Non-partner gets 403
- [ ] Non-pending booking gets 400 or 409

### Reject Booking (Partner)
- [ ] Only partner can reject
- [ ] Reason captured (optional)
- [ ] Returns 200
- [ ] Status changes to "rejected"
- [ ] Customer notified with reason
- [ ] Customer refunded (if applicable)
- [ ] Date becomes available for others

### Cancel Booking (Customer)
- [ ] Only booking customer can cancel
- [ ] Pending/Accepted can be cancelled
- [ ] Completed cannot be cancelled (409)
- [ ] Reason captured
- [ ] Partner notified
- [ ] Refund policy applied:
  - [ ] Full refund if cancelled > 48hrs before
  - [ ] Partial refund if cancelled < 48hrs
  - [ ] No refund if cancelled after start_date
- [ ] Dates released for others

### Partner Customer Info
- [ ] Only partner owner can access
- [ ] Returns customer details:
  - [ ] Name
  - [ ] Phone number
  - [ ] Email
  - [ ] License info (if available)
- [ ] Non-partner gets 403
- [ ] Invalid booking gets 404

---

## ✅ PHASE 6: FAVORITES MANAGEMENT

### Add to Favorites
- [ ] Valid listing_id adds to favorites
- [ ] Returns 201
- [ ] User can only add once (prevent duplicates)
- [ ] Invalid listing_id rejected
- [ ] Duplicate attempts rejected with 409 or success

### List My Favorites
- [ ] User can list own favorites
- [ ] Returns paginated results
- [ ] Shows listing details
- [ ] Only shows user's favorites
- [ ] Empty favorites returns empty list (not error)

### Remove Favorite
- [ ] Owner can delete favorite
- [ ] Returns 204 (no content) or 200
- [ ] Non-owner gets 403
- [ ] Non-existent favorite gets 404
- [ ] Favorite removed from database

---

## ✅ PHASE 7: REVIEWS & RATINGS

### Create Review
- [ ] **Eligibility Check**:
  - [ ] Only possible after booking completed
  - [ ] Can review once per booking
  - [ ] Cannot review own listings (if partner)

- [ ] **Validation**:
  - [ ] Rating 1-5 only
  - [ ] Rating = 0 rejected
  - [ ] Rating > 5 rejected
  - [ ] Comment optional
  - [ ] Comment max length enforced (500 chars)
  - [ ] Comment sanitized (XSS prevention)

- [ ] **Data Persistence**:
  - [ ] Review saved to database
  - [ ] Partner rating updated
  - [ ] Average rating recalculated
  - [ ] Review count incremented

### Can Review Check
- [ ] Returns true for eligible bookings
- [ ] Returns false for ineligible
- [ ] Returns error for invalid booking_id

### List Reviews
- [ ] Returns paginated reviews
- [ ] Filter by listing works
- [ ] Filter by partner works
- [ ] Sort by rating/date works
- [ ] Returns reviewer info, rating, comment
- [ ] Aggregate ratings shown

---

## ✅ PHASE 8: PARTNER MANAGEMENT

### Create Partner Profile
- [ ] **User Role Change**:
  - [ ] User role changes to "partner"
  - [ ] Can login as before

- [ ] **Profile Creation**:
  - [ ] company_name required and saved
  - [ ] description optional
  - [ ] logo uploaded to Supabase
  - [ ] logo URL returned
  - [ ] Returns 201

- [ ] **Validation**:
  - [ ] Empty company_name rejected
  - [ ] Long company_name handled
  - [ ] Invalid logo file type rejected
  - [ ] Large logo file handled

### Get Partner Profile (Me)
- [ ] Partner can retrieve own profile
- [ ] Returns 200
- [ ] Non-partner gets 404
- [ ] Includes:
  - [ ] Company name
  - [ ] Description
  - [ ] Logo URL
  - [ ] Rating
  - [ ] Review count
  - [ ] Total earnings
  - [ ] Status (active/inactive)

### Update Partner Profile
- [ ] Partner can update own profile
- [ ] company_name updatable
- [ ] description updatable
- [ ] logo updatable
- [ ] Returns 200 on success
- [ ] Changes saved to database

### Partner Earnings
- [ ] Partner can retrieve earnings
- [ ] Shows total earned
- [ ] Shows pending earnings
- [ ] Shows earnings by month
- [ ] Shows payment history (if applicable)
- [ ] Data accurate (verified against bookings)

### Partner Analytics
- [ ] Partner can retrieve analytics
- [ ] Shows total bookings count
- [ ] Shows acceptance rate (accepted/total)
- [ ] Shows cancellation rate
- [ ] Shows revenue trend
- [ ] Shows customer feedback/ratings
- [ ] Data updated in real-time or cached appropriately

### Partner Reviews
- [ ] Partner can view own reviews
- [ ] Returns paginated reviews
- [ ] Shows rating, comment, reviewer name
- [ ] Shows average rating
- [ ] Shows review count

### Partner Activity
- [ ] Partner can view activity log
- [ ] Shows booking events
- [ ] Shows review events
- [ ] Shows profile updates
- [ ] Sorted by date DESC
- [ ] Pagination works

### Get Partner Detail (Public)
- [ ] Valid partner_id returns 200
- [ ] Invalid partner_id returns 404
- [ ] Returns public partner info:
  - [ ] Company name
  - [ ] Logo
  - [ ] Average rating
  - [ ] Review count
  - [ ] Number of cars
  - [ ] Location (if available)
- [ ] Sensitive data not exposed

### List Partners
- [ ] Returns paginated list
- [ ] Search by company name works
- [ ] Filter by rating works (if applicable)
- [ ] Sorted by rating or popularity
- [ ] Each partner shows basic info

---

## ✅ PHASE 9: NOTIFICATIONS

### List Notifications
- [ ] User gets own notifications only
- [ ] Returns paginated results
- [ ] unread_only filter works
- [ ] Sorted by created_at DESC
- [ ] Shows unread count
- [ ] Contains:
  - [ ] Message
  - [ ] Type (booking, review, message, etc.)
  - [ ] Related object ID
  - [ ] Read status
  - [ ] Created timestamp

### Mark as Read
- [ ] Notification marked as read
- [ ] Returns 200
- [ ] Unread count updated
- [ ] Only owner can mark (403 for others)
- [ ] Non-existent notification returns 404

### Mark All as Read
- [ ] All notifications marked as read
- [ ] Returns 200 or count of updated
- [ ] Unread count becomes 0

### Notifications in Workflows
- [ ] Registration sends verification email notification
- [ ] Booking request sends partner notification
- [ ] Booking acceptance sends customer notification
- [ ] Review added sends partner notification
- [ ] Real-time updates (WebSocket, if implemented)

---

## ✅ PHASE 10: ADMIN ENDPOINTS

### Admin Stats
- [ ] Admin can access /api/admin/stats/
- [ ] Non-admin gets 403
- [ ] Returns:
  - [ ] Total users count
  - [ ] Total partners count
  - [ ] Total bookings count
  - [ ] Total revenue
  - [ ] Active listings count
  - [ ] Platform status

### Admin Analytics
- [ ] Admin can access /api/admin/analytics/
- [ ] Non-admin gets 403
- [ ] Returns:
  - [ ] User growth trend
  - [ ] Booking trend
  - [ ] Revenue trend
  - [ ] Partner growth
  - [ ] Popular listings
  - [ ] Top partners

### Admin Revenue
- [ ] Admin can access /api/admin/revenue/
- [ ] Non-admin gets 403
- [ ] Returns:
  - [ ] Total platform revenue
  - [ ] Revenue by period
  - [ ] Payment status
  - [ ] Partner payouts
  - [ ] Refunds

---

## ✅ PHASE 11: SECURITY & VALIDATION

### Authentication Security
- [ ] Token expiration enforced
- [ ] Refresh token expiration enforced
- [ ] HTTPS enforced in production (if applicable)
- [ ] CORS properly configured
- [ ] CSRF tokens used for state-changing operations
- [ ] No credentials in logs or responses
- [ ] Cookies have secure/httponly flags

### Authorization
- [ ] Users cannot access other users' data (403)
- [ ] Users cannot access admin endpoints (403)
- [ ] Partners cannot access other partners' data (403)
- [ ] Role-based access control working
- [ ] Resource ownership verified

### Data Validation
- [ ] Email format validated (RFC 5322)
- [ ] Phone numbers validated
- [ ] Dates in ISO 8601 format
- [ ] Prices are positive decimals
- [ ] Ratings 1-5
- [ ] String length limits enforced
- [ ] Special characters escaped
- [ ] Null/empty fields handled

### Input Sanitization
- [ ] XSS prevention (HTML escaped)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Command injection prevention
- [ ] Path traversal prevention (in file uploads)

### File Upload Security
- [ ] File type validation
- [ ] File size limits enforced
- [ ] Virus/malware scanning (if applicable)
- [ ] Files stored outside web root
- [ ] Files served via CDN or secure endpoint
- [ ] Random filenames (not original name)
- [ ] No executable files allowed

---

## ✅ PHASE 12: ERROR HANDLING

### Response Formats
- [ ] All errors return JSON
- [ ] Error responses include "error" or "detail" field
- [ ] Error responses include HTTP status code
- [ ] Error messages are user-friendly
- [ ] No sensitive data in error messages
- [ ] Stack traces not exposed in production

### Status Codes
- [ ] 200 OK - Successful GET/PATCH/DELETE
- [ ] 201 Created - Successful POST
- [ ] 204 No Content - DELETE with no response body
- [ ] 400 Bad Request - Invalid input
- [ ] 401 Unauthorized - Missing/invalid token
- [ ] 403 Forbidden - Insufficient permissions
- [ ] 404 Not Found - Resource doesn't exist
- [ ] 409 Conflict - Business logic violation
- [ ] 500 Server Error - Unexpected error
- [ ] 503 Service Unavailable - Maintenance

### Specific Error Cases
- [ ] Empty required field → 400 with message
- [ ] Invalid email format → 400 with message
- [ ] Duplicate email → 400 or 409 with message
- [ ] Missing token → 401 with message
- [ ] Invalid token → 401 with message
- [ ] Expired token → 401 with message
- [ ] Insufficient permissions → 403 with message
- [ ] Resource not found → 404 with message
- [ ] Booking conflict → 409 with message
- [ ] Server error → 500 with safe message

---

## ✅ PHASE 13: PERFORMANCE & LOAD

### Response Times
- [ ] Health check < 100ms
- [ ] GET single object < 200ms
- [ ] GET list (10 items) < 500ms
- [ ] POST/PATCH < 500ms
- [ ] File upload < 5s
- [ ] Database queries < 100ms

### Pagination
- [ ] Large lists paginated (no 10k+ item responses)
- [ ] Default limit set (e.g., 10 or 20)
- [ ] Max limit enforced (e.g., 100)
- [ ] Pagination metadata included (count, next, previous)

### Load Testing
- [ ] 10 concurrent requests - all succeed
- [ ] 50 concurrent requests - all succeed
- [ ] 100 concurrent requests - graceful degradation or queue
- [ ] Long-running query doesn't block others
- [ ] File upload doesn't block other requests

### Caching
- [ ] Appropriate caching headers set
- [ ] Static files cached
- [ ] API responses cached where appropriate
- [ ] Cache invalidation working

### Database Optimization
- [ ] No N+1 queries (verified with query logging)
- [ ] Appropriate indexes on frequently queried fields
- [ ] Complex queries use select_related/prefetch_related
- [ ] Database connection pooling working

---

## ✅ PHASE 14: DATA CONSISTENCY

### Transaction Handling
- [ ] Booking creation atomic
- [ ] Refunds atomic
- [ ] Earnings calculation consistent
- [ ] Concurrent updates don't cause data corruption

### Data Integrity
- [ ] Foreign keys enforced
- [ ] Cascading deletes work correctly
- [ ] Orphaned records prevented
- [ ] Unique constraints enforced

### Audit Trail
- [ ] Created_at/updated_at timestamps maintained
- [ ] Soft deletes working (if applicable)
- [ ] Change history available (if applicable)

---

## ✅ PHASE 15: API DOCUMENTATION

- [ ] All endpoints documented in API_DOCUMENTATION.md
- [ ] All parameters documented
- [ ] All response fields documented
- [ ] Error cases documented
- [ ] Examples provided
- [ ] Authentication explained
- [ ] Base URL clear
- [ ] Quick reference card available

---

## ✅ PHASE 16: INTEGRATION TESTING

### Email Integration
- [ ] Verification emails sent on registration
- [ ] Password reset emails sent
- [ ] Booking notifications sent
- [ ] Review notifications sent
- [ ] Email content correct
- [ ] Email templates working

### Supabase Integration
- [ ] Files upload to Supabase Storage
- [ ] File URLs returned correctly
- [ ] File URLs publicly accessible
- [ ] Large files handled
- [ ] File deletion works
- [ ] Storage bucket correct

### Frontend Integration (if possible)
- [ ] Registration flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Profile update works
- [ ] File upload works
- [ ] Booking creation works
- [ ] Review submission works

---

## 📊 TESTING SUMMARY

### Test Statistics
- **Total Test Cases**: 150+ scenarios
- **Test Duration**: ~8 hours
- **Tester(s)**: _________________
- **Test Date**: _________________
- **Environment**: Development (localhost:8000)

### Results
- **Passed**: _____ / 150+
- **Failed**: _____ / 150+
- **Blocked**: _____ / 150+
- **Success Rate**: _____%

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
- [ ] Fix all critical issues before production
- [ ] Fix major issues before public beta
- [ ] Fix minor issues before general availability
- [ ] Implement additional monitoring
- [ ] Setup load testing in staging
- [ ] Schedule security audit
- [ ] Setup automated testing pipeline

---

## 🔐 Security Audit Checklist

- [ ] No hardcoded credentials in code
- [ ] No API keys in responses
- [ ] No passwords in logs
- [ ] HTTPS enforced in production settings
- [ ] CORS whitelist set properly
- [ ] Rate limiting configured (if needed)
- [ ] Input validation comprehensive
- [ ] Output encoding correct
- [ ] Authentication bypass impossible
- [ ] Authorization properly enforced
- [ ] No information disclosure
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities

---

## ✅ FINAL SIGN-OFF

### QA Team
- [ ] All tests executed
- [ ] Test results documented
- [ ] All critical issues resolved
- [ ] Ready for deployment

**QA Lead**: _________________ **Date**: _________

### Development Team
- [ ] All issues fixed
- [ ] Code reviewed
- [ ] Deployment-ready

**Dev Lead**: ________________ **Date**: _________

### Product Owner
- [ ] Feature completeness verified
- [ ] Performance acceptable
- [ ] User experience validated
- [ ] Approval for release

**PM/PO**: __________________ **Date**: _________

---

**Document Version**: 1.0
**Status**: Ready for Testing
**Last Updated**: February 4, 2026
