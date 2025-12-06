'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { BookingsList } from '@/features/user';

export default function BookingsTab({ upcomingBookings, pastBookings, loading: propLoading, onViewDetails, onCancelBooking }) {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localUpcoming, setLocalUpcoming] = useState(upcomingBookings || []);
  const [localPast, setLocalPast] = useState(pastBookings || []);

  const fetchBookings = useCallback(async () => {
    try {
      setLocalLoading(true);
      setError(null);
      
      let allBookings = [];
      try {
        // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
        const response = await apiClient.get('/bookings/', undefined, { timeout: 90000 });
        allBookings = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      } catch (err) {
        console.log('General bookings endpoint not available');
      }

      // Try upcoming bookings endpoint
      try {
        // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
        const upcomingResponse = await apiClient.get('/bookings/upcoming/', undefined, { timeout: 90000 });
        let upcomingBookings = [];
        
        // Handle different response structures
        if (Array.isArray(upcomingResponse)) {
          upcomingBookings = upcomingResponse;
        } else if (upcomingResponse.data) {
          upcomingBookings = Array.isArray(upcomingResponse.data) ? upcomingResponse.data : [];
        }
        
        if (upcomingBookings.length > 0) {
          const existingIds = new Set(allBookings.map(b => b.id));
          const newBookings = upcomingBookings.filter(b => !existingIds.has(b.id));
          allBookings = [...allBookings, ...newBookings];
        }
      } catch (err) {
        console.log('Upcoming bookings endpoint not available:', err.message);
      }

      setBookings(allBookings);
      
      // Separate into upcoming and past
      const now = new Date();
      const upcoming = allBookings.filter(b => {
        const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
        const isValidDate = !isNaN(startDate.getTime());
        if (!isValidDate) return false;
        
        // Include pending, confirmed, or accepted bookings
        // Pending bookings should always show as "upcoming" since they haven't been processed yet
        const validStatuses = ['pending', 'confirmed', 'accepted'];
        const hasValidStatus = validStatuses.includes(b.status) || 
                              (b.status && !['cancelled', 'rejected', 'completed'].includes(b.status));
        
        // Show as upcoming if:
        // 1. Status is valid (pending/accepted/confirmed) OR not cancelled/rejected/completed
        // 2. Start date is in the future OR booking is pending (user wants to see their booking requests)
        return hasValidStatus && (
          startDate >= now ||  // Future booking
          b.status === 'pending'  // Always show pending bookings regardless of date
        );
      }).sort((a, b) => {
        const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
        const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
        return dateA - dateB;
      });
      
      const past = allBookings.filter(b => {
        const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
        const isValidDate = !isNaN(startDate.getTime());
        if (!isValidDate) return false;
        
        return startDate < now || 
               ['completed', 'cancelled', 'rejected'].includes(b.status);
      }).sort((a, b) => {
        const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
        const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
        return dateB - dateA;
      });
      
      setLocalUpcoming(upcoming);
      setLocalPast(past);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleViewBooking = (booking) => {
    if (onViewDetails) {
      onViewDetails(booking);
    } else {
      router.push(`/bookings/${booking.id}`);
    }
  };

  const handleCancel = async (booking) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await apiClient.post(`/bookings/${booking.id}/cancel/`);
      
      // Refresh the bookings
      await fetchBookings();
      
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const displayUpcoming = localUpcoming.length > 0 ? localUpcoming : (upcomingBookings || []);
  const displayPast = localPast.length > 0 ? localPast : (pastBookings || []);
  const isLoading = localLoading || propLoading;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">My Bookings</h3>
            <p className="text-gray-600">View and manage your car rental bookings</p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Bookings ({displayUpcoming.length})</h4>
        <BookingsList
          bookings={displayUpcoming}
          loading={isLoading}
          onViewDetails={handleViewBooking}
          onCancelBooking={onCancelBooking || handleCancel}
        />
      </div>

      {/* Past Bookings */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Past Bookings ({displayPast.length})</h4>
        <BookingsList
          bookings={displayPast}
          loading={isLoading}
          onViewDetails={handleViewBooking}
        />
      </div>
    </div>
  );
}

