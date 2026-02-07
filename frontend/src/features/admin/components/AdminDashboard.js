'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData, usePartners, useBookings, useListings, useUsers } from '@/features/admin';
import AdminStats from '@/features/admin/components/AdminStats';
import AdminCharts from '@/features/admin/components/AdminCharts';
import UsersTable from '@/features/admin/components/UsersTable';
import AdminBookingsManagement from '@/features/admin/components/AdminBookingsManagement';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import QuickActions from '@/features/admin/components/QuickActions';
import RecentActivity from '@/features/admin/components/RecentActivity';
import AdminStatsSkeleton from '@/features/admin/components/AdminStatsSkeleton';
import PartnersTable from '@/features/admin/components/PartnersTable';
import CarsTable from '@/features/admin/components/CarsTable';
import EarningsManagement from '@/features/admin/components/EarningsManagement';
import DashboardOverview from '@/features/admin/components/DashboardOverview';
import AdminReviewsManagement from '@/features/admin/components/AdminReviewsManagement';
import { AdminThemeProvider, useAdminTheme } from '@/features/admin/contexts/AdminThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';
import { RefreshCw, Bell, X, Sun, Moon, Menu, DollarSign, TrendingUp, Album, Calendar, CheckCircle, AlertCircle, Clock, Info, Star, MessageSquare, ShieldCheck, ShieldAlert, UserPlus } from 'lucide-react';

