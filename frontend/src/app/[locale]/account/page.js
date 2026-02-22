'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountPage } from './hooks';
import { formatProfileCompletion } from '@/features/user';
import {
  ProfileTab,
  SecurityTab,
  FavoritesTab,
} from './components';
import ImprovedBookingsTab from './components/ImprovedBookingsTab';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { User, Shield, Settings, Heart, Calendar, LogOut, Wallet, Award, Car } from 'lucide-react';

function AccountPageContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('account');

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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarItems = [
    { id: 'profile', labelKey: 'sidebar_profile', icon: User },
    { id: 'bookings', labelKey: 'sidebar_bookings', icon: Calendar },
    { id: 'favorites', labelKey: 'sidebar_favorites', icon: Heart },
    { id: 'security', labelKey: 'sidebar_security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans">
       {/* Abstract Background Pattern */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/10 to-orange-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        
        {/* Welcome Section */}
        <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
                {t('welcome_back', { name: user?.first_name || user?.username || 'User' })}
            </h1>
            <p className="text-slate-300 text-lg">{t('manage_account')}</p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
              saveMessage.includes('success')
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
             {saveMessage.includes('success') ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            <span className="font-medium">{saveMessage}</span>
          </div>
        )}

        {/* Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Navigation */}
            <aside className="lg:w-72 flex-shrink-0">
                <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 sticky top-24">
                    <nav className="space-y-2">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                        isActive 
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                                    {t(item.labelKey)}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="group relative bg-[#1E293B]/50 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-white/10 transition-all duration-500 hover:shadow-orange-500/10">
                    {/* Decorative Top Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
                    
                    {/* Ambient Background Glows */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom spring-like easing
                            className="h-full relative z-10"
                        >
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        
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
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
