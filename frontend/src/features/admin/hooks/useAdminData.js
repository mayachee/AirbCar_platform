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
      const [usersData, partnersData, bookingsData, listingsData, statsData] = await Promise.all([
        adminService.getUsers().catch(err => {
          console.warn('Users API error:', err);
          return { results: [], data: [] };
        }),
        adminService.getPartners().catch(err => {
          console.warn('Partners API error:', err);
          return { results: [], data: [] };
        }),
        adminService.getBookings().catch(err => {
          console.warn('Bookings API error:', err);
          return { results: [], data: [] };
        }),
        adminService.getStats().catch(err => {
          console.warn('Stats API error:', err);
          return {};
        }),
        adminService.getListings().catch(err => {
          console.warn('Listings API error:', err);
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

      // Generate chart data based on bookings
      if (Array.isArray(bookingsData.results || bookingsData)) {
        const bookings = bookingsData.results || bookingsData;
        const months = {};
        bookings.forEach(booking => {
          if (booking.created_at) {
            const month = new Date(booking.created_at).toLocaleString('default', { month: 'short' });
            months[month] = (months[month] || 0) + 1;
          }
        });

        const chartDataPoints = Object.keys(months).map(month => ({
          month,
          bookings: months[month],
          users: Math.floor(Math.random() * 50)
        }));

        setChartData(chartDataPoints.length > 0 ? chartDataPoints : [
          { month: "Jan", bookings: 0, users: 0 },
        ]);
      }

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
