'use client';

import { Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, Calendar, TrendingUp, ArrowUpRight, Car, DollarSign } from 'lucide-react';

// Lazy load components
const PartnerStats = lazy(() => import('@/features/partner/components/PartnerStats'));
const VehiclesList = lazy(() => import('@/features/partner/components/VehiclesList'));
const BookingManagement = lazy(() => import('@/features/partner/components/BookingManagement'));
const ImprovedBookingManagement = lazy(() => import('@/features/partner/components/ImprovedBookingManagement'));
const AdvancedAnalytics = lazy(() => import('@/features/partner/components/AdvancedAnalytics'));
const VehicleAvailabilityCalendar = lazy(() => import('@/features/partner/components/VehicleAvailabilityCalendar'));
const CustomerReviewsManagement = lazy(() => import('@/features/partner/components/CustomerReviewsManagement'));
const ReviewAnalytics = lazy(() => import('@/features/partner/components/ReviewAnalytics'));
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

const QuickStatsCard = ({ title, value, icon, color = 'blue', change, changeType = 'neutral' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  const IconComponent = icon || (title === 'Total Vehicles' ? Car : 
                                 title === 'Active Bookings' ? Calendar :
                                 title === 'Pending Requests' ? Clock :
                                 DollarSign);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-xl border-2 p-5 ${colorClasses[color]} transition-all duration-200 shadow-sm hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 ${iconColorClasses[color]}`}>
          {icon ? (
            typeof icon === 'string' ? (
              <span className="text-2xl">{icon}</span>
            ) : (
              icon
            )
          ) : (
            <IconComponent className={`h-6 w-6 ${iconColorClasses[color]}`} />
          )}
        </div>
        {change && (
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            changeType === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </motion.div>
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
                </div>
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending requests</p>
                ) : (
                  pendingRequests.slice(0, 3).map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {request.listing?.make} {request.listing?.model}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(request.start_time).toLocaleDateString()} - {new Date(request.end_time).toLocaleDateString()}
                          </p>
                          {request.user && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              Customer: {request.user.first_name} {request.user.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingBooking === request.id}
                          className={`flex-1 text-white text-xs font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                            processingBooking === request.id 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-green-500 hover:bg-green-600 shadow-sm hover:shadow'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{processingBooking === request.id ? 'Processing...' : 'Accept'}</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingBooking === request.id}
                          className={`flex-1 text-white text-xs font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                            processingBooking === request.id 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow'
                          }`}
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>{processingBooking === request.id ? 'Processing...' : 'Reject'}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {upcomingBookings.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
                  </div>
                ) : (
                  upcomingBookings.slice(0, 3).map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {booking.listing?.make} {booking.listing?.model}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                          </p>
                          {booking.user && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Customer: {booking.user.first_name} {booking.user.last_name}
                            </p>
                          )}
                          {booking.price && (
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">
                              ${parseFloat(booking.price || booking.total_price || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className={`p-2 rounded-lg ${
                          booking.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30' :
                          booking.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <CheckCircle2 className={`h-4 w-4 ${
                            booking.status === 'accepted' ? 'text-green-600 dark:text-green-400' :
                            booking.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <ComponentLoader>
                <RecentActivityFeed activities={recentActivity} />
              </ComponentLoader>
            </motion.div>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComponentLoader>
                <CustomerReviewsManagement vehicles={vehicles} />
              </ComponentLoader>
            </div>
            <div className="lg:col-span-1">
              <ComponentLoader>
                <ReviewAnalytics />
              </ComponentLoader>
            </div>
          </div>
        </div>
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
