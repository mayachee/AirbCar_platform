# Booking Flow Integration Guide

## Overview
The booking system is now fully integrated across Account, Admin, and Partner Dashboard modules with real-time synchronization.

## Architecture

### Core Components

1. **BookingManager** (`/lib/booking/BookingManager.ts`)
   - Centralized booking operations
   - Role-based data fetching
   - Status management (accept/reject/cancel)
   - Statistics and filtering

2. **BookingSyncManager** (`/lib/booking/BookingSyncManager.ts`)
   - Real-time synchronization
   - Event-based notifications
   - Auto-sync every 30 seconds
   - Cross-module communication

3. **useUnifiedBooking Hook** (`/lib/booking/hooks/useUnifiedBooking.ts`)
   - Consistent API across modules
   - Automatic real-time updates
   - Role-based filtering
   - Loading and error states

## Integration Points

### 1. User Account Module
**Location**: `/app/account`

**Features**:
- View personal bookings in `BookingsTab`
- See upcoming bookings in `ProfileTab`
- Cancel bookings
- Track booking history

**Usage**:
```typescript
import { useUnifiedBooking } from '@/lib/booking';

const { bookings, groupedBookings, cancelBooking } = useUnifiedBooking();
```

### 2. Partner Dashboard
**Location**: `/app/partner/dashboard`

**Features**:
- View booking requests for their listings
- Accept/reject pending bookings
- Manage upcoming rentals
- Track earnings

**Usage**:
```typescript
const { 
  bookings: pendingRequests,
  acceptBooking,
  rejectBooking
} = useUnifiedBooking({ 
  filters: { status: 'pending' } 
});
```

### 3. Admin Dashboard
**Location**: `/app/admin/dashboard`

**Features**:
- View all bookings
- Filter by status and date
- Manage bookings system-wide
- Analytics and statistics

**Usage**:
```typescript
const { 
  bookings: allBookings,
  stats,
  groupedBookings
} = useUnifiedBooking();
```

## Real-Time Synchronization

### How It Works
1. When a booking is created or updated, `BookingSyncManager` notifies all subscribed components
2. Components automatically refetch their data
3. Updates appear across all modules within 30 seconds or immediately

### Usage Example
```typescript
import { bookingSync } from '@/lib/booking';

// Subscribe to updates
const unsubscribe = bookingSync.subscribe((event) => {
  console.log('Booking changed:', event);
  // Refresh your data
  refetch();
});

// Cleanup
return () => unsubscribe();
```

## Role-Based Access

### Customer
- Can create bookings
- View own bookings
- Cancel pending bookings
- See booking history

### Partner
- See bookings for their vehicles
- Accept/reject booking requests
- Manage upcoming rentals
- Track revenue

### Admin
- View all bookings
- Manage any booking
- System-wide statistics
- Full access control

## Data Flow

```
┌─────────────────┐
│  Booking Created│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BookingManager  │
│   (Validates)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  bookingSync    │
│  (Notifies)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│Account │ │Partner │ │ Admin  │
│Updates │ │Updates │ │Updates │
└────────┘ └────────┘ └────────┘
```

## Caching Strategy

- **Cache Invalidation**: Automatically invalidates relevant caches on updates
- **Pattern-based**: Clears related booking caches (`pending-requests`, `upcoming`)
- **Smart Updates**: Only refetches when necessary

## Error Handling

All booking operations include comprehensive error handling:
- Network errors
- Validation errors
- Permission errors
- Automatic retry for transient failures

## Best Practices

1. **Always use `useUnifiedBooking` hook** for consistency
2. **Subscribe to sync events** for real-time updates
3. **Invalidate caches** after mutations
4. **Handle loading states** in UI
5. **Show error messages** to users

## API Endpoints

- `GET /bookings/` - Get user's bookings
- `GET /bookings/pending-requests/` - Partner pending requests
- `POST /bookings/` - Create booking
- `POST /bookings/{id}/accept/` - Accept booking
- `POST /bookings/{id}/reject/` - Reject booking
- `POST /bookings/{id}/cancel/` - Cancel booking

## Testing

Test the integration by:
1. Creating a booking as a customer
2. Checking if it appears in Partner Dashboard
3. Accepting/rejecting as a partner
4. Verifying updates across all modules

## Troubleshooting

**Issue**: Updates not appearing
- Check if component is subscribed to `bookingSync`
- Verify cache invalidation
- Check network connectivity

**Issue**: Role-based access issues
- Verify user role in auth context
- Check API permissions
- Review role-based filtering logic

