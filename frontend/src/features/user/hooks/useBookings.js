'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/api';

export const useBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [upcomingBookingsList, setUpcomingBookingsList] = useState([]);

  // Load bookings
  const loadBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setUpcomingBookingsList([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all bookings
      const response = await bookingService.getBookings();
      const data = Array.isArray(response) ? response : (response.data || []);
      setBookings(data);

      // Also fetch upcoming bookings from the dedicated endpoint
      try {
        const upcomingResponse = await bookingService.getUpcomingBookings();
        const upcomingData = Array.isArray(upcomingResponse) ? upcomingResponse : (upcomingResponse.data || []);
        setUpcomingBookingsList(upcomingData);
      } catch (err) {
        console.log('Upcoming bookings endpoint not available, filtering from all bookings');
        // Fallback: filter from all bookings
        setUpcomingBookingsList([]);
      }
    } catch (err) {
      // Silently handle 404 errors - bookings endpoint might not be implemented yet
      if (err.message?.includes('404')) {
        console.log('Bookings endpoint not available yet');
      } else {
        console.warn('Could not load bookings:', err.message);
        setError(err.message);
      }
      setBookings([]);
      setUpcomingBookingsList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load booking history
  const loadHistory = useCallback(async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getBookings();
      const data = Array.isArray(response) ? response : (response.data || []);
      
      // Filter past bookings
      const now = new Date();
      const past = data.filter(booking => {
        const startDate = new Date(booking.start_time || booking.start_date || booking.pickup_date);
        return startDate < now || ['completed', 'cancelled', 'rejected'].includes(booking.status);
      });
      
      setBookings(past);
    } catch (err) {
      // Silently handle 404 errors - history endpoint might not be implemented yet
      if (err.message?.includes('404')) {
        console.log('Booking history endpoint not available yet');
      } else {
        console.warn('Could not load booking history:', err.message);
        setError(err.message);
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get upcoming bookings - use dedicated endpoint if available, otherwise filter
  const upcomingBookings = useCallback(() => {
    const now = new Date();
    
    // Combine both sources
    const allBookingsData = [...bookings];
    
    // Add upcoming bookings from dedicated endpoint if available
    if (upcomingBookingsList.length > 0) {
      const existingIds = new Set(allBookingsData.map(b => b.id));
      const newFromUpcoming = upcomingBookingsList.filter(b => !existingIds.has(b.id));
      allBookingsData.push(...newFromUpcoming);
    }
    
    // Filter upcoming bookings
    return allBookingsData.filter(booking => {
      const startDate = new Date(booking.start_time || booking.start_date || booking.pickup_date);
      const isValidDate = !isNaN(startDate.getTime());
      const status = (booking.status || '').toLowerCase();
      
      // Valid statuses for upcoming
      const validStatuses = ['pending', 'accepted', 'confirmed'];
      const hasValidStatus = validStatuses.includes(status) ||
                            (status && !['cancelled', 'rejected', 'completed'].includes(status));
      
      if (!hasValidStatus) return false;
      
      // Always show pending bookings regardless of date (new bookings)
      if (status === 'pending') return true;
      
      // For other statuses, must have valid date and be in future
      return isValidDate && startDate >= now;
    }).sort((a, b) => {
      const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
      const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
      return dateA - dateB;
    });
  }, [bookings, upcomingBookingsList]);

  // Get past bookings
  const pastBookings = useCallback(() => {
    const now = new Date();
    return bookings.filter(booking => {
      const startDate = new Date(booking.start_time || booking.start_date || booking.pickup_date);
      const isValidDate = !isNaN(startDate.getTime());
      if (!isValidDate) return false;
      
      return startDate < now || 
             ['completed', 'cancelled', 'rejected'].includes(booking.status);
    }).sort((a, b) => {
      const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
      const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
      return dateB - dateA;
    });
  }, [bookings]);

  // Get bookings by status
  const bookingsByStatus = useCallback((status) => {
    return bookings.filter(booking => booking.status === status);
  }, [bookings]);

  // Load bookings on mount and when user changes
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    loading,
    error,
    upcomingBookings,
    pastBookings,
    bookingsByStatus,
    loadBookings,
    loadHistory,
    refetch: loadBookings
  };
};
