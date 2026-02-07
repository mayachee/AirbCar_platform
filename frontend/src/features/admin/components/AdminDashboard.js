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
import { useToast } from '@/contexts/ToastContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';
import { RefreshCw, Bell, X, Search, DollarSign, TrendingUp, Album, Calendar, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
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
  // const analyticsHook = useAnalytics(); // Commented out until backend endpoints are ready
  
  // Mock analytics data for now
  const analyticsHook = { 
    revenue: null, 
    loading: false, 
    analytics: null,
    stats: null
  };

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
        addToast('Add user feature coming soon', 'info');
        break;
      case 'add-listing':
        addToast('Add listing feature coming soon', 'info');
        break;
      case 'export-data':
        addToast('Export data feature coming soon', 'info');
        break;
      case 'generate-report':
        addToast('Generate report feature coming soon', 'info');
        break;
      case 'analytics':
        setCurrentView('earnings');
        addToast('Viewing analytics', 'success');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <AdminSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {currentView === 'dashboard' ? 'Dashboard Overview' : 
                   currentView === 'cars' ? 'Vehicle Information' :
                   currentView}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentView === 'dashboard' 
                    ? 'Monitor your platform activity and metrics'
                    : currentView === 'cars'
                    ? 'Manage vehicle information and listings'
                    : `Manage ${currentView} on your platform`
                  }
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      <div className="absolute right-0 top-12 z-50 w-96 max-h-[70vh] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900">Admin Notifications</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button onClick={() => markAllAsRead()} className="text-xs text-blue-600 hover:text-blue-800">
                                Mark all read
                              </button>
                            )}
                            <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-80 divide-y divide-gray-100">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm text-gray-500">No notifications</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const icon = n.type === 'success' || n.type === 'booking_accepted'
                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                : n.type === 'error' || n.type === 'booking_rejected'
                                ? <AlertCircle className="w-4 h-4 text-red-500" />
                                : n.type === 'new_booking'
                                ? <Clock className="w-4 h-4 text-blue-500" />
                                : n.type === 'warning'
                                ? <AlertCircle className="w-4 h-4 text-yellow-500" />
                                : <Info className="w-4 h-4 text-gray-400" />;
                              return (
                                <button
                                  key={n.id}
                                  onClick={() => { if (!n.is_read) markAsRead(n.id); setIsNotifOpen(false); }}
                                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                    !n.is_read ? 'bg-blue-50/50' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">{icon}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                                      <p className="text-[10px] text-gray-400 mt-1">
                                        {(() => { try { const d = Math.floor((Date.now() - new Date(n.created_at)) / 60000); return d < 1 ? 'Just now' : d < 60 ? d + 'm ago' : d < 1440 ? Math.floor(d/60) + 'h ago' : Math.floor(d/1440) + 'd ago'; } catch { return ''; } })()}
                                      </p>
                                    </div>
                                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
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
          <div className="p-4 sm:p-6 lg:p-8">

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
