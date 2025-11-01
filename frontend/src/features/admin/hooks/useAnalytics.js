'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load analytics, but don't crash if endpoints don't exist
      const [analyticsData, revenueData, statsData] = await Promise.all([
        adminService.getAnalytics().catch((err) => {
          console.warn('Analytics endpoint not available:', err);
          return null;
        }),
        adminService.getRevenueAnalytics().catch((err) => {
          console.warn('Revenue analytics endpoint not available:', err);
          return null;
        }),
        adminService.getStats().catch((err) => {
          console.warn('Stats endpoint not available:', err);
          return null;
        })
      ]);

      setAnalytics(analyticsData);
      setRevenue(revenueData);
      setStats(statsData);
    } catch (err) {
      // Silently handle errors for analytics
      console.warn('Analytics loading error (non-critical):', err);
      setError(null); // Don't show error to user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    analytics,
    revenue,
    stats,
    loading,
    error,
    refetch: loadAnalytics
  };
};

