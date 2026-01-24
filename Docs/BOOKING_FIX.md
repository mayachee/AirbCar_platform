# Fix for Booking Creation 400 Error

## Issue
The booking creation was failing with "Validation failed" (HTTP 400).

## Root Cause
The backend (`airbcar_backend/core`) model `Booking` requires `pickup_location` and `return_location` fields. The frontend was not sending these fields in the booking creation request. Additionally, the frontend was sending duplicate and legacy fields (`pickupDate`, `start_time`, etc.) that were not aligned with the active backend schema which expects `pickup_date`, `return_date`, `pickup_time`, and `return_time`.

## Fix
Updated `frontend/src/app/booking/page.js`:
1.  Extracted `location` from URL search parameters (defaulting to 'Tetouan').
2.  Updated `handleCreateBooking` to construct `FormData` with the correct fields:
    - `pickup_location`: from URL
    - `return_location`: from URL
    - `pickup_date`: YYYY-MM-DD
    - `return_date`: YYYY-MM-DD
    - `pickup_time`: HH:MM
    - `return_time`: HH:MM
3.  Removed redundant and unused fields (`start_time`, `end_time`, duplicates of dates).

This ensures the request payload matches the `BookingSerializer` and `BookingListView` requirements.
