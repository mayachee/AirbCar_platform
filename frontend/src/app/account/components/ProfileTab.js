'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  upcomingBookings: propUpcomingBookings = []
}) {
  const router = useRouter();
  const [stats, setStats] = useState(propStats || null);
  const [upcomingBookings, setUpcomingBookings] = useState(propUpcomingBookings || []);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

      const fetchData = useCallback(async () => {
    try {
      setLocalLoading(true);
      setError(null);

      // Fetch bookings
      let allBookings = [];
      try {
        // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
        const bookingsResponse = await apiClient.get('/bookings/', undefined, { timeout: 90000 });
        // Ensure allBookings is always an array
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

      // Ensure allBookings is always an array before spreading
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
        // Silently handle 404
        favoritesCount = 0;
      }

      // Use fetched stats or calculate from bookings
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
      // Only show error if it's not a 404 (missing endpoint)
      if (!err.message?.includes('404') && err.status !== 404 && !err.message?.includes('Endpoint not found')) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLocalLoading(false);
    }
  }, [propStats]);

  useEffect(() => {
    // Fetch data on mount if not provided
    if (!propStats || !propUpcomingBookings) {
      fetchData();
    }
  }, [propStats, propUpcomingBookings, fetchData]);

  return (
    <div className="p-6 sm:p-8">
      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-600 mt-1">Update your personal details and documents</p>
        </div>
        <button
          onClick={fetchData}
          disabled={localLoading}
          className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className={`w-4 h-4 ${localLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {localLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}


      {/* Upcoming Bookings Section */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Bookings
              </h3>
              <p className="text-sm text-gray-600 mt-1">You have {upcomingBookings.length} upcoming rental{upcomingBookings.length > 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => router.push('/account?tab=bookings')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => router.push(`/bookings/${booking.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {booking.vehicle?.pictures?.[0] ? (
                      <img
                        src={booking.vehicle.pictures[0]}
                        alt={booking.vehicle?.name || 'Car'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                          {booking.status}
                        </span>
                        <span className="text-sm font-semibold text-orange-600">
                          {booking.price} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
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
      <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          Make sure all required fields are filled before saving
        </p>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

