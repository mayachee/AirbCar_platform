'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Car, BarChart3, Target, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';
import { partnerService } from '@/features/partner/services/partnerService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';

const ChartTooltip = ({ active, payload, label, isCurrency = true, formatter }) => {
  if (!active || !payload?.length) return null;
  const fmt = formatter || ((v) => `${(Number(v) || 0).toLocaleString('fr-MA')} MAD`);
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {isCurrency ? fmt(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  rejected: '#6b7280',
};

export default function AdvancedAnalytics({ analytics: initialAnalytics, stats, bookings, vehicles }) {
  const t = useTranslations('partner_dashboard');
  const { formatPrice } = useCurrency();
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loadingRange, setLoadingRange] = useState(false);

  // Re-fetch when time range changes
  const handleRangeChange = useCallback(async (newRange) => {
    setTimeRange(newRange);
    setLoadingRange(true);
    try {
      const resp = await partnerService.getAnalytics(newRange);
      const data = resp?.data?.data || resp?.data || null;
      if (data) setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingRange(false);
    }
  }, []);

  // Also update if initialAnalytics changes
  useEffect(() => {
    if (initialAnalytics) setAnalytics(initialAnalytics);
  }, [initialAnalytics]);

  // Map data from enhanced backend
  const metrics = useMemo(() => analytics?.metrics || {}, [analytics]);
  const trends = useMemo(() => analytics?.trends || {}, [analytics]);

  const dailyData = useMemo(() => {
    const raw = analytics?.daily_data || [];
    return raw.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(d.revenue) || 0,
      bookings: d.bookings || 0,
    }));
  }, [analytics]);

  const statusDistribution = useMemo(() => {
    const raw = analytics?.status_distribution || [];
    return raw.map(s => ({
      name: s.status?.charAt(0).toUpperCase() + s.status?.slice(1),
      value: s.count || 0,
      percentage: s.percentage || 0,
      status: s.status,
      color: STATUS_COLORS[s.status] || '#6b7280',
    }));
  }, [analytics]);

  const vehiclePerformance = useMemo(() => {
    return analytics?.vehicle_performance || [];
  }, [analytics]);

  const reviewStats = useMemo(() => analytics?.reviews || {}, [analytics]);

  const timeRangeLabel = { '7d': t('last_7_days'), '30d': t('last_30_days'), '90d': t('last_90_days') }[timeRange] || t('last_30_days');

  const metricCards = [
    {
      title: t('total_revenue'),
      value: formatPrice(metrics.total_revenue),
      trend: trends.revenue,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: t('total_bookings'),
      value: metrics.total_bookings || 0,
      trend: trends.bookings,
      icon: BarChart3,
      color: 'blue',
    },
    {
      title: t('active_vehicles'),
      value: metrics.active_vehicles || vehicles?.filter(v => v.is_available)?.length || 0,
      trend: null,
      icon: Car,
      color: 'purple',
    },
    {
      title: t('conversion_rate'),
      value: `${metrics.conversion_rate || 0}%`,
      trend: null,
      icon: Target,
      color: 'yellow',
      subtitle: `${metrics.acceptance_rate || 0}% ${t('acceptance')}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('analytics')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{timeRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { value: '7d', label: '7D' },
            { value: '30d', label: '30D' },
            { value: '90d', label: '90D' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRangeChange(opt.value)}
              disabled={loadingRange}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeRange === opt.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          const colorMap = {
            green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
            blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
            yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
          };
          const c = colorMap[card.color];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border p-5 ${c.bg} ${c.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                {card.trend !== null && card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    card.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {card.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {Math.abs(card.trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('revenue_trend')}</h4>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.ceil(dailyData.length / 7)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<ChartTooltip formatter={formatPrice} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#analyticsRevenueGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">{t('no_revenue_data')}</div>
          )}
        </motion.div>

        {/* Bookings Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('bookings_trend')}</h4>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.ceil(dailyData.length / 7)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip isCurrency={false} />} />
                <Bar dataKey="bookings" name="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">{t('no_booking_data')}</div>
          )}
        </motion.div>
      </div>

      {/* Status Distribution & Vehicle Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t('booking_status')}</h4>
          {statusDistribution.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">{t('no_booking_data')}</div>
          )}
        </motion.div>

        {/* Top Performing Vehicles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t('top_performing_vehicles')}</h4>
          {vehiclePerformance.length > 0 ? (
            <div className="space-y-3">
              {vehiclePerformance.slice(0, 5).map((vehicle, i) => {
                const maxRev = vehiclePerformance[0]?.revenue || 1;
                const pct = Math.round((vehicle.revenue / maxRev) * 100);
                return (
                  <motion.div
                    key={vehicle.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.name}</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatPrice(vehicle.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {vehicle.bookings} bookings Â· {vehicle.utilization}% util.
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">{t('no_vehicle_performance_data')}</div>
          )}
        </motion.div>
      </div>

      {/* Review Stats + Avg Daily Rate */}
      {(reviewStats.count > 0 || metrics.avg_daily_rate > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {reviewStats.count > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('average_rating')}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{reviewStats.average_rating}</p>
                <span className="text-yellow-500 text-lg"></span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reviewStats.count} {t('reviews')}</p>
            </div>
          )}
          {metrics.avg_daily_rate > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('avg_daily_rate')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(metrics.avg_daily_rate)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('across_available_vehicles')}</p>
            </div>
          )}
          {metrics.acceptance_rate > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('acceptance_rate')}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.acceptance_rate}%</p>
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metrics.conversion_rate}% {t('conversion')}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
