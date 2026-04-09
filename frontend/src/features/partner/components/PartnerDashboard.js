'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerData } from '@/features/partner/hooks/usePartnerData';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from 'next-intl';
import PartnerStats from '@/features/partner/components/PartnerStats';
import VehiclesList from '@/features/partner/components/VehiclesList';
import BookingManagement from '@/features/partner/components/BookingManagement';
import ImprovedBookingManagement from '@/features/partner/components/ImprovedBookingManagement';
import EnhancedBookingManagement from '@/features/partner/components/EnhancedBookingManagement';
import NotificationCenter from '@/features/partner/components/NotificationCenter';
import PartnerProfileSettings from '@/features/partner/components/PartnerProfileSettings';
import AdvancedAnalytics from '@/features/partner/components/AdvancedAnalytics';
import PartnerEarnings from '@/features/partner/components/PartnerEarnings';
import VehicleAvailabilityCalendar from '@/features/partner/components/VehicleAvailabilityCalendar';
import AddVehicleModal from '@/components/forms/AddVehicleModal';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import { apiClient } from '@/lib/api/client';

function TelegramConnect() {
  const [status, setStatus] = useState(null); // null | { connected: bool, link: string }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/api/telegram/link/')
      .then(r => setStatus({ connected: r.data.connected, link: r.data.link }))
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/api/telegram/link/');
      setStatus({ connected: r.data.connected, link: r.data.link });
      window.open(r.data.link, '_blank');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await apiClient.delete('/api/telegram/link/');
      setStatus(prev => ({ ...prev, connected: false }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">✈️</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Telegram Notifications</h3>
          <p className="text-sm text-gray-500">Get booking updates instantly on Telegram</p>
        </div>
      </div>

      {status === null ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse w-32" />
      ) : status.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium">
            <span>✅</span> Connected to @AirbcarBot
          </div>
          <p className="text-xs text-gray-500">
            You receive new booking requests, confirmations, and reviews on Telegram.
          </p>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Connect your Telegram to receive real-time alerts for new bookings, cancellations, and reviews — and add cars directly from the bot.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#229ED9] hover:bg-[#1a8cc3] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.1 13.398l-2.95-.924c-.64-.203-.654-.64.136-.954l11.566-4.461c.537-.194 1.006.131.833.947l.209.215z"/>
            </svg>
            {loading ? 'Opening...' : 'Connect Telegram'}
          </button>
          <p className="text-xs text-gray-400">
            Opens @AirbcarBot — send <code>/start</code> to link your account.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PartnerDashboard() {
  const { user, loading } = useAuth();
  const t = useTranslations('partner');
  const [isPartner, setIsPartner] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingPendingRequests, setLoadingPendingRequests] = useState(false);
  const [loadingUpcomingBookings, setLoadingUpcomingBookings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const latestNotificationIdRef = useRef(null);
  const { addToast } = useToast();
  const router = useRouter();
  
  const {
    vehicles,
    bookings,
    partnerData,
    hasPartnerProfile,
    partnerError,
    stats,
    earnings,
    analytics,
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

  // Check partner status
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      checkPartnerStatus();
    }
  }, [user, loading, router]);

  // Fetch additional data when partner status is confirmed
  useEffect(() => {
    if (isPartner && hasPartnerProfile && !dataLoading) {
      fetchPendingRequests();
      fetchUpcomingBookings();
      fetchNotifications();
    }
  }, [isPartner, hasPartnerProfile, dataLoading]);
  
  // Set up polling for new notifications every 60 seconds
  useEffect(() => {
    if (isPartner) {
        const intervalId = setInterval(() => {
            fetchNotifications(true);
        }, 60000);
        
        return () => clearInterval(intervalId);
    }
  }, [isPartner]);

  const fetchNotifications = async (isPolling = false) => {
    try {
        const response = await apiClient.get('/notifications/');
        if (response.data) {
            // Sort by created_at desc (if backend doesn't already)
            // Backend endpoint: /notifications/ - returns filtered(user=self)
            const results = response.data.results || response.data || [];
            
            if (results.length > 0) {
                // Assuming results are sorted descending by ID or created_at
                const newestId = results[0].id;
                
                // If polling and we have a new ID that is strictly greater than our last known one
                if (isPolling && latestNotificationIdRef.current && newestId > latestNotificationIdRef.current) {
                    // Find all new notifications
                    const newItems = results.filter(n => n.id > latestNotificationIdRef.current);
                    newItems.forEach(item => {
                        addToast(item.title || "New Notification", 'info');
                    });
                }
                
                latestNotificationIdRef.current = newestId;
            }
            
            setNotifications(results); 
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read immediately
    if (!notification.is_read) {
        handleMarkNotificationRead(notification.id);
    }
    
    // Navigate logic
    if (notification.type === 'new_booking' || 
        notification.type === 'booking_accepted' || 
        notification.type === 'booking_rejected' ||
        notification.related_object_type === 'booking') {
        setCurrentView('bookings');
        // Ideally scroll to the booking or filter, but switching view is a good start
    } else if (notification.type === 'vehicle_issue' || 
               notification.related_object_type === 'listing' || 
               notification.related_object_type === 'vehicle') {
        setCurrentView('vehicles');
    } else if (notification.type === 'payment_received') {
        setCurrentView('analytics');
    }
  };

  const handleMarkNotificationRead = async (idOrEvent = null) => {
    try {
        // If it's an event object (from onClick) or null, treat as "mark all"
        // Checking for common event properties or if it's not a number/string ID
        const isEvent = idOrEvent && (typeof idOrEvent === 'object' && ('nativeEvent' in idOrEvent || 'preventDefault' in idOrEvent));
        const id = isEvent ? null : idOrEvent;

        if (id) {
            // Mark specific notification as read
            await apiClient.post(`/notifications/${id}/read/`);
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
        } else {
            // Mark all as read
            await apiClient.post('/notifications/read-all/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    } catch (error) {
        console.error('Error marking notifications read:', error);
    }
  };
  
  const handleClearAllNotifications = async () => {
     // Optional: If you want to delete them or just clear from local view
     // For now, let's assuming clearing view implies marking all read or simple state clear
     // Usually clearer to "Archive" or "Delete" but UI is "Clear all"
     // We'll mark all read for now as "soft clear" or implemented delete endpoint
     await handleMarkNotificationRead(); 
     setNotifications([]);
  };

  const checkPartnerStatus = async () => {
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
        const isUserPartner = userObj.is_partner === true || userObj.role === 'partner';
        
        setIsPartner(isUserPartner);
        
        if (!isUserPartner) {
          router.push('/');
        }
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
      router.push("/auth/signin");
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'calendar', label: 'Calendar', icon: '📆' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  const handleAddVehicle = () => {
    setShowAddVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicle, confirmed = false) => {
    const vehicleName = `${vehicle.brand || vehicle.make || 'Vehicle'} ${vehicle.model || ''}`.trim();
    const vehicleYear = vehicle.year ? ` (${vehicle.year})` : '';
    const fullVehicleName = `${vehicleName}${vehicleYear}`;
    
    // If not already confirmed (by specialized UI), ask for confirmation
    if (!confirmed && !window.confirm(
      `Delete "${fullVehicleName}"?\n\n` +
      `This will permanently remove the vehicle from your listings.\n` +
      `This action cannot be undone.`
    )) {
      return;
    }

    try {
      await deleteVehicle(vehicle.id);
      if (!confirmed) {
        alert(`✅ Vehicle "${fullVehicleName}" deleted successfully.`);
      }
      refetch();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete vehicle. Please try again.';
      if (!confirmed) {
        alert(`❌ Error: ${errorMessage}`);
      } else {
        throw error; // Let the caller (DIalog) handle the error UI
      }
    }
  };

  const handleViewVehicle = (vehicle) => {
    router.push(`/car/${vehicle.id}`);
  };

  const handleVehicleSubmit = async (vehicleData) => {
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, vehicleData);
      } else {
        await addVehicle(vehicleData);
      }
      setShowAddVehicleModal(false);
      setShowEditVehicleModal(false);
      setSelectedVehicle(null);
      refetch();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleBookingUpdate = () => {
    refetch();
  };

  const handleNotificationMarkAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClearAll = () => {
    setNotifications([]);
  };

  const handleProfileUpdate = async (profileData) => {
    try {
      // Import partnerService to update profile
      const { partnerService } = await import('@/features/partner/services/partnerService');
      if (hasPartnerProfile === false) {
        await partnerService.registerPartner(profileData);
      } else {
        await partnerService.updatePartnerProfile(profileData);
      }
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const fetchPendingRequests = async () => {
    try {
      if (!hasPartnerProfile) {
        setPendingRequests([]);
        return;
      }
      setLoadingPendingRequests(true);
      const requests = await getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoadingPendingRequests(false);
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      if (!hasPartnerProfile) {
        setUpcomingBookings([]);
        return;
      }
      setLoadingUpcomingBookings(true);
      const upcoming = await getUpcomingBookings();
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    } finally {
      setLoadingUpcomingBookings(false);
    }
  };

  const handleAcceptRequest = async (bookingId) => {
    try {
      await acceptBooking(bookingId);
      await fetchPendingRequests();
      await fetchUpcomingBookings();
      fetchNotifications(); // Refresh notifications
      refetch();
    } catch (error) {
      console.error('Error accepting booking:', error);
    }
  };

  const handleRejectRequest = async (bookingId, reason = '') => {
    try {
      await rejectBooking(bookingId, reason);
      await fetchPendingRequests();
      fetchNotifications(); // Refresh notifications
      refetch();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isPartner) {
    return null;
  }

  if (hasPartnerProfile === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-gray-900">{t('partner_profile_required')}</h1>
          <p className="mt-2 text-gray-600">
            {partnerError || t('no_partner_profile')}
          </p>
          <button
            onClick={() => setCurrentView('profile')}
            className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('complete_profile')}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your vehicles and bookings</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                refetch();
                fetchPendingRequests();
                fetchUpcomingBookings();
                fetchNotifications();
              }}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationRead}
              onClearAll={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <PartnerStats stats={stats} loading={dataLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pending Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {loadingPendingRequests ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending requests</p>
                  ) : (
                    pendingRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.listing?.make} {request.listing?.model}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.start_time).toLocaleDateString()} - {new Date(request.end_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 bg-green-500 text-white text-xs py-1 px-2 rounded hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Bookings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {upcomingBookings.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {loadingUpcomingBookings ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No upcoming bookings</p>
                  ) : (
                    upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.listing?.make} {booking.listing?.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer: {booking.user?.first_name} {booking.user?.last_name}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Vehicle Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status</h3>
                <div className="space-y-3">
                  {vehicles?.slice(0, 5).map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500">{vehicle.year}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        vehicle.availability === 'available' ? 'bg-green-100 text-green-800' :
                        vehicle.availability === 'rented' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.availability || 'available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <TelegramConnect />
            </div>
          </div>
        )}

        {currentView === 'vehicles' && (
          <VehiclesList 
            vehicles={vehicles} 
            loading={dataLoading}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onViewVehicle={handleViewVehicle}
            onRefresh={refetch}
          />
        )}

        {currentView === 'bookings' && (
          <EnhancedBookingManagement
            bookings={bookings}
            loading={dataLoading}
            onBookingUpdate={handleBookingUpdate}
            acceptBooking={acceptBooking}
            rejectBooking={rejectBooking}
            cancelBooking={cancelBooking}
            hasPartnerProfile={hasPartnerProfile}
            onAddVehicle={handleAddVehicle}
          />
        )}

        {currentView === 'calendar' && (
          <VehicleAvailabilityCalendar
            vehicles={vehicles}
            bookings={bookings}
          />
        )}

        {currentView === 'analytics' && (
          <AdvancedAnalytics
            analytics={analytics}
            stats={stats}
            bookings={bookings}
            vehicles={vehicles}
          />
        )}

        {currentView === 'earnings' && (
          <PartnerEarnings
            earnings={earnings}
            loading={dataLoading}
          />
        )}

        {currentView === 'profile' && (
          <div className="space-y-6">
            <PartnerProfileSettings
              partnerData={partnerData}
              hasPartnerProfile={hasPartnerProfile}
              onUpdate={handleProfileUpdate}
              loading={dataLoading}
            />
            <TelegramConnect />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddVehicleModal
        showModal={showAddVehicleModal || showEditVehicleModal}
        setShowModal={(show) => {
          setShowAddVehicleModal(show);
          setShowEditVehicleModal(show);
          if (!show) {
            setSelectedVehicle(null);
          }
        }}
        vehicleData={selectedVehicle || {}}
        setVehicleData={() => {}}
        onSubmit={handleVehicleSubmit}
      />

      <Footer />
    </div>
  );
}
