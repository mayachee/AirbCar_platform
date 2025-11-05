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
      const [usersData, partnersData, bookingsData, listingsData, statsData] = await Promise.all([
        adminService.getUsers().catch(err => {
          // Silently handle timeout/network errors, only warn for other errors
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Users API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Users API error:', err?.message || err);
          }
          return { results: [], data: [] };
        }),
        adminService.getPartners().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Partners API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Partners API error:', err?.message || err);
          }
          return { results: [], data: [] };
        }),
        adminService.getBookings().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Bookings API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Bookings API error:', err?.message || err);
          }
          return { results: [], data: [] };
        }),
        adminService.getStats().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Stats API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Stats API error:', err?.message || err);
          }
          return {};
        }),
        adminService.getListings().catch(err => {
          if (err?.isTimeoutError || err?.isNetworkError) {
            console.warn('Listings API timeout/network error - backend may be unavailable');
          } else {
            console.warn('Listings API error:', err?.message || err);
          }
          return { results: [], data: [] };
        })
      ]);

      // Handle users data
      if (usersData && usersData.results) {
        setUsers(usersData.results);
        setStats(prev => ({ ...prev, totalUsers: usersData.results.length }));
      } else if (Array.isArray(usersData)) {
        setUsers(usersData);
        setStats(prev => ({ ...prev, totalUsers: usersData.length }));
      }

      // Handle partners data
      if (partnersData && partnersData.results) {
        setPartners(partnersData.results);
        setStats(prev => ({ ...prev, totalPartners: partnersData.results.length }));
      } else if (Array.isArray(partnersData)) {
        setPartners(partnersData);
        setStats(prev => ({ ...prev, totalPartners: partnersData.length }));
      }

      // Handle bookings data
      if (bookingsData && bookingsData.results) {
        setBookings(bookingsData.results);
        setStats(prev => ({ ...prev, totalBookings: bookingsData.results.length }));
      } else if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
        setStats(prev => ({ ...prev, totalBookings: bookingsData.length }));
      }

      // Handle listings data
      if (listingsData && listingsData.results) {
        setListings(listingsData.results);
        setStats(prev => ({ ...prev, totalListings: listingsData.results.length }));
      } else if (Array.isArray(listingsData)) {
        setListings(listingsData);
        setStats(prev => ({ ...prev, totalListings: listingsData.length }));
      }

      // Handle stats data
      if (statsData && typeof statsData === 'object') {
        setStats(prev => ({ ...prev, ...statsData }));
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
