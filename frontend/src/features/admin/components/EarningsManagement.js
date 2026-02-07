'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, BarChart3, Activity, PieChart as PieIcon, Clock, CheckCircle, XCircle, AlertCircle, Car, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminService } from '@/features/admin/services/adminService';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CHART_COLORS_DARK = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

export default function EarningsManagement({ bookings, listings, partners, loading: dataLoading }) {
  const { addToast } = useToast();
  const [periodFilter, setPeriodFilter] = useState('month');
  const [chartType, setChartType] = useState('area');
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode for chart theming
  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartColors = isDarkMode ? CHART_COLORS_DARK : CHART_COLORS;
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#374151' : '#e5e7eb';
  const tooltipText = isDarkMode ? '#e5e7eb' : '#111827';

  // Format currency in MAD
  const formatCurrency = useCallback((amount) => {
    const num = parseFloat(amount) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M MAD`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K MAD`;
    return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
  }, []);

  const formatCurrencyFull = useCallback((amount) => {
    const num = parseFloat(amount) || 0;
    return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
  }, []);

  // Fetch revenue analytics from backend
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoadingRevenue(true);
        const response = await adminService.getRevenueAnalytics?.();
        const data = response?.data || response?.result?.data || response?.result || response;
        if (data && typeof data === 'object') {
          setRevenueAnalytics(data);
        }
      } catch {
        // Silently fall back to calculated data
      } finally {
        setLoadingRevenue(false);
      }
    };
    fetchRevenue();
  }, []);

  // Compute earnings data
  const earningsData = useMemo(() => {
    const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
    const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);

    const now = new Date();
    let startDate;
    switch (periodFilter) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = null;
    }

    const filteredBookings = startDate
      ? bookingsList.filter(b => new Date(b.created_at || b.start_date) >= startDate)
      : bookingsList;

    // Revenue by status
    let totalRevenue = 0, pendingRevenue = 0, cancelledRevenue = 0, completedBookings = 0;

    filteredBookings.forEach(b => {
      const amount = parseFloat(b.total_price || b.total_amount || b.amount || 0);
      const status = (b.status || '').toLowerCase();

      if (['completed', 'confirmed', 'accepted', 'approved'].includes(status)) {
        totalRevenue += amount;
        completedBookings++;
      } else if (['pending', 'awaiting'].includes(status)) {
        pendingRevenue += amount;
      } else if (['cancelled', 'rejected', 'declined'].includes(status)) {
        cancelledRevenue += amount;
      } else {
        totalRevenue += amount;
      }
    });

    const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    // Status breakdown
    const statusMap = {};
    filteredBookings.forEach(b => {
      const status = (b.status || 'unknown').toLowerCase();
      const normalized =
        ['completed', 'confirmed', 'accepted', 'approved'].includes(status) ? 'Completed' :
        ['pending', 'awaiting'].includes(status) ? 'Pending' :
        ['cancelled', 'rejected', 'declined'].includes(status) ? 'Cancelled' :
        'Other';
      statusMap[normalized] = (statusMap[normalized] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Monthly trend
    const monthlyMap = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.created_at || b.start_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyMap[key]) monthlyMap[key] = { month: label, revenue: 0, bookings: 0, key };
      monthlyMap[key].revenue += parseFloat(b.total_price || b.total_amount || b.amount || 0);
      monthlyMap[key].bookings += 1;
    });
    const monthlyChartData = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));

    // Top earning partners
    const partnerRevMap = {};
    filteredBookings.forEach(b => {
      const ownerId = b.owner_id || b.partner_id || b.listing?.owner_id;
      if (!ownerId) return;
      if (!partnerRevMap[ownerId]) partnerRevMap[ownerId] = { id: ownerId, revenue: 0, bookings: 0 };
      partnerRevMap[ownerId].revenue += parseFloat(b.total_price || b.total_amount || b.amount || 0);
      partnerRevMap[ownerId].bookings += 1;
    });
    const topPartners = Object.values(partnerRevMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(tp => {
        const partner = partnersList.find(p => p.id === tp.id || p.user?.id === tp.id);
        return {
          ...tp,
          name: partner ? (partner.business_name || partner.name || partner.company_name || `Partner #${tp.id}`) : `Partner #${tp.id}`,
          logo_url: partner?.logo_url || null,
        };
      });

    // Previous period comparison
    let previousPeriodRevenue = 0;
    if (startDate) {
      const duration = now.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - duration);
      const prevBookings = bookingsList.filter(b => {
        const d = new Date(b.created_at || b.start_date);
        return d >= prevStart && d < startDate;
      });
      prevBookings.forEach(b => {
        const s = (b.status || '').toLowerCase();
        if (['completed', 'confirmed', 'accepted', 'approved'].includes(s)) {
          previousPeriodRevenue += parseFloat(b.total_price || b.total_amount || b.amount || 0);
        }
      });
    }

    const revenueChange = previousPeriodRevenue > 0
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
      : totalRevenue > 0 ? 100 : 0;

    // Use backend data if available, else calculated
    const rev = revenueAnalytics;
    return {
      totalRevenue: rev?.total_revenue ?? totalRevenue,
      pendingRevenue: rev?.pending_revenue ?? pendingRevenue,
      cancelledRevenue: rev?.cancelled_revenue ?? cancelledRevenue,
      totalBookings: rev?.total_bookings ?? filteredBookings.length,
      completedBookings: rev?.completed_bookings ?? completedBookings,
      avgBookingValue: rev?.avg_booking_value ?? avgBookingValue,
      monthlyChartData: (rev?.monthly_data?.length > 0 ? rev.monthly_data : null) || monthlyChartData,
      statusBreakdown: (rev?.status_breakdown?.length > 0 ? rev.status_breakdown : null) || statusBreakdown,
      topPartners: (rev?.top_partners?.length > 0 ? rev.top_partners : null) || topPartners,
      revenueChange: rev?.revenue_change ?? revenueChange,
    };
  }, [bookings, partners, periodFilter, revenueAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await adminService.getRevenueAnalytics?.();
      const data = response?.data || response?.result?.data || response?.result || response;
      if (data && typeof data === 'object') setRevenueAnalytics(data);
      addToast('Earnings data refreshed', 'success');
    } catch {
      addToast('Refresh failed', 'error');
    }
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const { monthlyChartData, statusBreakdown, topPartners } = earningsData;
      let csv = 'EARNINGS REPORT\n\n';
      csv += `Period,${periodFilter}\n`;
      csv += `Total Revenue,${earningsData.totalRevenue} MAD\n`;
      csv += `Pending Revenue,${earningsData.pendingRevenue} MAD\n`;
      csv += `Total Bookings,${earningsData.totalBookings}\n`;
      csv += `Avg Per Booking,${Math.round(earningsData.avgBookingValue)} MAD\n\n`;

      csv += 'MONTHLY TREND\nMonth,Revenue (MAD),Bookings\n';
      monthlyChartData.forEach(m => { csv += `${m.month},${m.revenue},${m.bookings}\n`; });

      csv += '\nSTATUS BREAKDOWN\nStatus,Count\n';
      statusBreakdown.forEach(s => { csv += `${s.name},${s.value}\n`; });

      csv += '\nTOP PARTNERS\nPartner,Revenue (MAD),Bookings\n';
      topPartners.forEach(p => { csv += `"${p.name}",${p.revenue},${p.bookings}\n`; });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_report_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Report exported', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  const isLoading = dataLoading || loadingRevenue;

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg shadow-lg border px-3 py-2" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}>
        <p className="text-xs font-medium mb-1" style={{ color: tooltipText }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.name.toLowerCase().includes('revenue') ? formatCurrencyFull(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time',
  };

  const revenueIsUp = parseFloat(earningsData.revenueChange) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings & Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Period Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(periodLabels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setPeriodFilter(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              periodFilter === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-blue-100">Total Revenue</p>
            <DollarSign className="h-5 w-5 text-blue-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-2">
            {revenueIsUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-blue-200" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-200" />
            )}
            <span className="text-xs text-blue-100">
              {earningsData.revenueChange > 0 ? '+' : ''}{earningsData.revenueChange}% vs prev. period
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-emerald-100">Pending Revenue</p>
            <Clock className="h-5 w-5 text-emerald-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.pendingRevenue)}</p>
          <p className="text-xs text-emerald-100 mt-2">Awaiting confirmation</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-purple-100">Avg per Booking</p>
            <BarChart3 className="h-5 w-5 text-purple-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.avgBookingValue)}</p>
          <p className="text-xs text-purple-100 mt-2">{earningsData.completedBookings} completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-orange-100">Total Bookings</p>
            <Calendar className="h-5 w-5 text-orange-200" />
          </div>
          <p className="text-2xl font-bold">{earningsData.totalBookings}</p>
          <p className="text-xs text-orange-100 mt-2">{periodLabels[periodFilter]}</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart — spans 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trend</h4>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setChartType('area')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'area' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Area chart"
              >
                <Activity className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Bar chart"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {earningsData.monthlyChartData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No revenue data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              {chartType === 'area' ? (
                <AreaChart data={earningsData.monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={chartColors[0]} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={earningsData.monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Bookings" fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking Status Pie */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Booking Status</h4>

          {earningsData.statusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No booking data</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={earningsData.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {earningsData.statusBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {earningsData.statusBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Partners + Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earning Partners */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Earning Partners</h4>

          {earningsData.topPartners.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No partner revenue data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earningsData.topPartners.map((partner, idx) => {
                const maxRevenue = earningsData.topPartners[0]?.revenue || 1;
                const barPercent = Math.max(5, (partner.revenue / maxRevenue) * 100);

                return (
                  <motion.div
                    key={partner.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {idx + 1}
                        </span>
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
                        ) : null}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {partner.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(partner.revenue)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                          ({partner.bookings} bookings)
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPercent}%` }}
                        transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Breakdown Cards */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue Breakdown</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Confirmed Revenue</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatCurrency(earningsData.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                {earningsData.completedBookings} confirmed bookings
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Pending Revenue</span>
              </div>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {formatCurrency(earningsData.pendingRevenue)}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                Awaiting confirmation
              </p>
            </div>

            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Cancelled</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {formatCurrency(earningsData.cancelledRevenue)}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                Lost bookings
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Average Booking</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(earningsData.avgBookingValue)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Per completed booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