function AdminDashboardInner() {
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useAdminTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const {
    users,
    partners: partnersData,
    bookings: bookingsData,
    listings: listingsData,
    stats,
    chartData,
    loadingData,
    refetch
  } = useAdminData();

  // Use specific hooks for each section
  const usersHook = useUsers();
  const partnersHook = usePartners();
  const bookingsHook = useBookings();
  const listingsHook = useListings();

  // Check admin status and redirect if not admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, loading, router]);

  const checkAdminStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch(`${apiUrl}/api/verify-token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userObj = data.user || {};
        
        // Check if user is admin (staff or superuser) or has specific email
        const isUserAdmin = userObj.is_staff === true || 
                           userObj.is_superuser === true ||
                           userObj.is_admin === true ||
                           userObj.role === 'admin' ||
                           userObj.email === 'ayacheyassine2000@gmail.com';
        
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          router.push('/');
        }
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      // Handle "Failed to fetch" and other network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('Backend is unavailable. Allowing access for offline development.');
        // For development, allow access when backend is down
        // In production, you might want to redirect to signin
        setIsAdmin(true); // Temporarily allow access for offline development
        // router.push("/auth/signin"); // Uncomment this for production
      } else {
        console.error('Error checking admin status:', error);
        router.push("/auth/signin");
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addToast('Data refreshed successfully', 'success');
    } catch (error) {
      addToast('Failed to refresh data', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'add-user':
        setCurrentView('users');
        addToast('Navigated to Users management', 'success');
        break;
      case 'add-listing':
        setCurrentView('cars');
        addToast('Navigated to Vehicle listings', 'success');
        break;
      case 'export-data':
        addToast('Export feature coming soon', 'info');
        break;
      case 'generate-report':
        setCurrentView('earnings');
        addToast('Viewing Earnings report', 'success');
        break;
      case 'analytics':
        setCurrentView('earnings');
        addToast('Viewing Analytics', 'success');
        break;
      case 'settings':
        addToast('Settings feature coming soon', 'info');
        break;
      default:
        break;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      
      {/* Sidebar */}
      <AdminSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white capitalize truncate">
                  {currentView === 'dashboard' ? 'Dashboard Overview' : 
                   currentView === 'cars' ? 'Vehicle Information' :
                   currentView}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                  {currentView === 'dashboard' 
                    ? 'Monitor your platform activity and metrics'
                    : currentView === 'cars'
                    ? 'Manage vehicle information and listings'
                    : `Manage ${currentView} on your platform`
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                  >
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      <div className="fixed left-2 right-2 top-14 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                              <button onClick={() => markAllAsRead()} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                Read all
                              </button>
                            )}
                            <button onClick={() => setIsNotifOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] sm:max-h-80 divide-y divide-gray-100 dark:divide-gray-800">
                          {notifications.length === 0 ? (
                            <div className="py-12 px-6 text-center">
                              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <Bell className="w-7 h-7 text-gray-400" />
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
                              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">You're all caught up!</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const iconMap = {
                                'new_booking': <Clock className="w-5 h-5 text-blue-500" />,
                                'booking_confirmed': <CheckCircle className="w-5 h-5 text-green-500" />,
                                'booking_accepted': <CheckCircle className="w-5 h-5 text-green-500" />,
                                'booking_rejected': <AlertCircle className="w-5 h-5 text-red-500" />,
                                'booking_cancelled': <X className="w-5 h-5 text-red-500" />,
                                'new_review': <Star className="w-5 h-5 text-yellow-500" />,
                                'review_reply': <MessageSquare className="w-5 h-5 text-purple-500" />,
                                'partner_approved': <ShieldCheck className="w-5 h-5 text-green-500" />,
                                'partner_rejected': <ShieldAlert className="w-5 h-5 text-red-500" />,
                                'welcome': <UserPlus className="w-5 h-5 text-blue-500" />,
                                'success': <CheckCircle className="w-5 h-5 text-green-500" />,
                                'error': <AlertCircle className="w-5 h-5 text-red-500" />,
                                'warning': <AlertCircle className="w-5 h-5 text-yellow-500" />,
                              };
                              const icon = iconMap[n.type] || <Info className="w-5 h-5 text-gray-400" />;
                              const accentMap = {
                                'new_booking': 'border-l-blue-500',
                                'booking_confirmed': 'border-l-green-500',
                                'booking_accepted': 'border-l-green-500',
                                'booking_rejected': 'border-l-red-500',
                                'booking_cancelled': 'border-l-red-500',
                                'new_review': 'border-l-yellow-500',
                                'review_reply': 'border-l-purple-500',
                                'partner_approved': 'border-l-green-500',
                                'partner_rejected': 'border-l-red-500',
                                'welcome': 'border-l-blue-500',
                                'success': 'border-l-green-500',
                                'error': 'border-l-red-500',
                                'warning': 'border-l-yellow-500',
                              };
                              const accent = accentMap[n.type] || 'border-l-gray-400';

                              return (
                                <button
                                  key={n.id}
                                  onClick={() => { if (!n.is_read) markAsRead(n.id); setIsNotifOpen(false); }}
                                  className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 border-l-[3px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${accent} ${
                                    !n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">{icon}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        {(() => { try { const d = Math.floor((Date.now() - new Date(n.created_at)) / 60000); return d < 1 ? 'Just now' : d < 60 ? d + 'm ago' : d < 1440 ? Math.floor(d/60) + 'h ago' : Math.floor(d/1440) + 'd ago'; } catch { return ''; } })()}
                                      </p>
                                    </div>
                                    {!n.is_read && (
                                      <div className="flex-shrink-0 mt-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">

            {/* Dashboard Content */}
            {currentView === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardOverview
                  stats={stats}
                  chartData={chartData}
                  bookings={bookingsHook.bookings}
                  users={usersHook.users}
                  partners={partnersHook.partners}
                  listings={listingsHook.listings}
                  loading={loadingData || bookingsHook.loading || usersHook.loading || partnersHook.loading || listingsHook.loading}
                  onRefresh={handleRefresh}
                  onQuickAction={handleQuickAction}
                />
              </motion.div>
            )}

            {currentView === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <UsersTable
                  users={usersHook.users}
                  loading={usersHook.loading}
                  error={usersHook.error}
                  onRefresh={usersHook.refetch}
                />
              </motion.div>
            )}

            {currentView === 'partners' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PartnersTable
                  partners={Array.isArray(partnersHook.partners) ? partnersHook.partners : (partnersHook.partners?.results || partnersHook.partners?.data || [])}
                  loading={partnersHook.loading}
                  error={partnersHook.error}
                  onApprove={partnersHook.approvePartner}
                  onReject={partnersHook.rejectPartner}
                  onUnverify={partnersHook.unverifyPartner}
                  onRefresh={partnersHook.refetch}
                />
              </motion.div>
            )}

            {currentView === 'cars' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CarsTable
                  listings={Array.isArray(listingsHook.listings) ? listingsHook.listings : (listingsHook.listings?.results || listingsHook.listings?.data || [])}
                  loading={listingsHook.loading}
                  error={listingsHook.error}
                  onRefresh={listingsHook.refetch}
                />
              </motion.div>
            )}

            {currentView === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminBookingsManagement />
              </motion.div>
            )}

            {currentView === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminReviewsManagement />
              </motion.div>
            )}

            {currentView === 'earnings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EarningsManagement
                  bookings={bookingsHook.bookings}
                  listings={listingsHook.listings}
                  partners={partnersHook.partners}
                  loading={bookingsHook.loading || listingsHook.loading || partnersHook.loading}
                />
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminThemeProvider>
      <AdminDashboardInner />
    </AdminThemeProvider>
  );
}
