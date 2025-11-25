'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerData } from '@/features/partner/hooks/usePartnerData';
import PartnerStats from '@/features/partner/components/PartnerStats';
import VehiclesList from '@/features/partner/components/VehiclesList';
import BookingManagement from '@/features/partner/components/BookingManagement';
import ImprovedBookingManagement from '@/features/partner/components/ImprovedBookingManagement';
import NotificationCenter from '@/features/partner/components/NotificationCenter';
import PartnerProfileSettings from '@/features/partner/components/PartnerProfileSettings';
import AdvancedAnalytics from '@/features/partner/components/AdvancedAnalytics';
import VehicleAvailabilityCalendar from '@/features/partner/components/VehicleAvailabilityCalendar';
import AddVehicleModal from '@/components/forms/AddVehicleModal';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PartnerDashboard() {
  const { user, loading } = useAuth();
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
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'new_booking',
      title: 'New Booking Request',
      message: 'John Doe wants to book your Toyota Camry',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 2,
      type: 'payment_received',
      title: 'Payment Received',
      message: '$150 payment received for booking #123',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    }
  ]);
  const router = useRouter();
  
  const {
    vehicles,
    bookings,
    partnerData,
    stats,
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
    if (isPartner && !dataLoading) {
      fetchPendingRequests();
      fetchUpcomingBookings();
    }
  }, [isPartner, dataLoading]);

  const checkPartnerStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch(`${apiUrl}/api/verify-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const isUserPartner = userData.is_partner === true || 
                             userData.role === 'partner' || 
                             userData.email?.includes('partner');
        
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
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  const handleAddVehicle = () => {
    setShowAddVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicle) => {
    const vehicleName = `${vehicle.brand || vehicle.make || 'Vehicle'} ${vehicle.model || ''}`.trim();
    const vehicleYear = vehicle.year ? ` (${vehicle.year})` : '';
    const fullVehicleName = `${vehicleName}${vehicleYear}`;
    
    const confirmMessage = `⚠️ Delete Vehicle Confirmation\n\n` +
      `Are you sure you want to delete "${fullVehicleName}"?\n\n` +
      `This action will:\n` +
      `• Permanently remove the vehicle from your listings\n` +
      `• Cancel any pending bookings for this vehicle\n` +
      `• Remove the vehicle from customer favorites\n` +
      `• This action cannot be undone\n\n` +
      `Type "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    
    if (userInput === 'DELETE') {
      try {
        await deleteVehicle(vehicle.id);
        alert(`✅ Vehicle "${fullVehicleName}" has been deleted successfully.`);
        refetch();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete vehicle. Please try again.';
        alert(`❌ Error: ${errorMessage}`);
      }
    } else if (userInput !== null) {
      // User typed something but not "DELETE"
      alert('⚠️ Deletion cancelled. You must type "DELETE" to confirm.');
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
      await partnerService.updatePartnerProfile(profileData);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const fetchPendingRequests = async () => {
    try {
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
      refetch();
    } catch (error) {
      console.error('Error accepting booking:', error);
    }
  };

  const handleRejectRequest = async (bookingId, reason = '') => {
    try {
      await rejectBooking(bookingId, reason);
      await fetchPendingRequests();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600">Manage your vehicles and bookings</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                refetch();
                fetchPendingRequests();
                fetchUpcomingBookings();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Refresh Data
            </button>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleNotificationMarkAsRead}
              onClearAll={handleNotificationClearAll}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
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
          <ImprovedBookingManagement
            bookings={bookings}
            loading={dataLoading}
            onBookingUpdate={handleBookingUpdate}
            acceptBooking={acceptBooking}
            rejectBooking={rejectBooking}
            cancelBooking={cancelBooking}
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
            stats={stats}
            bookings={bookings}
            vehicles={vehicles}
          />
        )}

        {currentView === 'profile' && (
          <PartnerProfileSettings
            partnerData={partnerData}
            onUpdate={handleProfileUpdate}
            loading={dataLoading}
          />
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
