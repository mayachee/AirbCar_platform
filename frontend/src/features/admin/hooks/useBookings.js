'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getBookings().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Bookings API timeout/network error, using empty list');
          return { results: [], data: [] };
        }
        throw err; // Re-throw other errors
      });
      
      // Handle different response structures
      let bookingsList = [];
      if (Array.isArray(response)) {
        bookingsList = response;
      } else if (response?.data) {
        bookingsList = Array.isArray(response.data) ? response.data : 
                      (response.data.results || []);
      } else if (response?.results) {
        bookingsList = Array.isArray(response.results) ? response.results : [];
      } else if (response) {
        const data = response?.data || response?.result || response;
        bookingsList = Array.isArray(data) ? data : [];
      }
      
      setBookings(bookingsList);
    } catch (err) {
      console.error('Error loading bookings:', err);
      // Don't set error for timeout/network errors - just use empty array
      if (!err?.isTimeoutError && !err?.isNetworkError) {
        setError(err?.message || 'Unknown error');
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const acceptBooking = async (bookingId) => {
    try {
      await adminService.acceptBooking(bookingId);
      await loadBookings();
      return true;
    } catch (err) {
      console.error('Error accepting booking:', err);
      return false;
    }
  };

  const rejectBooking = async (bookingId) => {
    try {
      await adminService.rejectBooking(bookingId);
      await loadBookings();
      return true;
    } catch (err) {
      console.error('Error rejecting booking:', err);
      return false;
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await adminService.cancelBooking(bookingId);
      await loadBookings();
      return true;
    } catch (err) {
      console.error('Error canceling booking:', err);
      return false;
    }
  };

  const updateBooking = async (bookingId, bookingData) => {
    try {
      const updated = await adminService.updateBooking(bookingId, bookingData);
      await loadBookings();
      return updated;
    } catch (err) {
      console.error('Error updating booking:', err);
      throw err;
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      await adminService.deleteBooking(bookingId);
      await loadBookings();
      return true;
    } catch (err) {
      console.error('Error deleting booking:', err);
      return false;
    }
  };

  const getPendingBookings = async () => {
    try {
      const pendingData = await adminService.getPendingBookings();
      return pendingData.results || pendingData || [];
    } catch (err) {
      console.error('Error loading pending bookings:', err);
      return [];
    }
  };

  return {
    bookings,
    loading,
    error,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    updateBooking,
    deleteBooking,
    getPendingBookings,
    refetch: loadBookings
  };
};

