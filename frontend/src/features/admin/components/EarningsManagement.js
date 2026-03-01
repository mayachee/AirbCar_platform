'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Calendar, Download, RefreshCw, BarChart3, Activity, Clock, CheckCircle, XCircle, Car, Users, Percent, Wallet } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { adminService } from '@/features/admin/services/adminService';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CHART_COLORS_DARK = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

export default function EarningsManagement({ bookings, listings, partners, loading: dataLoading }) {
  const { addToast } = useToast();
  const { formatPrice } = useCurrency();
  const [periodFilter, setPeriodFilter] = useState('month');
  const [chartType, setChartType] = useState('area');
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
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

  // Format currency using platform-wide currency context
  const formatCurrency = useCallback((amount) => {
    const num = parseFloat(amount) || 0;
    return formatPrice(num);
  }, [formatPrice]);

  const formatCurrencyFull = useCallback((amount) => {
    const num = parseFloat(amount) || 0;
    return formatPrice(num);
  }, [formatPrice]);

  // Fetch backend analytics
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoadingRevenue(true);
        const response = await adminService.getRevenueAnalytics?.();
        const data = response?.data || response?.result?.data || response?.result || response;
        if (data && typeof data === 'object') setRevenueAnalytics(data);
      } catch { /* Silently fall back to calculated data */ }
      finally { setLoadingRevenue(false); }
    };
    fetchRevenue();
  }, []);

  // Compute all earnings data
  const earningsData = useMemo(() => {
    const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
    const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);

    const now = new Date();
    let startDate;
    switch (periodFilter) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = null;
    }

    const filteredBookings = startDate
      ? bookingsList.filter(b => new Date(b.created_at || b.start_date) >= startDate)
      : bookingsList;

    // Revenue breakdown
    let totalRevenue = 0, pendingRevenue = 0, cancelledRevenue = 0, completedBookings = 0;
    filteredBookings.forEach(b => {
      const amount = parseFloat(b.total_price || b.total_amount || b.amount || 0);
      const status = (b.status || '').toLowerCase();
      if (['completed', 'confirmed', 'accepted', 'approved'].includes(status)) { totalRevenue += amount; completedBookings++; }
      else if (['pending', 'awaiting'].includes(status)) { pendingRevenue += amount; }
      else if (['cancelled', 'rejected', 'declined'].includes(status)) { cancelledRevenue += amount; }
      else { totalRevenue += amount; }
    });

    const totalBookings = filteredBookings.length;
    const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
    const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(0) : 0;

    // Status breakdown for pie
    const statusMap = {};
    filteredBookings.forEach(b => {
      const s = (b.status || 'unknown').toLowerCase();
      const name = ['completed', 'confirmed', 'accepted', 'approved'].includes(s) ? 'Completed'
        : ['pending', 'awaiting'].includes(s) ? 'Pending'
        : ['cancelled', 'rejected', 'declined'].includes(s) ? 'Cancelled' : 'Other';
      statusMap[name] = (statusMap[name] || 0) + 1;
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
        const p = partnersList.find(x => x.id === tp.id || x.user?.id === tp.id);
        return { ...tp, name: p ? (p.business_name || p.name || p.company_name || `Partner #${tp.id}`) : `Partner #${tp.id}`, logo_url: p?.logo_url || null };
      });

    // Previous period comparison
    let previousPeriodRevenue = 0;
    if (startDate) {
      const duration = now.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - duration);
      bookingsList.filter(b => { const d = new Date(b.created_at || b.start_date); return d >= prevStart && d < startDate; })
        .forEach(b => {
          const s = (b.status || '').toLowerCase();
          if (['completed', 'confirmed', 'accepted', 'approved'].includes(s))
            previousPeriodRevenue += parseFloat(b.total_price || b.total_amount || b.amount || 0);
        });
    }
    const revenueChange = previousPeriodRevenue > 0
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
      : totalRevenue > 0 ? 100 : 0;

    // Merge backend data if available
    const rev = revenueAnalytics;
    return {
      totalRevenue: rev?.total_revenue ?? totalRevenue,
      pendingRevenue: rev?.pending_revenue ?? pendingRevenue,
      cancelledRevenue: rev?.cancelled_revenue ?? cancelledRevenue,
      totalBookings: rev?.total_bookings ?? totalBookings,
      completedBookings: rev?.completed_bookings ?? completedBookings,
      avgBookingValue: rev?.avg_booking_value ?? avgBookingValue,
      completionRate: rev?.completion_rate ?? completionRate,
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
    } catch { addToast('Refresh failed', 'error'); }
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const { monthlyChartData, statusBreakdown, topPartners } = earningsData;
      let csv = 'EARNINGS REPORT\n\n';
      csv += `Period,${periodFilter}\nTotal Revenue (MAD),${earningsData.totalRevenue}\n`;
      csv += `Pending Revenue (MAD),${earningsData.pendingRevenue}\nTotal Bookings,${earningsData.totalBookings}\n`;
      csv += `Avg Per Booking (MAD),${Math.round(earningsData.avgBookingValue)}\n\n`;
      csv += 'MONTHLY TREND\nMonth,Revenue (MAD),Bookings\n';
      monthlyChartData.forEach(m => { csv += `${m.month},${m.revenue},${m.bookings}\n`; });
      csv += '\nSTATUS BREAKDOWN\nStatus,Count\n';
      statusBreakdown.forEach(s => { csv += `${s.name},${s.value}\n`; });
      csv += '\nTOP PARTNERS\nPartner,Revenue (MAD),Bookings\n';
      topPartners.forEach(p => { csv += `"${p.name}",${p.revenue},${p.bookings}\n`; });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `earnings_report_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Report exported', 'success');
    } catch { addToast('Export failed', 'error'); }
  };

  const isLoading = dataLoading || loadingRevenue;

  // Custom tooltip
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
              <Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time' };
  const revenueIsUp = parseFloat(earningsData.revenueChange) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings & Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue performance overview — {periodLabels[periodFilter]}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Period Filters */}
      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit flex-wrap">
        {Object.entries(periodLabels).map(([value, label]) => (
          <button key={value} onClick={() => setPeriodFilter(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              periodFilter === value
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-100">Total Revenue</p>
            <Wallet className="h-5 w-5 text-blue-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-2">
            {revenueIsUp
              ? <TrendingUp className="h-3.5 w-3.5 text-blue-200" />
              : <TrendingDown className="h-3.5 w-3.5 text-red-200" />}
            <span className="text-xs text-blue-100">{earningsData.revenueChange > 0 ? '+' : ''}{earningsData.revenueChange}% vs prev.</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-emerald-100">Pending</p>
            <Clock className="h-5 w-5 text-emerald-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.pendingRevenue)}</p>
          <p className="text-xs text-emerald-100 mt-2">Awaiting confirmation</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-100">Avg / Booking</p>
            <BarChart3 className="h-5 w-5 text-purple-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(earningsData.avgBookingValue)}</p>
          <p className="text-xs text-purple-100 mt-2">{earningsData.completedBookings} completed</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-100">Bookings</p>
            <Calendar className="h-5 w-5 text-orange-200" />
          </div>
          <p className="text-2xl font-bold">{earningsData.totalBookings}</p>
          <p className="text-xs text-orange-100 mt-2">{periodLabels[periodFilter]}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-cyan-100">Completion</p>
            <Percent className="h-5 w-5 text-cyan-200" />
          </div>
          <p className="text-2xl font-bold">{earningsData.completionRate}%</p>
          <p className="text-xs text-cyan-100 mt-2">{earningsData.completedBookings} of {earningsData.totalBookings}</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend — 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trend</h4>
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button onClick={() => setChartType('area')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'area' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Area chart"><Activity className="h-4 w-4" /></button>
              <button onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Bar chart"><BarChart3 className="h-4 w-4" /></button>
            </div>
          </div>

          {earningsData.monthlyChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-gray-500">
              <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No revenue data for {periodLabels[periodFilter].toLowerCase()}</p>
              <p className="text-xs mt-1">Try selecting a longer time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
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
            <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-gray-500">
              <Activity className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No booking data</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={earningsData.statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {earningsData.statusBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-5px' }}>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{earningsData.totalBookings}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {earningsData.statusBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({earningsData.totalBookings > 0 ? ((item.value / earningsData.totalBookings) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earning Partners */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Earning Partners</h4>

          {earningsData.topPartners.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No partner revenue data</p>
              <p className="text-xs mt-1">Revenue will appear once bookings are completed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earningsData.topPartners.map((partner, idx) => {
                const maxRevenue = earningsData.topPartners[0]?.revenue || 1;
                const barPercent = Math.max(5, (partner.revenue / maxRevenue) * 100);
                return (
                  <motion.div key={partner.id || idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {idx + 1}
                        </span>
                        {partner.logo_url && (
                          <img src={partner.logo_url} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{partner.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(partner.revenue)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">({partner.bookings})</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barPercent}%` }}
                        transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                        className="h-full rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
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
            {[
              { icon: CheckCircle, label: 'Confirmed Revenue', value: earningsData.totalRevenue, sub: `${earningsData.completedBookings} confirmed bookings`, colors: 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', subText: 'text-green-600 dark:text-green-500', iconColor: 'text-green-600 dark:text-green-400', labelColor: 'text-green-700 dark:text-green-400' },
              { icon: Clock, label: 'Pending Revenue', value: earningsData.pendingRevenue, sub: 'Awaiting confirmation', colors: 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', subText: 'text-yellow-600 dark:text-yellow-500', iconColor: 'text-yellow-600 dark:text-yellow-400', labelColor: 'text-yellow-700 dark:text-yellow-400' },
              { icon: XCircle, label: 'Cancelled', value: earningsData.cancelledRevenue, sub: 'Lost bookings', colors: 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', subText: 'text-red-600 dark:text-red-500', iconColor: 'text-red-600 dark:text-red-400', labelColor: 'text-red-700 dark:text-red-400' },
              { icon: Car, label: 'Avg / Booking', value: earningsData.avgBookingValue, sub: 'Per completed booking', colors: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', subText: 'text-blue-600 dark:text-blue-500', iconColor: 'text-blue-600 dark:text-blue-400', labelColor: 'text-blue-700 dark:text-blue-400' },
            ].map((card, i) => (
              <div key={i} className={`rounded-xl border ${card.colors} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                  <span className={`text-xs font-medium ${card.labelColor}`}>{card.label}</span>
                </div>
                <p className={`text-lg font-bold ${card.text}`}>{formatCurrency(card.value)}</p>
                <p className={`text-xs ${card.subText} mt-1`}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
