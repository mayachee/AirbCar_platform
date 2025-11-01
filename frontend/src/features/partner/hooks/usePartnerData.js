'use client';

import { useState, useEffect, useCallback } from 'react';
import { partnerService } from '@/features/partner/services/partnerService';

export function usePartnerData() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [partnerData, setPartnerData] = useState(null);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeBookings: 0,
    monthlyEarnings: 0,
    completedRentals: 0,
    pendingRequests: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      // Use the new dashboard data method
      const dashboardData = await partnerService.getDashboardData();
      const statsData = await partnerService.getStats();
      
      console.log('Partner dashboard data:', {
        partner: dashboardData.partner,
        vehiclesCount: dashboardData.vehicles?.length || 0,
        vehicles: dashboardData.vehicles,
        bookingsCount: dashboardData.bookings?.length || 0
      });
      
      setPartnerData(dashboardData.partner);
      setVehicles(dashboardData.vehicles || []);
      setBookings(dashboardData.bookings || []);
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching partner data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error?.status,
        data: error?.data
      });
      // Set empty arrays on error to prevent undefined issues
      setVehicles([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData) => {
    try {
      const response = await partnerService.addVehicle(vehicleData);
      const newVehicle = response.data;
      setVehicles(prev => [...prev, newVehicle]);
      return newVehicle;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicleId, vehicleData) => {
    try {
      const response = await partnerService.updateVehicle(vehicleId, vehicleData);
      const updatedVehicle = response.data;
      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      return updatedVehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      await partnerService.deleteVehicle(vehicleId);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const acceptBooking = async (bookingId) => {
    try {
      const response = await partnerService.acceptBooking(bookingId);
      const updatedBooking = response.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      return updatedBooking;
    } catch (error) {
      console.error('Error accepting booking:', error);
      throw error;
    }
  };

  const rejectBooking = async (bookingId, rejectionReason = '') => {
    try {
      const response = await partnerService.rejectBooking(bookingId, rejectionReason);
      const updatedBooking = response.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      return updatedBooking;
    } catch (error) {
      console.error('Error rejecting booking:', error);
      throw error;
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const response = await partnerService.cancelBooking(bookingId);
      const updatedBooking = response.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      return updatedBooking;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const getPendingRequests = async () => {
    try {
      const response = await partnerService.getPendingRequests();
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  };

  const getUpcomingBookings = async () => {
    try {
      const response = await partnerService.getUpcomingBookings();
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw error;
    }
  };

  // Memoize refetch to prevent unnecessary re-renders
  const memoizedRefetch = useCallback(() => {
    fetchPartnerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchPartnerData is stable, so we don't need it in deps

  useEffect(() => {
    fetchPartnerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    vehicles,
    bookings,
    partnerData,
    stats,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    getPendingRequests,
    getUpcomingBookings,
    refetch: memoizedRefetch
  };
}
