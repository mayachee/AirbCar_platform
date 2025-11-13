# AirbCar API Documentation

Complete list of all API endpoints used in the AirbCar application.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: Set via `NEXT_PUBLIC_DJANGO_API_URL` environment variable
- **Default**: `http://localhost:8000`

---

## Authentication Endpoints

### 1. User Registration
- **Endpoint**: `POST /api/register/`
- **Description**: Register a new user account
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

### 2. User Login
- **Endpoint**: `POST /api/login/`
- **Description**: Authenticate user and get access/refresh tokens
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns `access` and `refresh` tokens, plus user data

### 3. Token Refresh
- **Endpoint**: `POST /api/token/refresh/`
- **Description**: Refresh access token using refresh token
- **Auth Required**: No (but requires refresh token in body)
- **Request Body**:
  ```json
  {
    "refresh": "refresh_token_here"
  }
  ```

### 4. Verify Token
- **Endpoint**: `GET /api/verify-token/`
- **Description**: Verify if access token is valid and get user status
- **Auth Required**: Yes (Bearer token)
- **Headers**: `Authorization: Bearer <access_token>`

### 5. Verify Admin
- **Endpoint**: `GET /api/verify-admin/`
- **Description**: Verify if user is admin
- **Auth Required**: Yes (Bearer token)
- **Headers**: `Authorization: Bearer <access_token>`

### 6. Verify Email
- **Endpoint**: `POST /api/verify-email/`
- **Description**: Verify user email address
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 7. Verify Email (GET)
- **Endpoint**: `GET /verify-email/`
- **Description**: Verify email via link (usually sent in email)
- **Auth Required**: No
- **Query Parameters**: `token`, `uidb64`

### 8. Password Reset Request
- **Endpoint**: `POST /api/password-reset/`
- **Description**: Request password reset email
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 9. Password Reset Confirm
- **Endpoint**: `POST /api/reset-password/<uidb64>/<token>/`
- **Description**: Confirm password reset with new password
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "password": "new_password123"
  }
  ```

### 10. Change Password
- **Endpoint**: `POST /users/me/change-password/`
- **Description**: Change password for authenticated user
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "old_password": "old_password",
    "new_password": "new_password123"
  }
  ```

### 11. Resend Verification Email
- **Endpoint**: `POST /users/resend-verification/`
- **Description**: Resend email verification link
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 12. Google OAuth
- **Endpoint**: `POST /api/auth/google/`
- **Description**: Authenticate with Google OAuth
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "access_token": "google_access_token"
  }
  ```

---

## User Endpoints

### 1. List Users
- **Endpoint**: `GET /users/`
- **Description**: Get list of all users (admin only)
- **Auth Required**: Yes (Admin)
- **Query Parameters**: 
  - `page`: Page number
  - `page_size`: Items per page

### 2. Get User Details
- **Endpoint**: `GET /users/{id}/`
- **Description**: Get user details by ID
- **Auth Required**: Yes
- **Parameters**: `id` (user ID)

### 3. Update User
- **Endpoint**: `PUT /users/{id}/` or `PATCH /users/{id}/`
- **Description**: Update user information
- **Auth Required**: Yes (own profile or admin)
- **Parameters**: `id` (user ID)
- **Request Body**: User data fields

### 4. Delete User
- **Endpoint**: `DELETE /users/{id}/`
- **Description**: Delete user account
- **Auth Required**: Yes (own profile or admin)
- **Parameters**: `id` (user ID)

### 5. Get Current User Profile
- **Endpoint**: `GET /users/me/`
- **Description**: Get authenticated user's profile
- **Auth Required**: Yes

### 6. Update Current User Profile
- **Endpoint**: `PATCH /users/me/`
- **Description**: Update authenticated user's profile
- **Auth Required**: Yes
- **Request Body**: User data fields

### 7. Get User Booking History
- **Endpoint**: `GET /users/me/bookings/history`
- **Description**: Get authenticated user's booking history
- **Auth Required**: Yes

---

## Partner Endpoints

### 1. List Partners
- **Endpoint**: `GET /partners/`
- **Description**: Get list of all partners
- **Auth Required**: No (public viewing allowed)
- **Query Parameters**: 
  - `page`: Page number
  - `page_size`: Items per page

### 2. Get Partner Details
- **Endpoint**: `GET /partners/{id}/`
- **Description**: Get partner details by ID
- **Auth Required**: No (public viewing allowed)
- **Parameters**: `id` (partner ID)

### 3. Create Partner
- **Endpoint**: `POST /partners/`
- **Description**: Register as a partner
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "company_name": "Company Name",
    "tax_id": "TAX123456",
    "agree_on_terms": true
  }
  ```

