/**
 * Unified Booking Hook
 * Provides consistent booking management across all modules
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BookingManager, bookingSync } from '../index';
import type { Booking } from '@/lib/api/types';

interface UseUnifiedBookingOptions {
  autoFetch?: boolean;
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function useUnifiedBooking(options: UseUnifiedBookingOptions = {}) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let fetchedBookings: Booking[] = [];

      // Role-based data fetching
      if (user.role === 'admin' || user.is_admin) {
        fetchedBookings = await BookingManager.getAllBookings(options.filters);
      } else if (user.is_partner || user.role === 'partner') {
        fetchedBookings = await BookingManager.getPartnerBookings();
      } else {
        fetchedBookings = await BookingManager.getUserBookings(user.role);
      }

      setBookings(fetchedBookings);
      setStats(BookingManager.getBookingStats(fetchedBookings));
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user, options.filters]);

  const acceptBooking = useCallback(async (bookingId: number) => {
    try {
      const updated = await BookingManager.updateBookingStatus(bookingId, 'accept');
      await fetchBookings();
      return updated;
    } catch (err) {
      throw err;
    }
  }, [fetchBookings]);

  const rejectBooking = useCallback(async (bookingId: number, reason: string) => {
    try {
      const updated = await BookingManager.updateBookingStatus(bookingId, 'reject', reason);
      await fetchBookings();
      return updated;
    } catch (err) {
      throw err;
    }
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId: number, reason: string) => {
    try {
      const updated = await BookingManager.updateBookingStatus(bookingId, 'cancel', reason);
      await fetchBookings();
      return updated;
    } catch (err) {
      throw err;
    }
  }, [fetchBookings]);

  const groupedBookings = BookingManager.groupBookingsByStatus(bookings);
  const filteredBookings = BookingManager.filterBookings(bookings, options.filters || {});

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchBookings();
    }

    // Subscribe to real-time updates
    const unsubscribe = bookingSync.subscribe((event) => {
      if (event.type === 'created' || event.type === 'status_changed' || event.type === 'sync') {
        fetchBookings();
      }
    });

    return () => unsubscribe();
  }, [fetchBookings, options.autoFetch]);

  return {
    bookings,
    filteredBookings,
    groupedBookings,
    loading,
    error,
    stats,
    fetchBookings,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    refetch: fetchBookings
  };
}

