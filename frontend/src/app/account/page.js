'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountPage } from './hooks';
import { formatProfileCompletion } from '@/features/user';
import {
  AccountTabs,
  ProfileTab,
  SecurityTab,
  PreferencesTab,
  FavoritesTab,
} from './components';
import ImprovedBookingsTab from './components/ImprovedBookingsTab';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

function AccountPageContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    accountData,
    activeTab,
    saving,
    saveMessage,
    emailVerified,
    stats,
    profileCompletion,
    favorites,
    favoritesLoading,
    bookingsLoading,
    upcomingBookings,
    pastBookings,
    setActiveTab,
    handleAccountFieldChange,
    handleSaveProfile,
    handleProfilePictureUpload,
    handleRemoveFavorite,
    handleBookNow,
    handleViewDetails,
    handleViewBookingDetails,
    handleCancelBooking,
    handleDeleteAccount,
    refreshVerificationStatus,
  } = useAccountPage();

  // Handle tab from query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'preferences', 'favorites', 'bookings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, setActiveTab]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header with User Info */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name || user?.username || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-2">Manage your profile, bookings, and preferences</p>
            </div>
            {profileCompletion !== undefined && (
              <div className="flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border p-4 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Complete</span>
                    <span className="text-sm font-semibold text-orange-600">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total_bookings || 0}</p>
                  </div>
                  <div className="bg-blue-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stats.completed_bookings || 0}</p>
                  </div>
                  <div className="bg-green-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Favorites</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{stats.total_favorites || 0}</p>
                  </div>
                  <div className="bg-purple-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Total Spent</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {stats.total_spent ? `${parseFloat(stats.total_spent).toFixed(0)} MAD` : '0 MAD'}
                    </p>
                  </div>
                  <div className="bg-orange-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              saveMessage.includes('success')
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveMessage.includes('success') ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{saveMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <AccountTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-sm border overflow-hidden">
          {activeTab === 'profile' && (
            <ProfileTab
              accountData={accountData}
              handleAccountFieldChange={handleAccountFieldChange}
              formatProfileCompletion={formatProfileCompletion}
              profileCompletion={profileCompletion}
              onProfilePictureChange={handleProfilePictureUpload}
              handleSaveProfile={handleSaveProfile}
              saving={saving}
              stats={stats}
              upcomingBookings={upcomingBookings}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              emailVerified={emailVerified}
              onRefreshVerification={refreshVerificationStatus}
              onDeleteAccount={() => handleDeleteAccount(logout)}
            />
          )}

          {activeTab === 'preferences' && <PreferencesTab />}

          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={favorites}
              loading={favoritesLoading}
              onRemoveFavorite={handleRemoveFavorite}
              onBookNow={handleBookNow}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'bookings' && <ImprovedBookingsTab />}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