### 4. Update Partner
- **Endpoint**: `PUT /partners/{id}/` or `PATCH /partners/{id}/`
- **Description**: Update partner information
- **Auth Required**: Yes (own partner profile or admin)
- **Parameters**: `id` (partner ID)
- **Request Body**: Partner data fields
  - `company_name`: Company name
  - `description`: Company description
  - `logo`: Logo URL
  - `website`: Website URL
  - `phone`: Phone number
  - `city`: City
  - `business_type`: Business type (individual, company, fleet, dealership)
  - `address`: Business address
  - `state`: State/Province
  - `zip_code`: Zip/Postal code

### 5. Delete Partner
- **Endpoint**: `DELETE /partners/{id}/`
- **Description**: Delete partner account
- **Auth Required**: Yes (own partner profile or admin)
- **Parameters**: `id` (partner ID)

### 6. Get Current Partner Profile
- **Endpoint**: `GET /partners/me/`
- **Description**: Get authenticated partner's profile
- **Auth Required**: Yes (must be a partner)

### 7. Update Current Partner Profile
- **Endpoint**: `PATCH /partners/me/`
- **Description**: Update authenticated partner's profile
- **Auth Required**: Yes (must be a partner)
- **Request Body**: Partner data fields

### 8. Public Partner Profile (by ID or Slug)
- **Endpoint**: `GET /api/partners/public/{slug_or_id}/`
- **Description**: Get public partner profile by slug or numeric ID
- **Auth Required**: No
- **Parameters**: `slug_or_id` (partner slug or ID)
- **Response**: Returns partner data with listings using PublicPartnerSerializer
- **Fields**: 
  - `id`, `company_name`, `slug`, `description`, `logo`, `website`, `phone`
  - `address`, `city`, `business_type`, `verification_status`, `created_at`
  - `listings` (brief), `user` (brief), `total_listings`, `average_rating`

---

## Listing (Vehicle) Endpoints

### 1. List Listings
- **Endpoint**: `GET /listings/`
- **Description**: Get list of all vehicle listings
- **Auth Required**: No (public viewing allowed)
- **Query Parameters**:
  - `partner_id`: Filter by partner ID
  - `location`: Filter by location
  - `make`: Filter by make
  - `model`: Filter by model
  - `min_price`: Minimum price per day
  - `max_price`: Maximum price per day
  - `fuel_type`: Filter by fuel type
  - `transmission`: Filter by transmission type
  - `seats`: Filter by number of seats
  - `availability`: Filter by availability (true/false)
  - `page`: Page number
  - `page_size`: Items per page

### 2. Get Listing Details
- **Endpoint**: `GET /listings/{id}/`
- **Description**: Get listing details by ID
- **Auth Required**: No (public viewing allowed)
- **Parameters**: `id` (listing ID)

### 3. Create Listing
- **Endpoint**: `POST /listings/`
- **Description**: Create a new vehicle listing
- **Auth Required**: Yes (must be a partner)
- **Request Body**: Listing data fields
  - `make`: Vehicle make
  - `model`: Vehicle model
  - `year`: Vehicle year
  - `location`: Pickup location
  - `price_per_day`: Price per day
  - `pictures`: Array of image URLs
  - `features`: Array of features
  - `fuel_type`: Fuel type
  - `transmission`: Transmission type
  - `seating_capacity`: Number of seats
  - `vehicle_description`: Description
  - `availability`: Availability status

### 4. Update Listing
- **Endpoint**: `PUT /listings/{id}/` or `PATCH /listings/{id}/`
- **Description**: Update listing information
- **Auth Required**: Yes (own listing or admin)
- **Parameters**: `id` (listing ID)
- **Request Body**: Listing data fields

