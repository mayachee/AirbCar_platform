'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown,
  Clock, AlertCircle, CheckCircle, Calendar, Users, Car, 
  Activity, Star, Banknote, Handshake
} from 'lucide-react';
import AdminStats from './AdminStats';
import AdminCharts from './AdminCharts';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import AdminStatsSkeleton from './AdminStatsSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function DashboardOverview({ 
  stats, 
  chartData, 
  bookings, 
  users, 
  partners, 
  listings,
  loading,
  onRefresh,
  onQuickAction
}) {
  const { addToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Ensure data is arrays
  const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
  const usersList = Array.isArray(users) ? users : (users?.results || users?.data || []);
  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);
  const listingsList = Array.isArray(listings) ? listings : (listings?.results || listings?.data || []);

  // Calculate metrics — prefer backend stats, fallback to client-side
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    let filteredBookings = bookingsList;
    
    if (selectedPeriod !== 'all') {
      filteredBookings = bookingsList.filter(booking => {
        const bookingDate = new Date(booking.requested_at || booking.created_at || booking.date);
        const diffDays = (now - bookingDate) / (1000 * 60 * 60 * 24);
        switch (selectedPeriod) {
          case 'week': return diffDays < 7;
          case 'month': return diffDays < 30;
          case 'year': return diffDays < 365;
          default: return true;
        }
      });
    }

    const totalRevenue = stats?.totalEarnings || filteredBookings
      .filter(b => ['completed', 'accepted'].includes(b.status?.toLowerCase()))
      .reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0);
    
    const pendingBookings = stats?.pendingBookings ?? filteredBookings.filter(b => b.status?.toLowerCase() === 'pending').length;
    const activeBookings = stats?.activeBookings ?? filteredBookings.filter(b => ['accepted', 'confirmed', 'active'].includes(b.status?.toLowerCase())).length;
    const completedBookings = stats?.completedBookings ?? filteredBookings.filter(b => b.status?.toLowerCase() === 'completed').length;

    const statusBreakdown = stats?.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0
      ? stats.statusBreakdown
      : {
          pending: filteredBookings.filter(b => b.status?.toLowerCase() === 'pending').length,
          accepted: filteredBookings.filter(b => b.status?.toLowerCase() === 'accepted').length,
          confirmed: filteredBookings.filter(b => b.status?.toLowerCase() === 'confirmed').length,
          completed: filteredBookings.filter(b => b.status?.toLowerCase() === 'completed').length,
          cancelled: filteredBookings.filter(b => b.status?.toLowerCase() === 'cancelled').length,
          rejected: filteredBookings.filter(b => b.status?.toLowerCase() === 'rejected').length,
        };

    // Recent activity
    const recentBookings = bookingsList
      .sort((a, b) => new Date(b.requested_at || b.created_at || 0) - new Date(a.requested_at || a.created_at || 0))
      .slice(0, 20)
      .map(booking => ({
        id: booking.id,
        type: 'booking',
        action: `Booking ${booking.status === 'pending' ? 'requested' : booking.status}`,
        user: booking.user?.email || booking.user?.first_name || 'Client',
        time: new Date(booking.requested_at || booking.created_at || booking.date),
        status: ['accepted', 'completed', 'confirmed'].includes(booking.status) ? 'success' : 
                booking.status === 'pending' ? 'pending' : 
                ['cancelled', 'rejected'].includes(booking.status) ? 'error' : 'info',
      }));

    const recentUsers = usersList
      .sort((a, b) => new Date(b.date_joined || b.created_at || 0) - new Date(a.date_joined || a.created_at || 0))
      .slice(0, 10)
      .map(user => ({
        id: `u-${user.id}`,
        type: 'user',
        action: 'New user registered',
        user: user.email || user.username || 'Unknown',
        time: new Date(user.date_joined || user.created_at),
        status: 'success'
      }));

    const pendingPartners = partnersList.filter(p => p.verification_status === 'pending' || !p.is_verified);
    const recentPartners = pendingPartners
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
      .map(partner => ({
        id: `p-${partner.id}`,
        type: 'car',
        action: 'Partner verification pending',
        user: partner.user?.email || partner.company_name || 'Unknown',
        time: new Date(partner.created_at),
        status: 'pending',
      }));

    const allActivities = [...recentBookings, ...recentUsers, ...recentPartners]
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);

    const verifiedPartners = stats?.verifiedPartners ?? partnersList.filter(p => p.is_verified || p.verification_status === 'approved').length;
    const pendingPartnersCount = stats?.pendingPartnerApprovals ?? pendingPartners.length;
    const avgBookingValue = stats?.avgBookingValue || (completedBookings > 0 ? totalRevenue / completedBookings : 0);

    return {
      totalRevenue,
      monthlyRevenue: stats?.monthlyRevenue || 0,
      weeklyRevenue: stats?.weeklyRevenue || 0,
      pendingBookings,
      activeBookings,
      completedBookings,
      statusBreakdown,
      recentActivities: allActivities,
      verifiedPartners,
      pendingPartnersCount,
      avgBookingValue,
      revenueGrowth: stats?.revenueGrowth || 0,
      bookingsGrowth: stats?.bookingsGrowth || 0,
      usersGrowth: stats?.usersGrowth || 0,
      partnersGrowth: stats?.partnersGrowth || 0,
      availableListings: stats?.availableListings ?? listingsList.filter(l => l.availability !== false).length,
      reviews: stats?.reviews || { count: 0, avgRating: 0 },
      dailyBookings: stats?.dailyBookings || [],
    };
  }, [bookingsList, usersList, partnersList, listingsList, selectedPeriod, stats]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MAD';
  };

  const GrowthBadge = ({ value }) => {
    if (!value && value !== 0) return null;
    const isPositive = value >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
        isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      }`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  const statusChartData = [
    { name: 'Pending', value: dashboardMetrics.statusBreakdown.pending || 0, color: '#F59E0B' },
    { name: 'Confirmed', value: (dashboardMetrics.statusBreakdown.accepted || 0) + (dashboardMetrics.statusBreakdown.confirmed || 0), color: '#10B981' },
    { name: 'Active', value: dashboardMetrics.statusBreakdown.active || 0, color: '#06B6D4' },
    { name: 'Completed', value: dashboardMetrics.statusBreakdown.completed || 0, color: '#3B82F6' },
    { name: 'Cancelled', value: dashboardMetrics.statusBreakdown.cancelled || 0, color: '#EF4444' },
    { name: 'Rejected', value: dashboardMetrics.statusBreakdown.rejected || 0, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  const dailyChartData = useMemo(() => {
    if (!dashboardMetrics.dailyBookings?.length) return [];
    return dashboardMetrics.dailyBookings.map(d => ({
      date: new Date(d.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' }),
      bookings: d.bookings,
    }));
  }, [dashboardMetrics.dailyBookings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-96" /></div>
          <div><Skeleton className="h-96" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <AdminStats stats={stats} />
      
      {/* Revenue + Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
            <div className="bg-white/20 rounded-lg p-2"><Banknote className="h-5 w-5" /></div>
          </div>
          <p className="text-2xl font-bold mb-1">{formatCurrency(dashboardMetrics.totalRevenue)}</p>
          <div className="flex items-center justify-between">
            <p className="text-emerald-100 text-xs">{dashboardMetrics.completedBookings} completed</p>
            {dashboardMetrics.revenueGrowth !== 0 && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${dashboardMetrics.revenueGrowth >= 0 ? 'bg-white/20' : 'bg-red-400/30 text-red-100'}`}>
                {dashboardMetrics.revenueGrowth >= 0 ? '+' : ''}{dashboardMetrics.revenueGrowth}%
              </span>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-100 text-sm font-medium">Monthly Revenue</p>
            <div className="bg-white/20 rounded-lg p-2"><Calendar className="h-5 w-5" /></div>
          </div>
          <p className="text-2xl font-bold mb-1">{formatCurrency(dashboardMetrics.monthlyRevenue)}</p>
          <p className="text-blue-100 text-xs">This week: {formatCurrency(dashboardMetrics.weeklyRevenue)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-amber-100 text-sm font-medium">Pending Bookings</p>
            <div className="bg-white/20 rounded-lg p-2"><Clock className="h-5 w-5" /></div>
          </div>
          <p className="text-2xl font-bold mb-1">{dashboardMetrics.pendingBookings}</p>
          <p className="text-amber-100 text-xs">{dashboardMetrics.activeBookings} active now</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-violet-100 text-sm font-medium">Avg Booking Value</p>
            <div className="bg-white/20 rounded-lg p-2"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <p className="text-2xl font-bold mb-1">{formatCurrency(dashboardMetrics.avgBookingValue)}</p>
          <p className="text-violet-100 text-xs">Per transaction</p>
        </motion.div>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Period</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Filter activity data by time range</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year', 'all'].map((period) => (
              <button key={period} onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Bookings Trend */}
          {dailyChartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Booking Trends</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <GrowthBadge value={dashboardMetrics.bookingsGrowth} />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="adminBookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} labelStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} fill="url(#adminBookingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Main Charts */}
          <AdminCharts chartData={chartData} bookings={bookings} users={users} loading={loading} />
          
          {/* Status Donut */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Booking Status</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Current distribution</p>
              </div>
            </div>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusChartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Bookings']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-gray-500">
                <p>No booking data yet</p>
              </div>
            )}
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2"><AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending Partners</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardMetrics.pendingPartnersCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2"><Car className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Available Vehicles</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardMetrics.availableListings}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2"><Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Verified Partners</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardMetrics.verifiedPartners}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2"><Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {dashboardMetrics.reviews.count}
                    {dashboardMetrics.reviews.avgRating > 0 && (
                      <span className="text-sm font-normal text-gray-500 ml-1">({dashboardMetrics.reviews.avgRating}★)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RecentActivity activities={dashboardMetrics.recentActivities} />
          <QuickActions onAction={onQuickAction} />
        </div>
      </div>
    </div>
  );
}

