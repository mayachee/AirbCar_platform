'use client';

import { Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';

// Lazy load components
const PartnerStats = lazy(() => import('@/features/partner/components/PartnerStats'));
const VehiclesList = lazy(() => import('@/features/partner/components/VehiclesList'));
const BookingManagement = lazy(() => import('@/features/partner/components/BookingManagement'));
const ImprovedBookingManagement = lazy(() => import('@/features/partner/components/ImprovedBookingManagement'));
const AdvancedAnalytics = lazy(() => import('@/features/partner/components/AdvancedAnalytics'));
const VehicleAvailabilityCalendar = lazy(() => import('@/features/partner/components/VehicleAvailabilityCalendar'));
const CustomerReviewsManagement = lazy(() => import('@/features/partner/components/CustomerReviewsManagement'));
const PartnerProfileSettings = lazy(() => import('@/features/partner/components/PartnerProfileSettings'));
const BulkOperationsPanel = lazy(() => import('@/features/partner/components/BulkOperationsPanel'));
const EarningsOverview = lazy(() => import('@/features/partner/components/EarningsOverview'));
const VehiclePerformanceInsights = lazy(() => import('@/features/partner/components/VehiclePerformanceInsights'));
const RecentActivityFeed = lazy(() => import('@/features/partner/components/RecentActivityFeed'));
const RentalPolicies = lazy(() => import('@/features/partner/components/RentalPolicies'));

const ComponentLoader = ({ children, fallback = null }) => (
  <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>}>
    {children}
  </Suspense>
);

const QuickStatsCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

export default function DashboardContent({
  currentView,
  quickStats,
  pendingRequests,
  upcomingBookings,
  recentActivity,
  vehicles,
  bookings,
  partnerData,
  stats,
  dataLoading,
  processingBooking,
  handleAddVehicle,
  handleEditVehicle,
  handleDeleteVehicle,
  handleAcceptRequest,
  handleRejectRequest,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  refetch
}) {
  const router = useRouter();

  return (
    <div className="flex-1 p-6 overflow-auto">
      {currentView === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <QuickStatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending requests</p>
                ) : (
                  pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.listing?.make} {request.listing?.model}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.start_time).toLocaleDateString()} - {new Date(request.end_time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingBooking === request.id}
                          className={`flex-1 text-white text-xs py-1 px-2 rounded transition-colors ${
                            processingBooking === request.id 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {processingBooking === request.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingBooking === request.id}
                          className={`flex-1 text-white text-xs py-1 px-2 rounded transition-colors ${
                            processingBooking === request.id 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          {processingBooking === request.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full">
                  {upcomingBookings.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcomingBookings.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming bookings</p>
                ) : (
                  upcomingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {booking.listing?.make} {booking.listing?.model}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Customer: {booking.user?.first_name} {booking.user?.last_name}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <ComponentLoader>
                <RecentActivityFeed activities={recentActivity} />
              </ComponentLoader>
            </div>
          </div>

          {/* Additional Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComponentLoader>
              <VehiclePerformanceInsights vehicles={vehicles} />
            </ComponentLoader>
            
            <ComponentLoader>
              <EarningsOverview stats={stats} />
            </ComponentLoader>
          </div>
        </div>
      )}

      {currentView === 'vehicles' && (
        <ComponentLoader>
          <VehiclesList 
            vehicles={vehicles} 
            loading={dataLoading}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onViewVehicle={(vehicle) => router.push(`/car/${vehicle.id}`)}
            onRefresh={refetch}
          />
        </ComponentLoader>
      )}

      {currentView === 'bookings' && (
        <ComponentLoader>
          <ImprovedBookingManagement
            bookings={bookings}
            loading={dataLoading}
            onBookingUpdate={() => {
              refetch();
            }}
            acceptBooking={acceptBooking}
            rejectBooking={rejectBooking}
            cancelBooking={cancelBooking}
          />
        </ComponentLoader>
      )}

      {currentView === 'earnings' && (
        <ComponentLoader>
          <EarningsOverview stats={stats} detailed={true} />
        </ComponentLoader>
      )}

      {currentView === 'analytics' && (
        <ComponentLoader>
          <AdvancedAnalytics
            stats={stats}
            bookings={bookings}
            vehicles={vehicles}
          />
        </ComponentLoader>
      )}

      {currentView === 'calendar' && (
        <ComponentLoader>
          <VehicleAvailabilityCalendar
            vehicles={vehicles}
            bookings={bookings}
          />
        </ComponentLoader>
      )}

      {currentView === 'reviews' && (
        <ComponentLoader>
          <CustomerReviewsManagement vehicles={vehicles} />
        </ComponentLoader>
      )}

      {currentView === 'rental-policies' && (
        <ComponentLoader>
          <RentalPolicies
            partnerData={partnerData}
            onUpdate={async (policyData) => {
              try {
                // TODO: Implement API call to save policies
                console.log('Saving rental policies:', policyData);
                refetch();
              } catch (error) {
                console.error('Error saving rental policies:', error);
                throw error;
              }
            }}
          />
        </ComponentLoader>
      )}

      {currentView === 'profile' && (
        <ComponentLoader>
          <PartnerProfileSettings
            partnerData={partnerData}
            onUpdate={async (profileData) => {
              try {
                const { partnerService } = await import('@/features/partner/services/partnerService');
                await partnerService.updatePartnerProfile(profileData);
                refetch();
              } catch (error) {
                console.error('Error updating profile:', error);
                throw error;
              }
            }}
            loading={dataLoading}
          />
        </ComponentLoader>
      )}

      {currentView === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
          <ComponentLoader>
            <BulkOperationsPanel vehicles={vehicles} onRefresh={refetch} />
          </ComponentLoader>
        </div>
      )}
    </div>
  );
}
