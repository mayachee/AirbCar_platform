'use client';

import { useState } from 'react';
import { adminService } from '@/features/admin';

export const useExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.exportUsers();
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      setError(err.message || 'Failed to export users');
      console.error('Export error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.exportBookings();
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      setError(err.message || 'Failed to export bookings');
      console.error('Export error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    exportUsers,
    exportBookings,
    loading,
    error
  };
};

