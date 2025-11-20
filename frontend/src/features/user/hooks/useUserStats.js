'use client';

import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export const useUserStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUserStats();
      // Handle both direct data and wrapped response
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      // Ensure we always have a stats object
      setStats(data || {
        total_bookings: 0,
        upcoming_bookings: 0,
        past_bookings: 0,
        total_favorites: 0,
        pending_bookings: 0,
        completed_bookings: 0
      });
    } catch (err) {
      // Silently handle 404 errors - stats endpoint might not be implemented yet
      if (err.message?.includes('404')) {
        console.log('Stats endpoint not available yet');
      } else {
        setError(err.message || 'Failed to load statistics');
        console.warn('Could not load user stats:', err.message);
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
