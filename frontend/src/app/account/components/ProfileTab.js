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

      // Fetch user stats
      let userStats = null;
      try {
        const statsResponse = await apiClient.get('/users/me/stats/');
        userStats = statsResponse.data;
      } catch (err) {
        // Silently handle 404 - endpoint doesn't exist
        if (err.message?.includes('404') || err.status === 404) {
          console.log('Stats endpoint not available');
        } else {
          console.log('Error fetching stats:', err);
        }
      }

      // Fetch bookings
      let allBookings = [];
      try {
        const bookingsResponse = await apiClient.get('/bookings/');
        allBookings = bookingsResponse.data || [];
      } catch (err) {
        if (!err.message?.includes('404') && err.status !== 404) {
          console.error('Error fetching bookings:', err);
        }
      }

      // Fetch bookings from user-specific endpoint if available
      if (allBookings.length === 0) {
        try {
          const userBookingsResponse = await apiClient.get('/users/me/bookings/');
          allBookings = userBookingsResponse.data || [];
        } catch (err) {
          // Silently handle 404
        }
      }

      // Fetch bookings history
      let bookingHistory = [];
      try {
        const historyResponse = await apiClient.get('/users/me/bookings/history/');
        bookingHistory = historyResponse.data || [];
      } catch (err) {
        // Silently handle 404
      }

      // Combine bookings and history
      const combinedBookings = [...allBookings, ...bookingHistory];
      
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
        const favoritesData = favoritesResponse.data || [];
        favoritesCount = favoritesData.length;
      } catch (err) {
        // Silently handle 404
      }

      // Use fetched stats or calculate from bookings
      const newStats = userStats || {
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
    <div className="p-8">
      {/* Refresh Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={fetchData}
          disabled={localLoading}
          className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Section */}
      {(localLoading && !stats) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="space-y-6 mb-8">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-90">Total Bookings</p>
                <svg className="w-6 h-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_bookings || 0}</p>
              {stats.completed_bookings !== undefined && (
                <p className="text-xs opacity-75 mt-1">{stats.completed_bookings} completed</p>
              )}
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-90">Favorites</p>
                <svg className="w-6 h-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_favorites || 0}</p>
              <p className="text-xs opacity-75 mt-1">Cars saved</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-90">Total Spent</p>
                <svg className="w-6 h-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_spent ? `MAD ${Math.round(stats.total_spent).toLocaleString()}` : 'MAD 0'}</p>
              <p className="text-xs opacity-75 mt-1">All time</p>
            </div>
          </div>

          {/* Additional Stats Row */}
          {stats.completed_bookings !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Completed Rentals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed_bookings}</p>
                  </div>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.cancelled_bookings}</p>
                  </div>
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
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
      <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

