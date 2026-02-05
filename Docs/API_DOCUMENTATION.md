# AirBcar API Documentation & Testing Guide

**Platform**: Production-Ready Deployment
**Last Updated**: February 4, 2026
**Base URL**: `http://localhost:8000/api/` (local) or production domain

---

## 📋 Complete API Endpoint List

### **1. HEALTH & STATUS ENDPOINTS**

#### Health Check
- **Endpoint**: `GET /api/health/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Check backend server health
- **Response**: `{ "status": "OK", "timestamp": "..." }`

---

### **2. AUTHENTICATION ENDPOINTS**

#### Login
- **Endpoint**: `POST /api/login/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Authenticate user with email and password
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: 
  ```json
  {
    "access": "eyJ...",
    "refresh": "eyJ...",
    "user": { user object }
  }
  ```

#### Register
- **Endpoint**: `POST /api/register/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Create a new user account
- **Request Body**: 
  ```json
  {
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

#### Refresh Token
- **Endpoint**: `POST /api/token/refresh/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Refresh JWT access token using refresh token
- **Request Body**: 
  ```json
  {
    "refresh": "eyJ..."
  }
  ```

#### Verify Token
- **Endpoint**: `POST /api/verify-token/`
- **Methods**: POST
- **Authentication**: Bearer Token
- **Description**: Verify if current token is valid

#### Verify Email
- **Endpoint**: `POST /api/verify-email/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Verify email using verification code
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```

#### Resend Verification Email
- **Endpoint**: `POST /api/resend-verification/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Resend verification email
- **Request Body**: 
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Password Reset Request
- **Endpoint**: `POST /api/password-reset/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Request password reset
- **Request Body**: 
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Password Reset Confirm
- **Endpoint**: `POST /api/password-reset/confirm/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Confirm password reset with token
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "token": "reset_token",
    "new_password": "newpassword123"
  }
  ```

#### Google OAuth
- **Endpoint**: `POST /api/auth/google/`
- **Methods**: POST
- **Authentication**: None (Public)
- **Description**: Authenticate with Google OAuth token
- **Request Body**: 
  ```json
  {
    "token": "google_oauth_token"
  }
  ```

---

### **3. USER ENDPOINTS**

#### List Users
- **Endpoint**: `GET /api/users/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get paginated list of users
- **Query Parameters**: `?page=1&limit=10&search=name`

#### Get Current User
- **Endpoint**: `GET /api/users/me/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get authenticated user's profile

#### Update Current User
- **Endpoint**: `PUT/PATCH /api/users/me/`
- **Methods**: PUT, PATCH
- **Authentication**: Bearer Token (Required)
- **Description**: Update authenticated user's profile
- **Request Body**: 
  ```json
  {
    "first_name": "John",
    "phone_number": "+1234567890",
    "profile_picture_url": "https://...",
    "date_of_birth": "1990-01-01",
    "nationality": "USA",
    "license_number": "DL123456",
    "license_origin_country": "USA",
    "issue_date": "2020-01-01",
    "expiry_date": "2025-01-01",
    "license_front_document": "<file>",
    "license_back_document": "<file>"
  }
  ```

#### Get User Stats
- **Endpoint**: `GET /api/users/me/stats/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get user's booking statistics

#### Change Password
- **Endpoint**: `POST /api/users/me/change-password/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Change user's password
- **Request Body**: 
  ```json
  {
    "old_password": "oldpass123",
    "new_password": "newpass123"
  }
  ```

#### Get User Detail
- **Endpoint**: `GET /api/users/<id>/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get public user profile by ID

---

### **4. LISTINGS ENDPOINTS**

#### List Listings
- **Endpoint**: `GET /api/listings/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get paginated list of car listings
- **Query Parameters**: `?page=1&limit=10&search=brand&price_min=0&price_max=1000`

#### Get Listing Detail
- **Endpoint**: `GET /api/listings/<id>/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get specific listing details

#### Create Listing (Partner)
- **Endpoint**: `POST /api/listings/`
- **Methods**: POST
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Create new car listing

