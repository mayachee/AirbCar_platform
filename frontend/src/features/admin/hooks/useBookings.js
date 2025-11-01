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
      const bookingsData = await adminService.getBookings();
      const bookingsList = bookingsData.results || bookingsData || [];
      setBookings(bookingsList);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(err.message);
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

