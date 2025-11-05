'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, RefreshCw, Filter, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Users, Car, CheckCircle, Clock, XCircle, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminService } from '@/features/admin/services/adminService';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EarningsManagement({ bookings, listings, partners, loading: dataLoading }) {
  const { addToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today', 'week', 'month', 'year', 'all'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'pie'
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [usingBackendData, setUsingBackendData] = useState(false);

  // Ensure data is arrays
  const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
  const listingsList = Array.isArray(listings) ? listings : (listings?.results || listings?.data || []);
  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);

  // Fetch revenue analytics from backend
  useEffect(() => {
    const loadRevenueAnalytics = async () => {
      try {
        setLoadingRevenue(true);
        const response = await adminService.getRevenueAnalytics();
        const data = response?.data || response?.result || response;
        
        if (data && (data.monthlyRevenue || data.revenueTrend || data.chartData)) {
          setRevenueAnalytics(data);
          setUsingBackendData(true);
        } else {
          setRevenueAnalytics(null);
          setUsingBackendData(false);
        }
      } catch (error) {
        console.warn('Revenue analytics endpoint not available, using calculated data:', error);
        setRevenueAnalytics(null);
        setUsingBackendData(false);
      } finally {
        setLoadingRevenue(false);
      }
    };

    loadRevenueAnalytics();
  }, [periodFilter]);

  // Calculate earnings from bookings or use backend data
  const earningsData = useMemo(() => {
    // If backend data is available, use it
    if (revenueAnalytics && usingBackendData) {
      const backendData = revenueAnalytics;
      
      // Extract monthly revenue data
      let monthlyChartData = [];
      if (backendData.monthlyRevenue) {
        monthlyChartData = Array.isArray(backendData.monthlyRevenue) 
          ? backendData.monthlyRevenue.map(item => ({
              month: item.month || item.date || 'Unknown',
              revenue: parseFloat(item.revenue || item.total_revenue || 0),
              bookings: item.bookings || 0,
              date: item.date || item.month
            }))
          : [];
      } else if (backendData.revenueTrend) {
        monthlyChartData = Array.isArray(backendData.revenueTrend)
          ? backendData.revenueTrend.map(item => ({
              month: item.month || item.date || 'Unknown',
              revenue: parseFloat(item.revenue || 0),
              bookings: item.bookings || 0,
              date: item.date || item.month
            }))
          : [];
      } else if (backendData.chartData) {
        monthlyChartData = Array.isArray(backendData.chartData)
          ? backendData.chartData
          : [];
      }

      // Calculate totals from backend data
      const totalRevenue = parseFloat(backendData.totalRevenue || backendData.total_revenue || 0);
      const pendingRevenue = parseFloat(backendData.pendingRevenue || backendData.pending_revenue || 0);
      const cancelledRevenue = parseFloat(backendData.cancelledRevenue || backendData.cancelled_revenue || 0);
      const totalBookings = parseInt(backendData.totalBookings || backendData.total_bookings || 0);
      const completedBookings = parseInt(backendData.completedBookings || backendData.completed_bookings || 0);
      
      // Status breakdown from backend
      const statusBreakdown = backendData.statusBreakdown || backendData.status_breakdown || {
        completed: completedBookings,
        accepted: 0,
        pending: 0,
        cancelled: 0,
        rejected: 0,
      };

      // Top partners from backend
      const topPartners = backendData.topPartners || backendData.top_partners || [];

      // Revenue change from backend
      const revenueChange = parseFloat(backendData.revenueChange || backendData.revenue_change || 0);
      const previousPeriodRevenue = parseFloat(backendData.previousPeriodRevenue || backendData.previous_period_revenue || 0);

      const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      return {
        totalRevenue,
        pendingRevenue,
        cancelledRevenue,
        totalBookings,
        completedBookings,
        avgBookingValue,
        monthlyChartData: monthlyChartData.sort((a, b) => {
          // Sort by date
          const dateA = new Date(a.date || a.month);
          const dateB = new Date(b.date || b.month);
          return dateA - dateB;
        }).slice(-12), // Last 12 months
        statusBreakdown,
        topPartners,
        revenueChange,
        previousPeriodRevenue
      };
    }

    // Fallback to calculated data from bookings
    const now = new Date();
    let filteredBookings = bookingsList;

    // Filter by period
    if (periodFilter !== 'all') {
      filteredBookings = bookingsList.filter(booking => {
        const bookingDate = new Date(booking.requested_at || booking.created_at || booking.date);
        const diffTime = now - bookingDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (periodFilter) {
          case 'today':
            return diffDays < 1;
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

    // Filter only completed and accepted bookings for revenue
    const revenueBookings = filteredBookings.filter(b => 
      ['completed', 'accepted'].includes(b.status?.toLowerCase())
    );

    // Calculate totals
    const totalRevenue = revenueBookings.reduce((sum, b) => 
      sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0
    );

    const pendingRevenue = filteredBookings
      .filter(b => b.status?.toLowerCase() === 'pending')
      .reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0);

    const cancelledRevenue = filteredBookings
      .filter(b => b.status?.toLowerCase() === 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0);

    // Monthly breakdown
    const monthlyData = {};
    revenueBookings.forEach(booking => {
      const date = new Date(booking.requested_at || booking.created_at || booking.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          revenue: 0,
          bookings: 0,
          date: monthKey
        };
      }
      monthlyData[monthKey].revenue += parseFloat(booking.price || booking.total_price || booking.total_amount || 0);
      monthlyData[monthKey].bookings += 1;
    });

    const monthlyChartData = Object.values(monthlyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12); // Last 12 months

    // Status breakdown
    const statusBreakdown = {
      completed: filteredBookings.filter(b => b.status?.toLowerCase() === 'completed').length,
      accepted: filteredBookings.filter(b => b.status?.toLowerCase() === 'accepted').length,
      pending: filteredBookings.filter(b => b.status?.toLowerCase() === 'pending').length,
      cancelled: filteredBookings.filter(b => b.status?.toLowerCase() === 'cancelled').length,
      rejected: filteredBookings.filter(b => b.status?.toLowerCase() === 'rejected').length,
    };

    // Top earners (partners)
    const partnerEarnings = {};
    revenueBookings.forEach(booking => {
      const partnerId = booking.listing?.partner?.id || booking.listing?.partner || 'unknown';
      const partnerName = booking.listing?.partner?.user?.email || 
                         booking.listing?.partner?.company_name || 
                         `Partner #${partnerId}`;
      
      if (!partnerEarnings[partnerId]) {
        partnerEarnings[partnerId] = {
          id: partnerId,
          name: partnerName,
          revenue: 0,
          bookings: 0
        };
      }
      partnerEarnings[partnerId].revenue += parseFloat(booking.price || booking.total_price || booking.total_amount || 0);
      partnerEarnings[partnerId].bookings += 1;
    });

    const topPartners = Object.values(partnerEarnings)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Previous period comparison
    let previousPeriodRevenue = 0;
    if (periodFilter !== 'all') {
      const now = new Date();
      let startDate, endDate;
      
      switch (periodFilter) {
        case 'today':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(now);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 14);
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 2, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          previousPeriodRevenue = 0;
      }

      if (periodFilter !== 'all') {
        previousPeriodRevenue = bookingsList
          .filter(b => {
            const bookingDate = new Date(b.requested_at || b.created_at || b.date);
            return bookingDate >= startDate && bookingDate <= endDate && 
                   ['completed', 'accepted'].includes(b.status?.toLowerCase());
          })
          .reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || b.total_amount || 0)), 0);
      }
    }

    const revenueChange = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    const avgBookingValue = revenueBookings.length > 0 
      ? totalRevenue / revenueBookings.length 
      : 0;

    return {
      totalRevenue,
      pendingRevenue,
      cancelledRevenue,
      totalBookings: filteredBookings.length,
      completedBookings: revenueBookings.length,
      avgBookingValue,
      monthlyChartData,
      statusBreakdown,
      topPartners,
      revenueChange,
      previousPeriodRevenue
    };
  }, [bookingsList, periodFilter, revenueAnalytics, usingBackendData]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reload revenue analytics from backend
      const response = await adminService.getRevenueAnalytics();
      const data = response?.data || response?.result || response;
      
      if (data && (data.monthlyRevenue || data.revenueTrend || data.chartData)) {
        setRevenueAnalytics(data);
        setUsingBackendData(true);
        addToast('Revenue data refreshed!', 'success');
      } else {
        setRevenueAnalytics(null);
        setUsingBackendData(false);
        addToast('Using calculated data (backend analytics unavailable)', 'info');
      }
    } catch (error) {
      console.warn('Failed to refresh revenue analytics:', error);
      setRevenueAnalytics(null);
      setUsingBackendData(false);
      addToast('Using calculated data', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Period', 'Total Revenue', 'Pending Revenue', 'Completed Bookings', 'Average Booking Value', 'Data Source'].join(','),
        [
          periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1),
          formatCurrency(earningsData.totalRevenue),
          formatCurrency(earningsData.pendingRevenue),
          earningsData.completedBookings,
          formatCurrency(earningsData.avgBookingValue),
          usingBackendData ? 'Backend API' : 'Calculated'
        ].join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `earnings_export_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('Earnings exported successfully', 'success');
    } catch (error) {
      addToast(`Failed to export earnings: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const statusChartData = [
    { name: 'Completed', value: earningsData.statusBreakdown.completed, color: '#10B981' },
    { name: 'Accepted', value: earningsData.statusBreakdown.accepted, color: '#3B82F6' },
    { name: 'Pending', value: earningsData.statusBreakdown.pending, color: '#F59E0B' },
    { name: 'Cancelled', value: earningsData.statusBreakdown.cancelled, color: '#EF4444' },
    { name: 'Rejected', value: earningsData.statusBreakdown.rejected, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  if (dataLoading || loadingRevenue) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 mt-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Earnings & Analytics</h3>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${usingBackendData ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} 
                     title={usingBackendData ? 'Data from backend API' : 'Data calculated from bookings'}></div>
                <span className="text-xs text-gray-500">API: {apiUrl}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-600">
                Period: {periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)} | {earningsData.completedBookings} completed bookings
              </p>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <LinkIcon className="h-3 w-3" />
                <span>Data from: {usingBackendData ? 'Backend API' : 'Calculated from bookings'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loadingRevenue}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || loadingRevenue ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'year', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
            <div className="bg-white/20 rounded-lg p-2">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-2">
            {formatCurrency(earningsData.totalRevenue)}
          </p>
          <div className="flex items-center space-x-2">
            {earningsData.revenueChange !== 0 && (
              <>
                {earningsData.revenueChange > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <p className="text-blue-100 text-xs">
                  {earningsData.revenueChange > 0 ? '+' : ''}{earningsData.revenueChange.toFixed(1)}% vs previous period
                </p>
              </>
            )}
          </div>
          <p className="text-blue-100 text-xs mt-2">From {earningsData.completedBookings} bookings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-green-100 text-sm font-medium">Pending Revenue</p>
            <div className="bg-white/20 rounded-lg p-2">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(earningsData.pendingRevenue)}
          </p>
          <p className="text-green-100 text-xs mt-2">Awaiting confirmation</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-purple-100 text-sm font-medium">Average per Booking</p>
            <div className="bg-white/20 rounded-lg p-2">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(earningsData.avgBookingValue)}
          </p>
          <p className="text-purple-100 text-xs mt-2">Per transaction</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-orange-100 text-sm font-medium">Total Bookings</p>
            <div className="bg-white/20 rounded-lg p-2">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            {earningsData.totalBookings}
          </p>
          <p className="text-orange-100 text-xs mt-2">
            {earningsData.completedBookings} completed
          </p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-semibold text-gray-900">Revenue Trend</h4>
                {usingBackendData && (
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Data from backend API"></div>
                )}
              </div>
              <p className="text-sm text-gray-600">Monthly revenue over time</p>
              <p className="text-xs text-gray-500 mt-1">
                Source: {usingBackendData ? 'Backend API' : 'Calculated from bookings'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg ${chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {earningsData.monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={earningsData.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} name="Bookings" />
                </LineChart>
              ) : (
                <BarChart data={earningsData.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No revenue data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Booking Status</h4>
              <p className="text-sm text-gray-600">Distribution by status</p>
            </div>
          </div>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No booking data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Earners & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Top Earning Partners</h4>
          {earningsData.topPartners.length > 0 ? (
            <div className="space-y-4">
              {earningsData.topPartners.map((partner, index) => (
                <div key={partner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.bookings} booking{partner.bookings !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(partner.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No partner earnings data available</p>
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Completed & Accepted</p>
                  <p className="text-sm text-gray-600">{earningsData.completedBookings} bookings</p>
                </div>
              </div>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(earningsData.totalRevenue)}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Pending</p>
                  <p className="text-sm text-gray-600">Awaiting confirmation</p>
                </div>
              </div>
              <p className="text-xl font-bold text-yellow-700">
                {formatCurrency(earningsData.pendingRevenue)}
              </p>
            </div>
            {earningsData.cancelledRevenue > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Cancelled</p>
                    <p className="text-sm text-gray-600">Lost revenue</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(earningsData.cancelledRevenue)}
                </p>
              </div>
            )}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Total Potential</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.totalRevenue + earningsData.pendingRevenue + earningsData.cancelledRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