#### Update Listing (Partner)
- **Endpoint**: `PUT/PATCH /api/listings/<id>/`
- **Methods**: PUT, PATCH
- **Authentication**: Bearer Token (Partner Owner)
- **Description**: Update car listing

#### Delete Listing (Partner)
- **Endpoint**: `DELETE /api/listings/<id>/`
- **Methods**: DELETE
- **Authentication**: Bearer Token (Partner Owner)
- **Description**: Delete car listing

---

### **5. BOOKINGS ENDPOINTS**

#### List Bookings
- **Endpoint**: `GET /api/bookings/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get user's bookings
- **Query Parameters**: `?status=pending&page=1`

#### Create Booking
- **Endpoint**: `POST /api/bookings/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Create new booking request
- **Request Body**: 
  ```json
  {
    "listing_id": 1,
    "start_date": "2025-02-10",
    "end_date": "2025-02-15",
    "special_requests": "Extra insurance"
  }
  ```

#### Get Booking Detail
- **Endpoint**: `GET /api/bookings/<id>/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get specific booking details

#### Booking Pending Requests
- **Endpoint**: `GET /api/bookings/pending-requests/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get pending booking requests for partner

#### Booking Upcoming
- **Endpoint**: `GET /api/bookings/upcoming/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get upcoming bookings

#### Accept Booking
- **Endpoint**: `POST /api/bookings/<id>/accept/`
- **Methods**: POST
- **Authentication**: Bearer Token (Partner Owner)
- **Description**: Accept booking request

#### Reject Booking
- **Endpoint**: `POST /api/bookings/<id>/reject/`
- **Methods**: POST
- **Authentication**: Bearer Token (Partner Owner)
- **Description**: Reject booking request
- **Request Body**: 
  ```json
  {
    "reason": "Unavailable on those dates"
  }
  ```

#### Cancel Booking
- **Endpoint**: `POST /api/bookings/<id>/cancel/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Cancel existing booking
- **Request Body**: 
  ```json
  {
    "reason": "Change of plans"
  }
  ```

#### Partner Customer Info
- **Endpoint**: `GET /api/bookings/<id>/customer-info/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Owner)
- **Description**: Get customer details for a booking

---

### **6. FAVORITES ENDPOINTS**

#### List Favorites
- **Endpoint**: `GET /api/favorites/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get user's favorite listings (paginated)

#### Get My Favorites
- **Endpoint**: `GET /api/favorites/my-favorites/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get all user's favorite listings

#### Add to Favorites
- **Endpoint**: `POST /api/favorites/` or `POST /api/favorites/my-favorites/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Add listing to favorites
- **Request Body**: 
  ```json
  {
    "listing_id": 1
  }
  ```

#### Get Favorite Detail
- **Endpoint**: `GET /api/favorites/<id>/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get specific favorite by ID

#### Remove Favorite
- **Endpoint**: `DELETE /api/favorites/<id>/`
- **Methods**: DELETE
- **Authentication**: Bearer Token (Required)
- **Description**: Remove listing from favorites

---

### **7. REVIEWS ENDPOINTS**

#### List Reviews
- **Endpoint**: `GET /api/reviews/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get reviews (paginated)
- **Query Parameters**: `?listing_id=1&partner_id=1&page=1`

#### Create Review
- **Endpoint**: `POST /api/reviews/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Create new review
- **Request Body**: 
  ```json
  {
    "booking_id": 1,
    "rating": 5,
    "comment": "Great car and service!",
    "would_recommend": true
  }
  ```

#### Can Review Check
- **Endpoint**: `GET /api/reviews/can_review/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Check if user can review a booking
- **Query Parameters**: `?booking_id=1`

---

### **8. PARTNERS ENDPOINTS**

#### List Partners
- **Endpoint**: `GET /api/partners/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get paginated list of partners
- **Query Parameters**: `?page=1&limit=10&search=name`

#### Create Partner Profile
- **Endpoint**: `POST /api/partners/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Create partner profile
- **Request Body**: 
  ```json
  {
    "company_name": "John's Cars",
    "description": "Luxury car rentals",
    "logo": "<file>"
  }
  ```

