'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Calendar, Users, Link as LinkIcon, 
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, 
  Download, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "#2563eb",
  },
  users: {
    label: "Users",
    color: "#10b981",
  },
  earnings: {
    label: "Earnings ($)",
    color: "#f59e0b",
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between space-x-4 mb-1">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{entry.name}:</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminCharts({ chartData, bookings, users, loading }) {
  const { addToast } = useToast();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('12'); // '6', '12', '24', 'all'
  const [bookingsChartType, setBookingsChartType] = useState('bar'); // 'bar', 'line', 'area'
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Ensure data is arrays
  const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);
  const usersList = Array.isArray(users) ? users : (users?.results || users?.data || []);

  // Try to fetch analytics from backend first
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const response = await adminService.getAnalytics();
        const data = response?.data || response?.result || response;
        
        if (data && (data.monthlyStats || data.chartData)) {
          setAnalyticsData(data);
        }
      } catch (error) {
        console.warn('Analytics endpoint not available, using calculated data:', error);
        setAnalyticsData(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, []);

  // Calculate monthly data from backend data with period filter
  const calculatedChartData = useMemo(() => {
    const now = new Date();
    let monthsToShow = 12;
    
    if (periodFilter === '6') monthsToShow = 6;
    else if (periodFilter === '12') monthsToShow = 12;
    else if (periodFilter === '24') monthsToShow = 24;
    else {
      // Calculate from earliest booking or user date
      const allDates = [
        ...bookingsList.map(b => new Date(b.requested_at || b.created_at || b.date).getTime()),
        ...usersList.map(u => new Date(u.date_joined || u.created_at || u.date).getTime())
      ].filter(t => !isNaN(t));
      
      if (allDates.length > 0) {
        const earliestDate = Math.min(...allDates);
        monthsToShow = Math.max(12, Math.ceil((now.getTime() - earliestDate) / (1000 * 60 * 60 * 24 * 30)));
      }
    }

    if (analyticsData?.monthlyStats) {
      // Use backend monthly stats if available
      let data = analyticsData.monthlyStats.map(stat => ({
        month: stat.month || stat.date || 'Unknown',
        monthFull: stat.month || stat.date || 'Unknown',
        bookings: stat.bookings || 0,
        users: stat.users || 0,
        revenue: stat.revenue || 0,
        date: stat.date || stat.month
      }));
      
      // Sort by date and take last N months
      data = data.sort((a, b) => new Date(a.date || a.monthFull) - new Date(b.date || b.monthFull));
      return data.slice(-monthsToShow);
    }

    if (analyticsData?.chartData) {
      // Use backend chart data if available
      return analyticsData.chartData.slice(-monthsToShow);
    }

    // Calculate from bookings and users data
    const monthsData = {};
    
    // Initialize last N months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
      monthsData[monthKey] = {
        month: monthShort,
        monthFull: monthKey,
        bookings: 0,
        users: 0,
        revenue: 0,
        fullMonth: monthKey,
        date: date
      };
    }

    // Process bookings
    bookingsList.forEach(booking => {
      const bookingDate = new Date(booking.requested_at || booking.created_at || booking.date);
      if (isNaN(bookingDate)) return;
      
      const monthKey = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthsData[monthKey]) {
        monthsData[monthKey].bookings += 1;
        const price = parseFloat(booking.price || booking.total_price || booking.total_amount || 0);
        if (['completed', 'accepted'].includes(booking.status?.toLowerCase())) {
          monthsData[monthKey].revenue += price;
        }
      }
    });

    // Process users
    usersList.forEach(user => {
      const userDate = new Date(user.date_joined || user.created_at || user.date);
      if (isNaN(userDate)) return;
      
      const monthKey = userDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthsData[monthKey]) {
        monthsData[monthKey].users += 1;
      }
    });

    return Object.values(monthsData).sort((a, b) => {
      return a.date - b.date;
    });
  }, [bookingsList, usersList, analyticsData, periodFilter]);

  // Use calculated data or fallback to provided chartData
  const displayChartData = calculatedChartData.length > 0 ? calculatedChartData : (chartData || []);

  // Calculate comprehensive statistics
  const bookingsStats = useMemo(() => {
    if (displayChartData.length === 0) return null;
    
    const bookingsValues = displayChartData.map(d => d.bookings || 0);
    const totalBookings = bookingsValues.reduce((sum, val) => sum + val, 0);
    const avgBookings = totalBookings / displayChartData.length;
    const maxBookings = Math.max(...bookingsValues);
    const minBookings = Math.min(...bookingsValues);
    const peakMonth = displayChartData.find(d => (d.bookings || 0) === maxBookings);
    
    // Month-over-month growth (last 2 months)
    let momGrowth = null;
    if (displayChartData.length >= 2) {
      const lastMonth = displayChartData[displayChartData.length - 1]?.bookings || 0;
      const prevMonth = displayChartData[displayChartData.length - 2]?.bookings || 0;
      if (prevMonth > 0) {
        momGrowth = ((lastMonth - prevMonth) / prevMonth) * 100;
      }
    }
    
    // Year-over-year growth (compare same month last year)
    let yoyGrowth = null;
    if (displayChartData.length >= 13) {
      const thisMonth = displayChartData[displayChartData.length - 1]?.bookings || 0;
      const lastYear = displayChartData[displayChartData.length - 13]?.bookings || 0;
      if (lastYear > 0) {
        yoyGrowth = ((thisMonth - lastYear) / lastYear) * 100;
      }
    }
    
    return {
      total: totalBookings,
      average: avgBookings,
      max: maxBookings,
      min: minBookings,
      peakMonth: peakMonth?.month || 'N/A',
      momGrowth,
      yoyGrowth
    };
  }, [displayChartData]);

  const usersStats = useMemo(() => {
    if (displayChartData.length === 0) return null;
    
    const usersValues = displayChartData.map(d => d.users || 0);
    const totalUsers = usersValues.reduce((sum, val) => sum + val, 0);
    const avgUsers = totalUsers / displayChartData.length;
    const maxUsers = Math.max(...usersValues);
    const minUsers = Math.min(...usersValues);
    const peakMonth = displayChartData.find(d => (d.users || 0) === maxUsers);
    
    // Month-over-month growth
    let momGrowth = null;
    if (displayChartData.length >= 2) {
      const lastMonth = displayChartData[displayChartData.length - 1]?.users || 0;
      const prevMonth = displayChartData[displayChartData.length - 2]?.users || 0;
      if (prevMonth > 0) {
        momGrowth = ((lastMonth - prevMonth) / prevMonth) * 100;
      }
    }
    
    // Year-over-year growth
    let yoyGrowth = null;
    if (displayChartData.length >= 13) {
      const thisMonth = displayChartData[displayChartData.length - 1]?.users || 0;
      const lastYear = displayChartData[displayChartData.length - 13]?.users || 0;
      if (lastYear > 0) {
        yoyGrowth = ((thisMonth - lastYear) / lastYear) * 100;
      }
    }
    
    // Calculate overall growth trend
    let overallGrowth = null;
    if (displayChartData.length >= 3) {
      const recent = displayChartData.slice(-3);
      const older = displayChartData.slice(0, 3);
      const recentAvg = recent.reduce((sum, item) => sum + (item.users || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, item) => sum + (item.users || 0), 0) / older.length;
      if (olderAvg > 0) {
        overallGrowth = ((recentAvg - olderAvg) / olderAvg) * 100;
      }
    }
    
    return {
      total: totalUsers,
      average: avgUsers,
      max: maxUsers,
      min: minUsers,
      peakMonth: peakMonth?.month || 'N/A',
      momGrowth,
      yoyGrowth,
      overallGrowth
    };
  }, [displayChartData]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['Month', 'Bookings', 'Users', 'Revenue'].join(','),
        ...displayChartData.map(d => 
          [
            d.monthFull || d.month,
            d.bookings || 0,
            d.users || 0,
            (d.revenue || 0).toFixed(2)
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addToast('Chart data exported successfully!', 'success');
    } catch (error) {
      addToast('Failed to export chart data', 'error');
    }
  };

  if (loading || loadingAnalytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const ChartWrapper = ({ children, title, icon: Icon, iconBg, stats }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {analyticsData && (
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Data from backend API"></div>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {stats?.total?.toLocaleString() || 0}</span>
            {stats?.momGrowth !== null && (
              <span className={`flex items-center space-x-1 ${stats.momGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.momGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>MoM: {stats.momGrowth >= 0 ? '+' : ''}{stats.momGrowth?.toFixed(1)}%</span>
              </span>
            )}
          </div>
        </div>
        <div className={`${iconBg} rounded-lg p-2`}>
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{stats.average?.toFixed(1)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peak</p>
            <p className="text-lg font-bold text-green-900 dark:text-green-300">{stats.max}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peak Month</p>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-300">{stats.peakMonth}</p>
          </div>
          {stats.yoyGrowth !== null && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">YoY Growth</p>
              <p className={`text-sm font-bold ${stats.yoyGrowth >= 0 ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                {stats.yoyGrowth >= 0 ? '+' : ''}{stats.yoyGrowth?.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-6 mb-8">
      {/* Period Filter and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center space-x-3">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
          <div className="flex space-x-2">
            {['6', '12', '24', 'all'].map(period => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {period === 'all' ? 'All Time' : `${period}M`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <ChartWrapper
          title="Monthly Bookings"
          icon={Calendar}
          iconBg="bg-blue-100"
          stats={bookingsStats}
        >
          {displayChartData.length > 0 ? (
            <div className="relative">
              {/* Chart Type Toggle */}
              <div className="absolute top-0 right-0 z-10 flex space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                <button
                  onClick={() => setBookingsChartType('bar')}
                  className={`p-1.5 rounded transition-colors ${
                    bookingsChartType === 'bar' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBookingsChartType('line')}
                  className={`p-1.5 rounded transition-colors ${
                    bookingsChartType === 'line' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Line Chart"
                >
                  <LineChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBookingsChartType('area')}
                  className={`p-1.5 rounded transition-colors ${
                    bookingsChartType === 'area' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Area Chart"
                >
                  <AreaChartIcon className="h-4 w-4" />
                </button>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                {bookingsChartType === 'bar' ? (
                  <BarChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'Bookings', angle: -90, position: 'insideLeft', fill: '#666' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={bookingsStats?.average || 0} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label={{ value: 'Avg', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                    />
                    <Bar 
                      dataKey="bookings" 
                      fill="#2563eb" 
                      radius={[8, 8, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                    <Legend 
                      content={() => (
                        <div className="flex justify-center items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</span>
                          </div>
                        </div>
                      )}
                    />
                  </BarChart>
                ) : bookingsChartType === 'line' ? (
                  <LineChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'Bookings', angle: -90, position: 'insideLeft', fill: '#666' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={bookingsStats?.average || 0} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label={{ value: 'Avg', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#888"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'Bookings', angle: -90, position: 'insideLeft', fill: '#666' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={bookingsStats?.average || 0} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label={{ value: 'Avg', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#colorBookings)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No booking data available</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Avg: {bookingsStats?.average?.toFixed(1) || 0} per month</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {periodFilter === 'all' ? 'All time' : `Last ${periodFilter} months`}
            </div>
          </div>
        </ChartWrapper>

        {/* Users Chart */}
        <ChartWrapper
          title="User Growth"
          icon={Users}
          iconBg="bg-green-100"
          stats={usersStats}
        >
          {displayChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  fontSize={12}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  stroke="#888"
                  fontSize={12}
                  tick={{ fill: '#666' }}
                  label={{ value: 'Users', angle: -90, position: 'insideLeft', fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={usersStats?.average || 0} 
                  stroke="#f59e0b" 
                  strokeDasharray="3 3"
                  label={{ value: 'Avg', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorUsers)"
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Legend 
                  content={() => (
                    <div className="flex justify-center items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
                      </div>
                    </div>
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No user data available</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {usersStats?.overallGrowth !== null ? (
                <>
                  {usersStats.overallGrowth > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${usersStats.overallGrowth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {usersStats.overallGrowth > 0 ? '+' : ''}{usersStats.overallGrowth?.toFixed(1)}% trend
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">Growing steadily</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {periodFilter === 'all' ? 'All time' : `Last ${periodFilter} months`}
            </div>
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}