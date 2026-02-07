'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePartnerData } from '@/features/partner/hooks/usePartnerData';
import { 
  LayoutDashboard, Car, Calendar, DollarSign, BarChart3, 
  CalendarDays, Star, FileText, User, Settings 
} from 'lucide-react';

export function useOptimizedDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State management
  const [isPartner, setIsPartner] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh: refreshNotifications } = useNotifications();
  // Use activity from usePartnerData instead of separate state
  const [isOnline, setIsOnline] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [processingBooking, setProcessingBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const {
    vehicles,
    bookings,
    partnerData,
    hasPartnerProfile,
    partnerError,
    stats,
    earnings,
    analytics,
    reviews,
    activity,
    loading: dataLoading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    getPendingRequests,
    getUpcomingBookings,
    refetch
  } = usePartnerData();

  // Memoized navigation items
  const navigationItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, badge: null },
    { id: 'vehicles', label: 'Vehicles', icon: <Car className="h-5 w-5" />, badge: vehicles?.length || 0 },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-5 w-5" />, badge: bookings?.length || 0 },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="h-5 w-5" />, badge: null },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, badge: null },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-5 w-5" />, badge: null },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-5 w-5" />, badge: null },
    { id: 'rental-policies', label: 'Rental Policies', icon: <FileText className="h-5 w-5" />, badge: null },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" />, badge: null },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, badge: null }
  ], [vehicles?.length, bookings?.length]);

  // Memoized quick stats
  const quickStats = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        title: 'Total Vehicles',
        value: stats.totalVehicles || 0,
        icon: null, // Will be handled by QuickStatsCard component
        color: 'blue',
        change: stats.totalVehiclesChange || '+2 this month',
        changeType: 'positive'
      },
      {
        title: 'Active Bookings',
        value: stats.activeBookings || 0,
        icon: null,
        color: 'green',
        change: stats.activeBookingsChange || '+12% from last month',
        changeType: 'positive'
      },
      {
        title: 'Pending Requests',
        value: pendingRequests.length,
        icon: null,
        color: 'yellow',
        change: pendingRequests.length > 0 ? 'Needs attention' : 'All clear',
        changeType: pendingRequests.length > 0 ? 'neutral' : 'positive'
      },
      {
        title: 'Monthly Earnings',
        value: `$${stats.monthlyEarnings || 0}`,
        icon: null,
        color: 'purple',
        change: stats.monthlyEarningsChange || '+8% from last month',
        changeType: 'positive'
      }
    ];
  }, [stats, pendingRequests.length]);

  // Partner status check
  const checkPartnerStatus = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const cachedStatus = sessionStorage.getItem('partner_status');
      if (cachedStatus) {
        setIsPartner(JSON.parse(cachedStatus));
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
        const userObj = data.user || {}; // Safer extraction
        const isUserPartner = userObj.is_partner === true || 
                             userObj.role === 'partner' || 
                             userObj.email?.includes('partner');
        
        setIsPartner(isUserPartner);
        setBackendAvailable(true);
        sessionStorage.setItem('partner_status', JSON.stringify(isUserPartner));
        
        if (!isUserPartner) {
          router.push('/');
        }
      } else if (response.status === 0 || !response.ok) {
        console.warn('Backend not available, using mock mode');
        setBackendAvailable(false);
        setIsPartner(true);
        sessionStorage.setItem('partner_status', JSON.stringify(true));
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.warn('Backend not available, using mock mode:', error);
      setBackendAvailable(false);
      setIsPartner(true);
      sessionStorage.setItem('partner_status', JSON.stringify(true));
    }
  }, [router]);

  // Data fetching functions
  const fetchPendingRequests = useCallback(async () => {
    if (hasPartnerProfile === false) {
      setPendingRequests([])
      return
    }
    try {
      const requests = await getPendingRequests();
      // Ensure requests is always an array
      const requestsArray = Array.isArray(requests) ? requests : (requests?.data || requests?.results || []);
      setPendingRequests(requestsArray);
    } catch (error) {
      console.warn('Could not fetch pending requests, using mock data:', error);
      setPendingRequests([]);
    }
  }, [getPendingRequests, hasPartnerProfile]);

  const fetchUpcomingBookings = useCallback(async () => {
    if (hasPartnerProfile === false) {
      setUpcomingBookings([])
      return
    }
    try {
      const upcoming = await getUpcomingBookings();
      // Ensure upcoming is always an array
      const upcomingArray = Array.isArray(upcoming) ? upcoming : (upcoming?.data || upcoming?.results || []);
      setUpcomingBookings(upcomingArray);
    } catch (error) {
      console.warn('Could not fetch upcoming bookings, using mock data:', error);
      setUpcomingBookings([]);
    }
  }, [getUpcomingBookings, hasPartnerProfile]);

  // Toast notification system
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Event handlers
  const handleAddVehicle = useCallback(() => {
    if (hasPartnerProfile === false) {
      showToast('Please complete your partner profile before adding vehicles.', 'warning')
      setCurrentView('profile')
      return
    }
    setShowAddVehicleModal(true);
  }, [hasPartnerProfile, setCurrentView, showToast]);

  const handleEditVehicle = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditVehicleModal(true);
  }, []);

  const handleDeleteVehicle = useCallback(async (vehicle, skipConfirmation = false) => {
    const vehicleName = `${vehicle.brand || vehicle.make || 'Vehicle'} ${vehicle.model || ''}`.trim();
    const vehicleYear = vehicle.year ? ` (${vehicle.year})` : '';
    const fullVehicleName = `${vehicleName}${vehicleYear}`;
    
    // Show confirmation only if not skipped (for cases where confirmation is handled by the caller)
    let confirmed = true;
    if (!skipConfirmation) {
      confirmed = window.confirm(
        `Are you sure you want to delete "${fullVehicleName}"?\n\n` +
        `This will permanently remove the vehicle from your listings.\n` +
        `This action cannot be undone.`
      );
    }
    
    if (confirmed) {
      try {
        // Show loading state
        showToast(`Deleting "${fullVehicleName}"...`, 'info');
        await deleteVehicle(vehicle.id);
        showToast(`✅ Vehicle "${fullVehicleName}" deleted successfully.`, 'success');
        refetch();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete vehicle. Please try again.';
        showToast(`❌ Error: ${errorMessage}`, 'error');
        throw error; // Re-throw so caller can handle it
      }
    }
  }, [deleteVehicle, refetch, showToast]);

  const handleVehicleSubmit = useCallback(async (vehicleData) => {
    try {
      if (hasPartnerProfile === false) {
        showToast('Please complete your partner profile before adding vehicles.', 'warning')
        setShowAddVehicleModal(false)
        setShowEditVehicleModal(false)
        setSelectedVehicle(null)
        setCurrentView('profile')
        return
      }
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, vehicleData);
        showToast('Vehicle updated successfully!', 'success');
      } else {
        const result = await addVehicle(vehicleData);
        console.log('Vehicle added, result:', result);
        if (result && (result.id || (Array.isArray(result) && result.length > 0))) {
          showToast('Vehicle added successfully!', 'success');
        } else {
          console.warn('Vehicle added but result is invalid:', result);
          showToast('Vehicle may have been added, refreshing list...', 'warning');
        }
      }
      setShowAddVehicleModal(false);
      setShowEditVehicleModal(false);
      setSelectedVehicle(null);
      // Refetch to ensure we have the latest data from the server
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to save vehicle. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [hasPartnerProfile, selectedVehicle, updateVehicle, addVehicle, refetch, setCurrentView, showToast]);

  const handleAcceptRequest = useCallback(async (bookingId) => {
    if (processingBooking === bookingId) return;
    
    setProcessingBooking(bookingId);
    try {
      await acceptBooking(bookingId);
      await fetchPendingRequests();
      await fetchUpcomingBookings();
      refetch();
      showToast('Booking accepted successfully!', 'success');
    } catch (error) {
      console.error('Error accepting booking:', error);
      
      if (error.message.includes('conflicts with an existing booking')) {
        showToast('Cannot accept: Time slot conflicts with existing booking', 'error');
      } else if (error.message.includes('vehicle not available')) {
        showToast('Cannot accept: Vehicle not available for requested dates', 'error');
      } else {
        showToast('Error accepting booking: ' + error.message, 'error');
      }
    } finally {
      setProcessingBooking(null);
    }
  }, [acceptBooking, fetchPendingRequests, fetchUpcomingBookings, refetch, processingBooking, showToast]);

  const handleRejectRequest = useCallback(async (bookingId, reason = '') => {
    if (processingBooking === bookingId) return;
    
    setProcessingBooking(bookingId);
    try {
      await rejectBooking(bookingId, reason);
      await fetchPendingRequests();
      refetch();
      showToast('Booking rejected successfully!', 'success');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      showToast('Error rejecting booking: ' + error.message, 'error');
    } finally {
      setProcessingBooking(null);
    }
  }, [rejectBooking, fetchPendingRequests, refetch, processingBooking, showToast]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Notification handlers — delegate to NotificationContext
  const handleMarkAsRead = useCallback((id) => {
    if (id) {
      markAsRead(id);
    } else {
      // Called without ID means "mark all as read"
      markAllAsRead();
    }
  }, [markAsRead, markAllAsRead]);

  const handleClearAllNotifications = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Effects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResponsiveSidebar = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);
    return () => window.removeEventListener('resize', handleResponsiveSidebar);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user && !initialLoadComplete) {
      checkPartnerStatus();
      setInitialLoadComplete(true);
    }
  }, [user, loading, router, checkPartnerStatus, initialLoadComplete]);

  useEffect(() => {
    if (isPartner && !dataLoading && initialLoadComplete) {
      // Notifications are now handled by NotificationContext (global provider)
      // Activity is fetched from backend via usePartnerData
      
      Promise.allSettled([
        fetchPendingRequests(),
        fetchUpcomingBookings()
      ]).catch(error => {
        console.warn('Some data could not be loaded:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartner, dataLoading, initialLoadComplete]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return {
    // State
    user,
    loading,
    isPartner,
    currentView,
    setCurrentView,
    showAddVehicleModal,
    setShowAddVehicleModal,
    showEditVehicleModal,
    setShowEditVehicleModal,
    selectedVehicle,
    setSelectedVehicle,
    pendingRequests,
    upcomingBookings,
    sidebarCollapsed,
    theme,
    notifications,
    recentActivity: activity || [],
    earnings,
    analytics,
    reviews,
    isOnline,
    initialLoadComplete,
    backendAvailable,
    processingBooking,
    toastMessage,
    setToastMessage,
    
    // Data
    vehicles,
    bookings,
    partnerData,
    hasPartnerProfile,
    partnerError,
    stats,
    dataLoading,
    
    // Computed
    navigationItems,
    quickStats,
    
    // Actions
    addVehicle,
    updateVehicle,
    deleteVehicle,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    refetch,
    
    // Handlers
    handleAddVehicle,
    handleEditVehicle,
    handleDeleteVehicle,
    handleVehicleSubmit,
    handleAcceptRequest,
    handleRejectRequest,
    toggleSidebar,
    toggleTheme,
    showToast,
    handleMarkAsRead,
    handleClearAllNotifications,
    
    // Data fetching
    fetchPendingRequests,
    fetchUpcomingBookings,
    setSidebarCollapsed
  };
}