#### Get My Partner Profile
- **Endpoint**: `GET /api/partners/me/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get authenticated partner's profile

#### Update My Partner Profile
- **Endpoint**: `PUT/PATCH /api/partners/me/`
- **Methods**: PUT, PATCH
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Update partner profile

#### Partner Earnings
- **Endpoint**: `GET /api/partners/me/earnings/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get partner's earnings and revenue

#### Partner Analytics
- **Endpoint**: `GET /api/partners/me/analytics/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get partner's detailed analytics

#### Partner Reviews
- **Endpoint**: `GET /api/partners/me/reviews/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get partner's reviews (paginated)

#### Partner Activity
- **Endpoint**: `GET /api/partners/me/activity/`
- **Methods**: GET
- **Authentication**: Bearer Token (Partner Only)
- **Description**: Get partner's activity log

#### Get Partner Detail
- **Endpoint**: `GET /api/partners/<id>/`
- **Methods**: GET
- **Authentication**: None (Public)
- **Description**: Get public partner profile by ID

---

### **9. NOTIFICATIONS ENDPOINTS**

#### List Notifications
- **Endpoint**: `GET /api/notifications/`
- **Methods**: GET
- **Authentication**: Bearer Token (Required)
- **Description**: Get user's notifications (paginated)
- **Query Parameters**: `?page=1&limit=20&unread_only=true`

#### Mark Notification as Read
- **Endpoint**: `POST /api/notifications/<id>/read/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Mark single notification as read

#### Mark All Notifications as Read
- **Endpoint**: `POST /api/notifications/read-all/`
- **Methods**: POST
- **Authentication**: Bearer Token (Required)
- **Description**: Mark all notifications as read

---

### **10. ADMIN ENDPOINTS**

#### Admin Stats
- **Endpoint**: `GET /api/admin/stats/`
- **Methods**: GET
- **Authentication**: Bearer Token (Admin Only)
- **Description**: Get platform-wide statistics

#### Admin Analytics
- **Endpoint**: `GET /api/admin/analytics/`
- **Methods**: GET
- **Authentication**: Bearer Token (Admin Only)
- **Description**: Get detailed platform analytics

#### Admin Revenue
- **Endpoint**: `GET /api/admin/revenue/`
- **Methods**: GET
- **Authentication**: Bearer Token (Admin Only)
- **Description**: Get revenue and financial data

---

## 📊 Summary Table

| Category | Endpoints | Methods |
|----------|-----------|---------|
| Health | 1 | GET |
| Auth | 9 | POST |
| Users | 6 | GET, PUT, PATCH, POST |
| Listings | 5 | GET, POST, PUT, PATCH, DELETE |
| Bookings | 8 | GET, POST |
| Favorites | 5 | GET, POST, DELETE |
| Reviews | 3 | GET, POST |
| Partners | 8 | GET, POST, PUT, PATCH |
| Notifications | 3 | GET, POST |
| Admin | 3 | GET |
| **TOTAL** | **51** | **GET, POST, PUT, PATCH, DELETE** |

---

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Token obtained from `/api/login/` or `/api/register/`

---

## 📝 Common Response Formats

### Success Response (2xx)
```json
{
  "id": 1,
  "data": "...",
  "message": "Success"
}
```

### Error Response (4xx/5xx)
```json
{
  "error": "Error message",
  "detail": "Detailed error information",
  "status": 400
}
```

---

## ✅ Pagination

For paginated endpoints:
```
GET /api/endpoint/?page=1&limit=10
```

Response:
```json
{
  "count": 100,
  "next": "http://.../?page=2",
  "previous": null,
  "results": [...]
}
```

---

## 🔗 File Uploads

For endpoints accepting file uploads:
- Content-Type: `multipart/form-data`
- Field name: `file` or specific field (e.g., `license_front_document`)
- Max file size: 5MB (typically)

---

## ⏱️ Rate Limiting

Currently: No rate limiting (consider implementing in production)

---

## 📍 Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |
