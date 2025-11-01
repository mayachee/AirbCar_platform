# API Services Documentation

This document lists all available API services and methods in the frontend that connect to the Django backend.

## Table of Contents

- [Authentication Service](#authentication-service)
- [User Service](#user-service)
- [Booking Service](#booking-service)
- [Partner Service](#partner-service)
- [Vehicle/Listing Service](#vehiclelisting-service)
- [Admin Service](#admin-service)

---

## Authentication Service

**Location**: `frontend/src/features/auth/services/authService.ts`

**Import**: `import { authService } from '@/services/api'`

### Methods

#### Login & Registration
- `login(email: string, password: string)` - POST `/api/login/`
- `register(userData)` - POST `/api/register/`
- `logout()` - POST `/api/logout/`

#### Token Management
- `refreshToken(refreshToken: string)` - POST `/api/token/refresh/`
- `verifyToken()` - GET `/api/verify-token/`
- `verifyAdmin()` - GET `/api/verify-admin/`

#### Password Management
- `forgotPassword(email: string)` - POST `/api/password-reset/`
- `resetPasswordRequest(email: string)` - POST `/api/password-reset/`
- `resetPassword(uidb64: string, token: string, password: string)` - POST `/api/reset-password/<uidb64>/<token>/`
- `changePassword(passwordData)` - POST `/users/me/change-password/`

#### Email Verification
- `verifyEmail(token: string)` - GET `/verify-email/?token=<token>`
- `verifyEmailToken(token: string)` - POST `/api/verify-email/`
- `resendVerification()` - POST `/users/resend-verification/`

#### Profile Management
- `getProfile()` - GET `/users/me/`
- `getCurrentUser()` - GET `/users/me/`
- `updateProfile(profileData, profilePicture?, idFrontDocument?, idBackDocument?)` - PATCH `/users/me/`
- `uploadProfilePicture(file: File)` - PATCH `/users/me/`
- `deleteAccount()` - DELETE `/users/me/`

---

## User Service

**Location**: `frontend/src/features/user/services/userService.js`

**Import**: `import { userService } from '@/services/api'`

### Methods

#### List Operations
- `getUsers()` - GET `/users/` (Admin only)
- `getUserById(userId)` - GET `/users/<id>/`
- `getProfile()` - GET `/users/me/`

#### Create Operations
- `createUser(userData, profilePicture?, idFrontDocument?, idBackDocument?)` - POST `/api/register/`
  - Supports file uploads via FormData
  - Automatically handles profile picture and ID document uploads

#### Update Operations
- `updateUser(userId, userData, profilePicture?, idFrontDocument?, idBackDocument?)` - PUT `/users/<id>/`
  - Full update (PUT) - replaces entire resource
- `patchUser(userId, userData, profilePicture?, idFrontDocument?, idBackDocument?)` - PATCH `/users/<id>/`
  - Partial update (PATCH) - updates only specified fields
- `updateProfile(userData, profilePicture?, idFrontDocument?, idBackDocument?)` - PATCH `/users/me/`
  - Update current user profile

#### Delete Operations
- `deleteUser(userId)` - DELETE `/users/<id>/`
- `deleteAccount()` - DELETE `/users/me/`

---

## Booking Service

**Location**: `frontend/src/features/booking/services/bookingService.js`

**Import**: `import { bookingService } from '@/services/api'`

### Methods

#### List Operations
- `getBookings()` - GET `/bookings/`
  - Returns user's bookings + partner's car bookings (if user is partner)
- `getBooking(bookingId)` - GET `/bookings/<id>/`
- `getPendingRequests()` - GET `/bookings/pending-requests/` (Partner only)
- `getUpcomingBookings()` - GET `/bookings/upcoming/`

#### Create Operations
- `createBooking(bookingData)` - POST `/bookings/`
  - Booking data should include: `listing`, `start_time`, `end_time`, `price`, `request_message`

#### Update Operations
- `updateBooking(bookingId, bookingData)` - PUT `/bookings/<id>/`
  - Full update (PUT)
- `patchBooking(bookingId, bookingData)` - PATCH `/bookings/<id>/`
  - Partial update (PATCH)

#### Booking Actions
- `acceptBooking(bookingId)` - POST `/bookings/<id>/accept/` (Partner only)
- `rejectBooking(bookingId, rejectionReason?)` - POST `/bookings/<id>/reject/` (Partner only)
- `cancelBooking(bookingId)` - POST `/bookings/<id>/cancel/`

#### Delete Operations
- `deleteBooking(bookingId)` - DELETE `/bookings/<id>/`

---

## Partner Service

**Location**: `frontend/src/features/partner/services/partnerService.js`

**Import**: `import { partnerService } from '@/services/api'`

### Methods

#### Partner Management
- `registerPartner(partnerData)` - POST `/partners/`
  - Creates new partner account
- `getPartnerProfile()` - GET `/partners/me/`
- `getPartnerById(partnerId)` - GET `/partners/<id>/`
- `updatePartnerProfile(profileData)` - PATCH `/partners/me/`
- `updatePartner(partnerId, partnerData)` - PUT `/partners/<id>/`
- `patchPartner(partnerId, partnerData)` - PATCH `/partners/<id>/`
- `deletePartner(partnerId)` - DELETE `/partners/<id>/`

#### Vehicle Management (Listings)
- `getVehicles()` - GET partner's vehicles from profile
- `getVehiclesByPartnerId(partnerId)` - GET `/listings/?partner_id=<id>`
- `getVehicle(vehicleId)` - GET `/listings/<id>/`
- `addVehicle(vehicleData)` - POST `/listings/`
  - Supports FormData with pictures array
- `updateVehicle(vehicleId, vehicleData)` - PUT `/listings/<id>/`
- `patchVehicle(vehicleId, vehicleData)` - PATCH `/listings/<id>/`
- `deleteVehicle(vehicleId)` - DELETE `/listings/<id>/`

#### Booking Management
- `getBookings()` - GET `/bookings/`
- `getPendingRequests()` - GET `/bookings/pending-requests/`
- `getUpcomingBookings()` - GET `/bookings/upcoming/`
- `acceptBooking(bookingId)` - POST `/bookings/<id>/accept/`
- `rejectBooking(bookingId, rejectionReason?)` - POST `/bookings/<id>/reject/`
- `cancelBooking(bookingId)` - POST `/bookings/<id>/cancel/`

#### Dashboard & Analytics
- `getDashboardData()` - Aggregates partner, bookings, and pending requests
- `getStats()` - Calculates partner statistics (vehicles, bookings, earnings)

---

## Vehicle/Listing Service

**Location**: `frontend/src/features/vehicle/services/vehicleService.ts`

**Import**: `import { vehicleService } from '@/services/api'` or `import { listingsService } from '@/services/api'`

### Methods

#### List Operations
- `getVehicles(filters?)` - GET `/listings/`
  - Supports filters: location, brand, priceRange, fuelType, transmission, seats
  - Query parameters: `?location=...&brand=...&min_price=...&max_price=...`
- `getVehicle(vehicleId)` - GET `/listings/<id>/`
- `searchVehicles(searchParams)` - GET `/listings/search/`
- `getFeaturedVehicles()` - GET `/listings/featured/`
- `getPopularVehicles()` - GET `/listings/popular/`

#### Create Operations
- `createVehicle(vehicleData)` - POST `/listings/`
  - Supports FormData with pictures array

#### Update Operations
- `updateVehicle(vehicleId, vehicleData)` - PUT `/listings/<id>/`
  - Full update (PUT)
- `patchVehicle(vehicleId, vehicleData)` - PATCH `/listings/<id>/`
  - Partial update (PATCH)

#### Delete Operations
- `deleteVehicle(vehicleId)` - DELETE `/listings/<id>/`

#### Reviews & Favorites
- `getVehicleReviews(vehicleId)` - GET `/listings/<id>/reviews/`
- `addVehicleReview(vehicleId, reviewData)` - POST `/listings/<id>/reviews/`
- `toggleFavorite(vehicleId)` - POST `/favorites/<id>/`
- `getFavorites()` - GET `/favorites/`
- `removeFavorite(vehicleId)` - DELETE `/favorites/<id>/`

---

## Admin Service

**Location**: `frontend/src/features/admin/services/adminService.js`

**Import**: `import { adminService } from '@/services/api'`

### Methods

#### Users Management
- `getUsers()` - GET `/users/`
- `getUserById(userId)` - GET `/users/<id>/`
- `createUser(userData)` - POST `/users/`
- `updateUser(userId, userData)` - PATCH `/users/<id>/`
- `deleteUser(userId)` - DELETE `/users/<id>/`

#### Partners Management
- `getPartners()` - GET `/partners/`
- `getPartnerById(partnerId)` - GET `/partners/<id>/`
- `updatePartner(partnerId, partnerData)` - PATCH `/partners/<id>/`
- `deletePartner(partnerId)` - DELETE `/partners/<id>/`
- `approvePartner(partnerId)` - POST `/partners/<id>/approve/` (if implemented)
- `rejectPartner(partnerId)` - POST `/partners/<id>/reject/` (if implemented)

#### Bookings Management
- `getBookings()` - GET `/bookings/`
- `getBookingById(bookingId)` - GET `/bookings/<id>/`
- `updateBooking(bookingId, bookingData)` - PATCH `/bookings/<id>/`
- `deleteBooking(bookingId)` - DELETE `/bookings/<id>/`
- `acceptBooking(bookingId)` - POST `/bookings/<id>/accept/`
- `rejectBooking(bookingId)` - POST `/bookings/<id>/reject/`
- `cancelBooking(bookingId)` - POST `/bookings/<id>/cancel/`
- `getPendingBookings()` - GET `/bookings/pending-requests/`

#### Listings Management
- `getListings()` - GET `/listings/`
- `getListingById(listingId)` - GET `/listings/<id>/`
- `updateListing(listingId, listingData)` - PATCH `/listings/<id>/`
- `deleteListing(listingId)` - DELETE `/listings/<id>/`

#### Statistics & Analytics
- `getStats()` - GET `/admin/stats/` (with fallback)
- `getUserStats()` - GET `/admin/users/stats/`
- `getBookingStats()` - GET `/admin/bookings/stats/`
- `getAnalytics()` - GET `/admin/analytics/`
- `getRevenueAnalytics()` - GET `/admin/revenue/`

#### Export & Reports
- `exportUsers()` - GET `/admin/users/export/`
- `exportBookings()` - GET `/admin/bookings/export/`
- `generateReport(reportData)` - POST `/admin/reports/generate/`

#### Settings & Notifications
- `getSettings()` - GET `/admin/settings/`
- `updateSettings(settingsData)` - PATCH `/admin/settings/`
- `sendNotification(notificationData)` - POST `/admin/notifications/send/`

---

## Common Usage Patterns

### File Uploads

All services support file uploads using FormData:

```javascript
import { userService } from '@/services/api'

// Upload profile picture with user update
const formData = new FormData()
formData.append('first_name', 'John')
formData.append('last_name', 'Doe')
formData.append('profile_picture', file) // File object

const result = await userService.updateProfile(formData)
```

### Error Handling

All services use the `apiClient` which throws errors on failed requests:

```javascript
import { bookingService } from '@/services/api'

try {
  const booking = await bookingService.createBooking(bookingData)
  console.log('Booking created:', booking)
} catch (error) {
  console.error('Error creating booking:', error.message)
}
```

### Authentication

Most endpoints require authentication. The `apiClient` automatically adds the JWT token from localStorage. Make sure user is logged in before calling protected endpoints.

---

## API Client

**Location**: `frontend/src/lib/api/client.ts`

The `apiClient` is the base HTTP client used by all services. It provides:
- Automatic JWT token injection
- Request/response caching
- Error handling
- Retry logic
- FormData support

**Import**: `import { apiClient } from '@/lib/api/client'` or `import { apiClient } from '@/services/api'`

---

## Constants

**Location**: `frontend/src/constants/index.js`

All API endpoints are defined in `API_ENDPOINTS` constant for easy reference and maintenance.

