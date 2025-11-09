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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and preferences</p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {saveMessage}
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
