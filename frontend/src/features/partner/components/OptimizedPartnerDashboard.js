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
    earnings,
    analytics,
    reviews,
    activity,
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

          {/* Backend Connection Error Banner */}
          {!backendAvailable && (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Backend Server Not Running
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Unable to connect to the backend server at <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900/40 rounded text-xs">http://127.0.0.1:8000</code>
                    </p>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                      <p className="font-medium mb-1">To start the backend server:</p>
                      <div className="bg-red-100 dark:bg-red-900/40 rounded p-2 font-mono text-xs space-y-1">
                        <div><strong>Option 1 - Docker Compose:</strong></div>
                        <div className="pl-2">docker-compose up</div>
                        <div className="mt-2"><strong>Option 2 - Manual Django:</strong></div>
                        <div className="pl-2">cd backend/airbcar_backend</div>
                        <div className="pl-2">python manage.py runserver</div>
                      </div>
                      <button
                        onClick={() => {
                          refetch();
                          fetchPendingRequests();
                          fetchUpcomingBookings();
                        }}
                        className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <DashboardContent
              currentView={currentView}
              quickStats={quickStats}
              pendingRequests={pendingRequests}
              upcomingBookings={upcomingBookings}
              recentActivity={activity || []}
              vehicles={vehicles}
              bookings={bookings}
              partnerData={partnerData}
              stats={stats}
              earnings={earnings}
              analytics={analytics}
              reviews={reviews}
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
