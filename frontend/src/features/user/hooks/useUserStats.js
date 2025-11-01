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
      const data = await userService.getUserStats();
      setStats(data);
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
