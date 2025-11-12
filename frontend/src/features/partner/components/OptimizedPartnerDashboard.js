'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useOptimizedDashboard } from '@/features/partner/hooks/useOptimizedDashboard';
import DashboardSidebar from '@/features/partner/components/DashboardSidebar';
import DashboardHeader from '@/features/partner/components/DashboardHeader';
import DashboardContent from '@/features/partner/components/DashboardContent';
import ToastNotification from '@/features/partner/components/ToastNotification';
import LoadingSkeleton from '@/features/partner/components/LoadingSkeleton';

// Lazy load modal
const AddVehicleModal = lazy(() => import('@/components/forms/AddVehicleModal'));

const ComponentLoader = ({ children, fallback = null }) => (
  <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>}>
    {children}
  </Suspense>
);

export default function OptimizedPartnerDashboard() {
  const {
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
    setSidebarCollapsed,
    theme,
    notifications,
    recentActivity,
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
    stats,
    dataLoading,
    
    // Computed
    navigationItems,
    quickStats,
    
    // Actions
    refetch,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    
    // Handlers
    handleAddVehicle,
    handleEditVehicle,
    handleDeleteVehicle,
    handleVehicleSubmit,
    handleAcceptRequest,
    handleRejectRequest,
    toggleSidebar,
    toggleTheme,
    handleMarkAsRead,
    handleClearAllNotifications,
    
    // Data fetching
    fetchPendingRequests,
    fetchUpcomingBookings
  } = useOptimizedDashboard();

  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);
      if (isMobile) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  // Early loading state
  if (loading || (!initialLoadComplete && user)) {
    return <LoadingSkeleton />;
  }

  if (!isPartner) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Mobile Sidebar */}
      {isMobileView && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
              sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={toggleSidebar}
          />
          <DashboardSidebar
            isMobile
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            navigationItems={navigationItems}
            currentView={currentView}
            setCurrentView={(view) => {
              setCurrentView(view);
              setSidebarCollapsed(true);
            }}
            isOnline={isOnline}
            backendAvailable={backendAvailable}
            onAddVehicle={handleAddVehicle}
            onRefreshData={() => {
              refetch();
              fetchPendingRequests();
              fetchUpcomingBookings();
            }}
          />
        </>
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            navigationItems={navigationItems}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isOnline={isOnline}
            backendAvailable={backendAvailable}
            onAddVehicle={handleAddVehicle}
            onRefreshData={() => {
              refetch();
              fetchPendingRequests();
              fetchUpcomingBookings();
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader
            navigationItems={navigationItems}
            currentView={currentView}
            partnerData={partnerData}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAllNotifications}
            onToggleSidebar={isMobileView ? toggleSidebar : undefined}
          />

          <div className="flex-1 overflow-hidden">
            <DashboardContent
              currentView={currentView}
              quickStats={quickStats}
              pendingRequests={pendingRequests}
              upcomingBookings={upcomingBookings}
              recentActivity={recentActivity}
              vehicles={vehicles}
              bookings={bookings}
              partnerData={partnerData}
              stats={stats}
              dataLoading={dataLoading}
              processingBooking={processingBooking}
              handleAddVehicle={handleAddVehicle}
              handleEditVehicle={handleEditVehicle}
              handleDeleteVehicle={handleDeleteVehicle}
              handleAcceptRequest={handleAcceptRequest}
              handleRejectRequest={handleRejectRequest}
              acceptBooking={acceptBooking}
              rejectBooking={rejectBooking}
              cancelBooking={cancelBooking}
              refetch={refetch}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ComponentLoader>
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
      </ComponentLoader>

      {/* Toast Notification */}
      <ToastNotification
        toastMessage={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