### 5. Delete Listing
- **Endpoint**: `DELETE /listings/{id}/`
- **Description**: Delete a listing
- **Auth Required**: Yes (own listing or admin)
- **Parameters**: `id` (listing ID)

### 6. Search Listings
- **Endpoint**: `GET /listings/search/`
- **Description**: Search listings with filters
- **Auth Required**: No
- **Query Parameters**: Same as List Listings

### 7. Get Listings by Partner
- **Endpoint**: `GET /listings/?partner_id={partner_id}`
- **Description**: Get all listings for a specific partner
- **Auth Required**: No
- **Query Parameters**: `partner_id` (partner ID)

---

## Booking Endpoints

### 1. List Bookings
- **Endpoint**: `GET /bookings/`
- **Description**: Get list of all bookings
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number
  - `page_size`: Items per page
  - `status`: Filter by status (pending, confirmed, active, completed, cancelled)

### 2. Get Booking Details
- **Endpoint**: `GET /bookings/{id}/`
- **Description**: Get booking details by ID
- **Auth Required**: Yes (own booking or admin)
- **Parameters**: `id` (booking ID)

### 3. Create Booking
- **Endpoint**: `POST /bookings/`
- **Description**: Create a new booking
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "listing": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-01-05",
    "pickup_location": "Location",
    "dropoff_location": "Location"
  }
  ```

### 4. Update Booking
- **Endpoint**: `PUT /bookings/{id}/` or `PATCH /bookings/{id}/`
- **Description**: Update booking information
- **Auth Required**: Yes (own booking or admin)
- **Parameters**: `id` (booking ID)
- **Request Body**: Booking data fields

### 5. Accept Booking
- **Endpoint**: `POST /bookings/{id}/accept/`
- **Description**: Accept a booking (partner only)
- **Auth Required**: Yes (must be partner)
- **Parameters**: `id` (booking ID)

### 6. Reject Booking
- **Endpoint**: `POST /bookings/{id}/reject/`
- **Description**: Reject a booking (partner only)
- **Auth Required**: Yes (must be partner)
- **Parameters**: `id` (booking ID)
- **Request Body**:
  ```json
  {
    "rejection_reason": "Reason for rejection"
  }
  ```

### 7. Cancel Booking
- **Endpoint**: `POST /bookings/{id}/cancel/`
- **Description**: Cancel a booking
- **Auth Required**: Yes (customer or partner)
- **Parameters**: `id` (booking ID)

### 8. Get Pending Requests
- **Endpoint**: `GET /bookings/pending-requests/`
- **Description**: Get all pending booking requests (partner only)
- **Auth Required**: Yes (must be partner)

### 9. Get Upcoming Bookings
- **Endpoint**: `GET /bookings/upcoming/`
- **Description**: Get upcoming bookings for authenticated user
- **Auth Required**: Yes

---

## Review Endpoints

### 1. List Reviews
- **Endpoint**: `GET /reviews/`
- **Description**: Get list of all reviews
- **Auth Required**: No (public viewing allowed)
- **Query Parameters**:
  - `listing`: Filter by listing ID
  - `user`: Filter by user ID
  - `my_listings`: Filter by own listings (true/false)
  - `page`: Page number
  - `page_size`: Items per page

### 2. Get Review Details
- **Endpoint**: `GET /reviews/{id}/`
- **Description**: Get review details by ID
- **Auth Required**: No (public viewing allowed)
- **Parameters**: `id` (review ID)

### 3. Create Review
- **Endpoint**: `POST /reviews/`
- **Description**: Create a new review
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "listing": 1,
    "rating": 5,
    "comment": "Great vehicle!",
    "title": "Excellent experience"
  }
  ```

### 4. Update Review
- **Endpoint**: `PUT /reviews/{id}/` or `PATCH /reviews/{id}/`
- **Description**: Update review information
- **Auth Required**: Yes (own review or admin)
- **Parameters**: `id` (review ID)
- **Request Body**: Review data fields

### 5. Delete Review
- **Endpoint**: `DELETE /reviews/{id}/`
- **Description**: Delete a review
- **Auth Required**: Yes (own review or admin)
- **Parameters**: `id` (review ID)

### 6. Publish Review
- **Endpoint**: `PATCH /reviews/{id}/publish/`
- **Description**: Publish a review (admin only)
- **Auth Required**: Yes (admin)
- **Parameters**: `id` (review ID)

