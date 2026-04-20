'use client';

import { useState, useEffect, useCallback } from 'react';
import { partnerService } from '@/features/partner/services/partnerService';
import { fixImageUrl } from '@/utils/imageUtils';

export function usePartnerData() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [partnerData, setPartnerData] = useState(null);
  const [hasPartnerProfile, setHasPartnerProfile] = useState(true);
  const [partnerError, setPartnerError] = useState(null);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeBookings: 0,
    monthlyEarnings: 0,
    completedRentals: 0,
    pendingRequests: 0,
    averageRating: 0
  });
  const [earnings, setEarnings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to normalize vehicle images
  const normalizeVehicleImages = useCallback((vehicle) => {
    if (!vehicle) return vehicle;
    
    // Create a copy to avoid mutating the original
    const normalized = { ...vehicle };
    
    // Ensure images is an array
    if (!normalized.images || !Array.isArray(normalized.images)) {
      normalized.images = [];
    }
    
    // Process each image to ensure proper URL format
    normalized.images = normalized.images.map(img => {
      if (typeof img === 'string') {
        // If it's a string, fix the URL
        return fixImageUrl(img);
      } else if (typeof img === 'object' && img !== null) {
        // If it's an object, fix the url/image/path field
        if (img.url) {
          return { ...img, url: fixImageUrl(img.url) };
        } else if (img.image) {
          return { ...img, image: fixImageUrl(img.image), url: fixImageUrl(img.image) };
        } else if (img.path) {
          return { ...img, path: fixImageUrl(img.path), url: fixImageUrl(img.path) };
        }
        return img;
      }
      return img;
    });
    
    return normalized;
  }, []);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      setPartnerError(null);
      
      // Use the new dashboard data method
      const dashboardData = await partnerService.getDashboardData();
      
      console.log('usePartnerData - Full dashboardData:', dashboardData);
      console.log('usePartnerData - dashboardData.partner:', dashboardData.partner);
      console.log('usePartnerData - has_partner_profile:', dashboardData.has_partner_profile);
      
      // Check if partner profile exists
      if (dashboardData.has_partner_profile === false) {
        console.log('usePartnerData - Partner profile not found');
        setHasPartnerProfile(false);
        setPartnerError(dashboardData.error || 'Partner profile not found');
        setPartnerData(null);
        setVehicles([]);
        setBookings([]);
        setStats({
          totalVehicles: 0,
          activeBookings: 0,
          monthlyEarnings: 0,
          completedRentals: 0,
          pendingRequests: 0,
          averageRating: 0
        });
        return;
      }
      
      setHasPartnerProfile(true);

      // Compute stats from dashboard data instead of making a separate API call
      const vehiclesCount = (dashboardData.vehicles || []).length;
      const bookingsList = dashboardData.bookings || [];
      const pendingList = dashboardData.pendingRequests || [];
      const activeBookings = bookingsList.filter(b => b.status === 'accepted').length;
      const completedRentals = bookingsList.filter(b => b.status === 'completed').length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyEarnings = bookingsList
        .filter(b => {
          if (!b.start_time && !b.start_date && !b.pickup_date) return false;
          const bookingDate = new Date(b.start_time || b.start_date || b.pickup_date);
          return bookingDate.getMonth() === currentMonth &&
                 bookingDate.getFullYear() === currentYear &&
                 b.status === 'completed';
        })
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || parseFloat(b.total_amount) || 0), 0);

      const statsData = {
        totalVehicles: vehiclesCount,
        activeBookings,
        pendingRequests: pendingList.length,
        completedRentals,
        monthlyEarnings,
        averageRating: dashboardData.partner?.average_rating || 0
      };
      
      console.log('usePartnerData - Partner dashboard data:', {
        partner: dashboardData.partner,
        partnerType: typeof dashboardData.partner,
        partnerKeys: dashboardData.partner ? Object.keys(dashboardData.partner) : 'null',
        phone_number: dashboardData.partner?.phone_number,
        business_type: dashboardData.partner?.business_type,
        business_name: dashboardData.partner?.business_name,
        tax_id: dashboardData.partner?.tax_id,
        phone: dashboardData.partner?.phone, // Check if phone field exists
        vehiclesCount: dashboardData.vehicles?.length || 0,
        vehicles: dashboardData.vehicles,
        bookingsCount: dashboardData.bookings?.length || 0
      });
      
      // Ensure we're setting the partner data correctly
      if (!dashboardData.partner) {
        console.warn('usePartnerData - WARNING: dashboardData.partner is null/undefined!');
        console.warn('usePartnerData - dashboardData keys:', Object.keys(dashboardData));
      }
      
      setPartnerData(dashboardData.partner);
      // Ensure vehicles is always an array
      const vehiclesList = Array.isArray(dashboardData.vehicles) ? dashboardData.vehicles : [];
      console.log('usePartnerData - Setting vehicles from dashboardData:', vehiclesList.length, vehiclesList);
      
      // Merge with existing vehicles to avoid losing locally added ones
      setVehicles(prev => {
        // Filter out any response objects that might have been added incorrectly
        const cleanPrev = prev.filter(v => {
          // Remove objects that are API response objects (have message/success but no proper vehicle structure)
          if (v.message && v.success && !v.make && !v.model && !v.id) {
            return false;
          }
          // Keep only valid vehicle objects with an id
          return v && v.id;
        }).map(normalizeVehicleImages);
        
        // If we have existing vehicles and new vehicles, merge them (avoid duplicates)
        if (cleanPrev.length > 0 && vehiclesList.length > 0) {
          const merged = [...cleanPrev];
          vehiclesList.forEach(newVehicle => {
            // Only add valid vehicle objects
            if (newVehicle && newVehicle.id && !merged.some(v => v.id === newVehicle.id)) {
              merged.push(normalizeVehicleImages(newVehicle));
            }
          });
          console.log('usePartnerData - Merged vehicles:', merged.length, merged);
          return merged;
        }
        // If API returned empty, trust the server
        if (vehiclesList.length === 0) {
          return [];
        }
        // Otherwise use the new list (also filter it to ensure it's clean)
        const cleanVehiclesList = vehiclesList
          .filter(v => v && v.id && !(v.message && v.success && !v.make))
          .map(normalizeVehicleImages);
        return cleanVehiclesList;
      });
      
      setBookings(dashboardData.bookings || []);
      setStats(statsData);

      // Fetch additional data in parallel
      try {
        const [earningsData, analyticsData, reviewsData, activityData] = await Promise.allSettled([
          partnerService.getEarnings(),
          partnerService.getAnalytics('30d'),
          partnerService.getReviews(),
          partnerService.getActivity()
        ]);

        if (earningsData.status === 'fulfilled') {
          setEarnings(earningsData.value?.data?.data || earningsData.value?.data || null);
        }
        if (analyticsData.status === 'fulfilled') {
          setAnalytics(analyticsData.value?.data?.data || analyticsData.value?.data || null);
        }
        if (reviewsData.status === 'fulfilled') {
          setReviews(reviewsData.value?.data?.data || reviewsData.value?.data || null);
        }
        if (activityData.status === 'fulfilled') {
          setActivity(activityData.value?.data?.data || activityData.value?.data || []);
        }
      } catch (err) {
        console.error('Error fetching additional partner data:', err);
      }

    } catch (error) {
      console.error('Error fetching partner data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error?.status,
        data: error?.data
      });
      
      // Check if it's a "partner profile not found" error
      if (error?.status === 404 && error?.message?.includes('Partner profile not found')) {
        setHasPartnerProfile(false);
        setPartnerError(error.message);
      } else {
        setPartnerError(error.message || 'Failed to load partner data');
      }
      
      // Set empty arrays on error to prevent undefined issues
      setVehicles([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData) => {
    try {
      // Check if this is a bulk create
      if (vehicleData.bulk && vehicleData.vehicles) {
        const response = await partnerService.addVehiclesBulk(vehicleData.vehicles);
        // API client wraps: { data: backendResponse, success: true }
        // Backend returns: { data: [...], created_count: N, ... }
        // So we need: response.data.data
        const newVehicles = response.data?.data || response.data || [];
        console.log('Bulk create response:', response);
        console.log('New vehicles:', newVehicles);
        if (Array.isArray(newVehicles) && newVehicles.length > 0) {
          // Filter out any response objects and ensure we only have valid vehicles
          const validVehicles = newVehicles
            .filter(v => v && v.id && !(v.message && v.success && !v.make))
            .map(normalizeVehicleImages);
          setVehicles(prev => {
            // Also clean existing vehicles
            const cleanPrev = prev
              .filter(v => v && v.id && !(v.message && v.success && !v.make))
              .map(normalizeVehicleImages);
            const updated = [...cleanPrev, ...validVehicles];
            console.log('Updated vehicles list (bulk):', updated.length, updated);
            return updated;
          });
          return validVehicles;
        }
        return newVehicles;
      } else {
        const response = await partnerService.addVehicle(vehicleData);
        console.log('Add vehicle response:', response);
        // API client wraps: { data: backendResponse, success: true }
        // Backend returns: { data: {...}, message: '...' }
        // So we need: response.data.data
        const newVehicle = response.data?.data || response.data;
        console.log('New vehicle extracted:', newVehicle);
        if (newVehicle && newVehicle.id) {
          // Normalize images before adding
          const normalizedVehicle = normalizeVehicleImages({ ...newVehicle });
          setVehicles(prev => {
            // Check if vehicle already exists (avoid duplicates)
            const exists = prev.some(v => v.id === normalizedVehicle.id);
            if (exists) {
              console.log('Vehicle already in list, updating:', normalizedVehicle.id);
              return prev.map(v => v.id === normalizedVehicle.id ? normalizedVehicle : normalizeVehicleImages(v));
            } else {
              const updated = [...prev.map(normalizeVehicleImages), normalizedVehicle];
              console.log('Updated vehicles list (single):', updated.length, updated);
              return updated;
            }
          });
          return normalizedVehicle;
        } else {
          console.warn('New vehicle missing or invalid:', newVehicle);
        }
        return newVehicle;
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
      // Log full error details including non-enumerable properties
      try {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorData = error?.data || error?.response?.data;
        const errorStatus = error?.status || error?.response?.status;
        
        console.error('Vehicle creation failed:', {
          message: errorMsg,
          status: errorStatus,
          data: errorData
        });
        
        // Ensure we throw an object with message to avoid empty error details upstream
        if (!error.message) {
           error.message = errorMsg;
        }
      } catch (logError) {
        console.error('Failed to parse error details:', logError);
      }
      
      throw error;
    }
  };

  const updateVehicle = async (vehicleId, vehicleData) => {
    try {
      const response = await partnerService.updateVehicle(vehicleId, vehicleData);
      // API client wraps: { data: backendResponse, success: true }
      // Backend returns: { data: {...listing...}, message: '...', success: true, ... }
      // So we need: response.data.data (the actual listing)
      const updatedVehicle = response.data?.data || response.data;
      
      // Ensure we have a valid vehicle object with an id
      if (updatedVehicle && updatedVehicle.id) {
        // Normalize images before updating
        const normalizedVehicle = normalizeVehicleImages({ ...updatedVehicle });
        setVehicles(prev => {
          // Filter out any invalid objects (response objects) and update the correct vehicle
          const cleaned = prev
            .filter(v => {
              // Remove objects that are response objects (have message/success but no proper vehicle structure)
              if (v.message && v.success && !v.make && !v.model) {
                return false;
              }
              return true;
            })
            .map(normalizeVehicleImages);
          return cleaned.map(v => v.id === vehicleId ? normalizedVehicle : v);
        });
        return normalizedVehicle;
      } else {
        console.warn('Updated vehicle missing or invalid:', updatedVehicle);
        // Refetch vehicles to get the updated data
        await refetch();
        return updatedVehicle;
      }
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
      
      // If listing not found (404), it's already deleted, so remove from UI
      if (error?.status === 404 || error?.message?.includes('not found')) {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        return;
      }
      
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
      if (!hasPartnerProfile) return [];
      const response = await partnerService.getPendingRequests();
      // API client wraps: { data: backendResponse, success: true }
      // Backend returns: { data: [...], count: N }
      // So we need: response.data.data or response.data
      const data = response?.data?.data || response?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Expected when user has no partner profile yet
      if (error?.status === 404 && (error?.message || '').toLowerCase().includes('partner profile not found')) {
        return [];
      }
      console.error('Error fetching pending requests:', error);
      return [];
    }
  };

  const getUpcomingBookings = async () => {
    try {
      if (!hasPartnerProfile) return [];
      const response = await partnerService.getUpcomingBookings();
      // API client wraps: { data: backendResponse, success: true }
      // Backend returns: { data: [...], count: N }
      // So we need: response.data.data or response.data
      const data = response?.data?.data || response?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Expected when user has no partner profile yet
      if (error?.status === 404 && (error?.message || '').toLowerCase().includes('partner profile not found')) {
        return [];
      }
      console.error('Error fetching upcoming bookings:', error);
      return [];
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
    earnings,
    analytics,
    reviews,
    activity,
    loading,
    hasPartnerProfile,
    partnerError,
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
