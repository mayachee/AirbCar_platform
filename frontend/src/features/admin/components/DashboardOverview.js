'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  UserRound, Handshake, CarFront, Album, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, Clock, AlertCircle, CheckCircle, XCircle, Calendar, Users, Car, 
  Activity, Eye, Filter, RefreshCw
} from 'lucide-react';
import AdminStats from './AdminStats';
import AdminCharts from './AdminCharts';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import AdminStatsSkeleton from './AdminStatsSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

export default function DashboardOverview({ 
  stats, 
  chartData, 
  bookings, 
  users, 
  partners, 
  listings,
  loading,
  onRefresh
}) {
  const { addToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', 'year'

  // Ensure data is arrays
  const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
  const usersList = Array.isArray(users) ? users : (users?.results || users?.data || []);
  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);
  const listingsList = Array.isArray(listings) ? listings : (listings?.results || listings?.data || []);

  // Calculate additional metrics
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    let filteredBookings = bookingsList;
    
    // Filter by period
    if (selectedPeriod !== 'all') {
      filteredBookings = bookingsList.filter(booking => {
        const bookingDate = new Date(booking.requested_at || booking.created_at || booking.date);
        const diffTime = now - bookingDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch (selectedPeriod) {
          case 'week':
            return diffDays < 7;
          case 'month':
            return diffDays < 30;
          case 'year':
            return diffDays < 365;
          default:
            return true;
        }
      });
    }

    // Revenue calculations
    const completedBookings = filteredBookings.filter(b => 
      ['completed', 'accepted'].includes(b.status?.toLowerCase())
    );
    const totalRevenue = completedBookings.reduce((sum, b) => 
      sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0
    );
    
    const pendingBookings = filteredBookings.filter(b => b.status?.toLowerCase() === 'pending');
    const activeBookings = filteredBookings.filter(b => 
      ['accepted', 'confirmed'].includes(b.status?.toLowerCase())
    );

    // Status breakdown
    const statusBreakdown = {
      pending: filteredBookings.filter(b => b.status?.toLowerCase() === 'pending').length,
      accepted: filteredBookings.filter(b => b.status?.toLowerCase() === 'accepted').length,
      completed: filteredBookings.filter(b => b.status?.toLowerCase() === 'completed').length,
      cancelled: filteredBookings.filter(b => b.status?.toLowerCase() === 'cancelled').length,
      rejected: filteredBookings.filter(b => b.status?.toLowerCase() === 'rejected').length,
    };

    // Recent activity (last 20 bookings)
    const recentBookings = bookingsList
      .sort((a, b) => {
        const dateA = new Date(a.requested_at || a.created_at || a.date || 0);
        const dateB = new Date(b.requested_at || b.created_at || b.date || 0);
        return dateB - dateA;
      })
      .slice(0, 20)
      .map(booking => ({
        id: booking.id,
        type: 'booking',
        action: `Booking ${booking.status === 'pending' ? 'requested' : booking.status === 'accepted' ? 'accepted' : booking.status === 'completed' ? 'completed' : booking.status}`,
        user: booking.user?.email || booking.user?.first_name || 'Unknown',
        time: new Date(booking.requested_at || booking.created_at || booking.date),
        status: booking.status === 'pending' ? 'pending' : 
                booking.status === 'accepted' ? 'success' :
                booking.status === 'completed' ? 'success' : 'info',
        booking
      }));

    // Recent users
    const recentUsers = usersList
      .sort((a, b) => {
        const dateA = new Date(a.date_joined || a.created_at || 0);
        const dateB = new Date(b.date_joined || b.created_at || 0);
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(user => ({
        id: user.id,
        type: 'user',
        action: 'New user registered',
        user: user.email || user.username || 'Unknown',
        time: new Date(user.date_joined || user.created_at),
        status: 'success'
      }));

    // Recent partners (pending verification)
    const pendingPartners = partnersList.filter(p => 
      p.verification_status === 'pending' || !p.is_verified
    );
    const recentPartners = pendingPartners
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(partner => ({
        id: partner.id,
        type: 'car',
        action: 'Partner verification pending',
        user: partner.user?.email || partner.company_name || 'Unknown',
        time: new Date(partner.created_at),
        status: 'pending',
        partner
      }));

    // Combine and sort activities
    const allActivities = [...recentBookings, ...recentUsers, ...recentPartners]
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);

    // Partner stats
    const verifiedPartners = partnersList.filter(p => p.is_verified || p.verification_status === 'approved');
    const pendingPartnersCount = pendingPartners.length;

    return {
      totalRevenue,
      pendingBookings: pendingBookings.length,
      activeBookings: activeBookings.length,
      statusBreakdown,
      recentActivities: allActivities,
      verifiedPartners: verifiedPartners.length,
      pendingPartnersCount,
      recentBookingsCount: recentBookings.length,
      avgBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0
    };
  }, [bookingsList, usersList, partnersList, selectedPeriod]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const enhancedStats = useMemo(() => {
    return {
      ...stats,
      totalRevenue: dashboardMetrics.totalRevenue,
      pendingBookings: dashboardMetrics.pendingBookings,
      activeBookings: dashboardMetrics.activeBookings,
      verifiedPartners: dashboardMetrics.verifiedPartners,
      pendingPartners: dashboardMetrics.pendingPartnersCount
    };
  }, [stats, dashboardMetrics]);

  // Status breakdown chart data
  const statusChartData = [
    { name: 'Pending', value: dashboardMetrics.statusBreakdown.pending, color: '#F59E0B' },
    { name: 'Accepted', value: dashboardMetrics.statusBreakdown.accepted, color: '#10B981' },
    { name: 'Completed', value: dashboardMetrics.statusBreakdown.completed, color: '#3B82F6' },
    { name: 'Cancelled', value: dashboardMetrics.statusBreakdown.cancelled, color: '#EF4444' },
    { name: 'Rejected', value: dashboardMetrics.statusBreakdown.rejected, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats with Revenue */}
      <div>
        <AdminStats stats={enhancedStats} />
        
        {/* Additional Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
              <div className="bg-white/20 rounded-lg p-2">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(dashboardMetrics.totalRevenue)}
            </p>
            <p className="text-emerald-100 text-xs">
              {dashboardMetrics.statusBreakdown.completed + dashboardMetrics.statusBreakdown.accepted} completed bookings
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-yellow-100 text-sm font-medium">Pending Bookings</p>
              <div className="bg-white/20 rounded-lg p-2">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {dashboardMetrics.pendingBookings}
            </p>
            <p className="text-yellow-100 text-xs">Awaiting approval</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-teal-100 text-sm font-medium">Active Bookings</p>
              <div className="bg-white/20 rounded-lg p-2">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {dashboardMetrics.activeBookings}
            </p>
            <p className="text-teal-100 text-xs">Currently active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-pink-100 text-sm font-medium">Avg Booking Value</p>
              <div className="bg-white/20 rounded-lg p-2">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(dashboardMetrics.avgBookingValue)}
            </p>
            <p className="text-pink-100 text-xs">Per transaction</p>
          </motion.div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">View Period</h3>
            <p className="text-xs text-gray-600 mt-1">Filter metrics by time period</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year', 'all'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Charts */}
          <AdminCharts 
            chartData={chartData}
            bookings={bookings}
            users={users}
            loading={loading}
          />
          
          {/* Booking Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Booking Status Distribution</h3>
                <p className="text-sm text-gray-600">Current booking status breakdown</p>
              </div>
              <AlertCircle className="h-5 w-5 text-gray-400" />
            </div>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                <p>No booking data available</p>
              </div>
            )}
          </motion.div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Pending Approvals</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dashboardMetrics.pendingPartnersCount} Partners
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-100 rounded-lg p-2">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Available Vehicles</p>
                  <p className="text-lg font-bold text-gray-900">
                    {listingsList.filter(l => l.availability !== false).length} Active
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-purple-100 rounded-lg p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Verified Partners</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dashboardMetrics.verifiedPartners} Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <RecentActivity activities={dashboardMetrics.recentActivities} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={(action) => {
        console.log('Quick action:', action);
        addToast(`Quick action: ${action}`, 'info');
      }} />
    </div>
  );
}

