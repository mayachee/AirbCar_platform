'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export function useAdminData() {
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalPartners: 0,
    totalListings: 0,
    totalEarnings: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchAdminData = async () => {
    try {
      setLoadingData(true);
      setErrors({});

      // Fetch all data in parallel using adminService
      // Use shorter timeout for faster failure detection
      const [usersResponse, partnersResponse, bookingsResponse, listingsResponse, statsResponse] = await Promise.all([
        adminService.getUsers().catch(err => {
          // Silently handle timeout/network errors, only warn for other errors
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Users API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Users API error:', err?.message || err);
          }
          return { data: { results: [], data: [] } };
        }),
        adminService.getPartners().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Partners API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Partners API error:', err?.message || err);
          }
          return { data: { results: [], data: [] } };
        }),
        adminService.getBookings().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Bookings API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Bookings API error:', err?.message || err);
          }
          return { data: { results: [], data: [] } };
        }),
        adminService.getListings().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Listings API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Listings API error:', err?.message || err);
          }
          return { data: { results: [], data: [] } };
        }),
        adminService.getStats().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Stats API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Stats API error:', err?.message || err);
          }
          return { data: {} };
        })
      ]);

      // Extract data from API responses (apiClient returns { data: {...}, success: true })
      // Backend returns { data: [...] } which gets wrapped to { data: { data: [...] }, success: true }
      const extractArrayData = (response) => {
        if (!response) return [];
        // If response is already an array
        if (Array.isArray(response)) return response;
        // Extract from apiClient wrapper
        const data = response.data || response;
        // If data is an array, return it
        if (Array.isArray(data)) return data;
        // If data has results property
        if (data.results && Array.isArray(data.results)) return data.results;
        // If data has nested data property
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
      };

      const extractStatsData = (response) => {
        if (!response) return {};
        // Extract from apiClient wrapper
        const data = response.data || response;
        // Backend AdminStatsView returns stats directly, not wrapped
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return data;
        }
        return {};
      };

      const usersList = extractArrayData(usersResponse);
      const partnersList = extractArrayData(partnersResponse);
      const bookingsList = extractArrayData(bookingsResponse);
      const listingsList = extractArrayData(listingsResponse);
      const statsData = extractStatsData(statsResponse);

      // Set users
      setUsers(usersList);
      setStats(prev => ({ ...prev, totalUsers: usersList.length }));

      // Set partners
      setPartners(partnersList);
      setStats(prev => ({ ...prev, totalPartners: partnersList.length }));

      // Set bookings
      setBookings(bookingsList);
      setStats(prev => ({ ...prev, totalBookings: bookingsList.length }));

      // Set listings
      setListings(listingsList);
      setStats(prev => ({ ...prev, totalListings: listingsList.length }));

      // Handle stats data - backend returns stats directly
      if (statsData && typeof statsData === 'object' && Object.keys(statsData).length > 0) {
        // Map backend stats to frontend format
        const mappedStats = {
          totalUsers: statsData.totalUsers || 0,
          totalPartners: statsData.totalPartners || 0,
          totalListings: statsData.totalListings || 0,
          totalBookings: statsData.totalBookings || 0,
          totalEarnings: statsData.totalEarnings || 0,
        };
        setStats(prev => ({ ...prev, ...mappedStats }));
      }

      // Generate chart data based on bookings and users (will be calculated in AdminCharts component)
      // Just provide empty array here - AdminCharts will calculate from actual bookings and users data
      setChartData([]);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrors({ message: error.message });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return {
    users,
    partners,
    bookings,
    listings,
    stats,
    chartData,
    loadingData,
    errors,
    refetch: fetchAdminData
  };
}
