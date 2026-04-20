'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('partner_dashboard');
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
    hasPartnerProfile,
    stats,
    earnings,
    analytics,
    reviews,
    dataLoading,
    
    // Computed
    navigationItems,
    quickStats,
    
    // Actions
    refetch,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    
    // Delete confirmation
    deleteConfirmation,
    confirmDeleteVehicle,
    cancelDeleteVehicle,

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('not_a_partner')}</p>
          <a href="/" className="text-blue-600 hover:underline">{t('go_home')}</a>
        </div>
      </div>
    );
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
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {t('connection_trouble')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      refetch();
                      fetchPendingRequests();
                      fetchUpcomingBookings();
                    }}
                    className="flex-shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    {t('retry_connection')}
                  </button>
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
              recentActivity={recentActivity || []}
              vehicles={vehicles}
              bookings={bookings}
              partnerData={partnerData}
              hasPartnerProfile={hasPartnerProfile}
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
              setCurrentView={setCurrentView}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation?.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('delete_vehicle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('confirm_delete_vehicle', {
                name: `${deleteConfirmation.vehicle?.make || ''} ${deleteConfirmation.vehicle?.model || ''}`.trim() || 'this vehicle'
              })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteVehicle}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDeleteVehicle}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        toastMessage={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
