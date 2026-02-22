'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { ProfileSection } from '@/features/user';

export default function ProfileTab({
  accountData,
  handleAccountFieldChange,
  formatProfileCompletion,
  profileCompletion,
  onProfilePictureChange,
  handleSaveProfile,
  saving,
  stats: propStats,
  upcomingBookings: propUpcomingBookings = [],
  saveMessage = null
}) {
  const t = useTranslations('account');
  const router = useRouter();
  const [stats, setStats] = useState(propStats || null);
  const [upcomingBookings, setUpcomingBookings] = useState(propUpcomingBookings || []);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch fresh data including stats and bookings
  const fetchData = useCallback(async () => {
    try {
      setLocalLoading(true);
      setError(null);

      // Fetch bookings
      let allBookings = [];
      try {
        const bookingsResponse = await apiClient.get('/bookings/', undefined, { timeout: 90000 });
        const responseData = bookingsResponse.data;
        if (Array.isArray(responseData)) {
          allBookings = responseData;
        } else if (responseData && Array.isArray(responseData.results)) {
          allBookings = responseData.results;
        } else if (responseData && Array.isArray(responseData.data)) {
          allBookings = responseData.data;
        } else {
          allBookings = [];
        }
      } catch (err) {
        if (!err.message?.includes('404') && err.status !== 404) {
          console.error('Error fetching bookings:', err);
        }
        allBookings = [];
      }

      const combinedBookings = Array.isArray(allBookings) ? [...allBookings] : [];
      
      // Filter upcoming bookings
      const now = new Date();
      const upcoming = combinedBookings.filter(b => {
        const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
        return startDate >= now && ['pending', 'confirmed', 'accepted'].includes(b.status);
      }).sort((a, b) => new Date(a.start_time || a.start_date) - new Date(b.start_time || b.start_date));
      
      setUpcomingBookings(upcoming);

      // Fetch favorites count
      let favoritesCount = 0;
      try {
        const favoritesResponse = await apiClient.get('/favorites/');
        const responseData = favoritesResponse.data;
        let favoritesData = [];
        if (Array.isArray(responseData)) {
          favoritesData = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          favoritesData = responseData.data;
        } else if (responseData && Array.isArray(responseData.favorites)) {
          favoritesData = responseData.favorites;
        }
        favoritesCount = favoritesData.length;
      } catch (err) {
        favoritesCount = 0;
      }

      // Calculate stats from fetched data
      const newStats = {
        total_bookings: combinedBookings.length || 0,
        total_favorites: favoritesCount || propStats?.total_favorites || 0,
        total_spent: combinedBookings.reduce((sum, b) => sum + (parseFloat(b.total_price || b.price || 0)), 0) || 0,
        completed_bookings: combinedBookings.filter(b => b.status === 'completed').length || 0,
        cancelled_bookings: combinedBookings.filter(b => b.status === 'cancelled').length || 0
      };
      
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!err.message?.includes('404') && err.status !== 404 && !err.message?.includes('Endpoint not found')) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLocalLoading(false);
    }
  }, [propStats]);

  useEffect(() => {
    // Always fetch data on mount to get fresh stats
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 sm:p-8">
      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('profile_tab_title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('profile_tab_description')}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={localLoading}
          className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className={`w-4 h-4 ${localLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {localLoading ? t('profile_refreshing') : t('profile_refresh_data')}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <ProfileSection
        accountData={accountData}
        handleFieldChange={handleAccountFieldChange}
        formatProfileCompletion={formatProfileCompletion}
        profileCompletion={profileCompletion}
        onProfilePictureChange={onProfilePictureChange}
      />

      {/* Save Button */}
      <div className="mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          {t('profile_required_fields')}
        </p>
        <div className="flex flex-col items-end gap-3">
          {saveMessage && (
            <div
              className={`p-3 rounded-lg border text-sm font-medium ${
                saveMessage.includes('success')
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {saveMessage}
            </div>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('saving')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('save_changes')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