### 7. Can Review
- **Endpoint**: `GET /reviews/can_review/`
- **Description**: Check if user can review a listing
- **Auth Required**: No
- **Query Parameters**:
  - `listing`: Listing ID
  - `user`: User ID

### 8. Vote on Review
- **Endpoint**: `POST /reviews/{id}/vote/` or `DELETE /reviews/{id}/vote/`
- **Description**: Vote (like/dislike) on a review
- **Auth Required**: Yes
- **Parameters**: `id` (review ID)

### 9. Respond to Review
- **Endpoint**: `POST /reviews/{id}/respond/` or `PATCH /reviews/{id}/respond/`
- **Description**: Respond to a review (partner only)
- **Auth Required**: Yes (must be partner)
- **Parameters**: `id` (review ID)
- **Request Body**:
  ```json
  {
    "response": "Thank you for your feedback!"
  }
  ```

### 10. Get Reviews by Listing
- **Endpoint**: `GET /reviews/?listing={listing_id}`
- **Description**: Get all reviews for a specific listing
- **Auth Required**: No
- **Query Parameters**: `listing` (listing ID)

### 11. Get Reviews by User
- **Endpoint**: `GET /reviews/?user={user_id}`
- **Description**: Get all reviews by a specific user
- **Auth Required**: No
- **Query Parameters**: `user` (user ID)

### 12. Get Reviews for My Listings
- **Endpoint**: `GET /reviews/?my_listings=true`
- **Description**: Get all reviews for partner's listings
- **Auth Required**: Yes (must be partner)

---

## Favorite Endpoints

### 1. List Favorites
- **Endpoint**: `GET /favorites/`
- **Description**: Get list of user's favorite listings
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number
  - `page_size`: Items per page

### 2. Get Favorite Details
- **Endpoint**: `GET /favorites/{id}/`
- **Description**: Get favorite details by ID
- **Auth Required**: Yes (own favorite)
- **Parameters**: `id` (favorite ID)

### 3. Create Favorite
- **Endpoint**: `POST /favorites/`
- **Description**: Add a listing to favorites
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "listing": 1
  }
  ```

### 4. Delete Favorite
- **Endpoint**: `DELETE /favorites/{id}/`
- **Description**: Remove a listing from favorites
- **Auth Required**: Yes (own favorite)
- **Parameters**: `id` (favorite ID)

---

## Admin Endpoints

### 1. Get Admin Stats
- **Endpoint**: `GET /admin/stats/`
- **Description**: Get admin dashboard statistics
- **Auth Required**: Yes (admin only)

### 2. Get Admin Users
- **Endpoint**: `GET /admin/users/`
- **Description**: Get users list for admin
- **Auth Required**: Yes (admin only)

---

## Newsletter Endpoints

### 1. Subscribe to Newsletter
- **Endpoint**: `POST /api/newsletter/subscribe/`
- **Description**: Subscribe to newsletter
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

## Response Format

### Success Response
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response
```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "field1": "value1"
    }
  ]
}
```

---

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### How to Authenticate

1. **Login** to get access and refresh tokens:
   ```bash
   POST /api/login/
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Include token** in request headers:
   ```
   Authorization: Bearer <access_token>
   ```

3. **Refresh token** when access token expires:
   ```bash
   POST /api/token/refresh/
   {
     "refresh": "<refresh_token>"
   }
   ```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
DJANGO_API_URL=http://localhost:8000
```

### Backend (.env)
```env
SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/airbcar
```

---

## Notes

- All dates should be in ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- File uploads should use `multipart/form-data` content type
- Image URLs should be valid HTTP/HTTPS URLs
- Pagination is available on list endpoints using `page` and `page_size` query parameters
- Public endpoints (marked with "Auth Required: No") can be accessed without authentication
- Protected endpoints require valid JWT token in `Authorization` header

---

## API Base URL Configuration

The API base URL is configured in:
- **Frontend**: `frontend/src/constants/index.js`
- **Environment**: `NEXT_PUBLIC_DJANGO_API_URL` or `DJANGO_API_URL`
- **Default**: `http://localhost:8000`

---

## Last Updated

- **Date**: 2025-01-27
- **Version**: 1.0.0

