'use client';

import { useMemo } from 'react';
import { DollarSign, Calendar, Clock, TrendingUp, TrendingDown, CheckCircle, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('fr-MA')} MAD`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export default function EarningsOverview({ earnings, stats, detailed = false }) {
  const t = useTranslations('partner_dashboard');
  const earningsData = useMemo(() => ({
    totalEarnings: earnings?.total_earnings || earnings?.totalEarnings || 0,
    monthlyEarnings: earnings?.monthly_earnings || earnings?.monthlyEarnings || 0,
    weeklyEarnings: earnings?.weekly_earnings || earnings?.weeklyEarnings || 0,
    pendingEarnings: earnings?.pending_earnings || earnings?.pendingPayouts || 0,
    averagePerBooking: earnings?.average_per_booking || earnings?.averagePerBooking || 0,
    growthRate: earnings?.growth_rate || earnings?.growthRate || 0,
    totalBookings: earnings?.total_bookings || 0,
    dailyEarnings: earnings?.daily_earnings || [],
    vehicleEarnings: earnings?.vehicle_earnings || [],
    payoutHistory: earnings?.payout_history || [],
  }), [earnings]);

  const chartData = useMemo(() => {
    if (!earningsData.dailyEarnings.length) return [];
    return earningsData.dailyEarnings.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(d.revenue) || 0,
    }));
  }, [earningsData.dailyEarnings]);

  const growthPositive = earningsData.growthRate >= 0;

  const earningsCards = [
    {
      title: t('total_earnings'),
      value: formatCurrency(earningsData.totalEarnings),
      icon: DollarSign,
      color: 'green',
      change: `${growthPositive ? '+' : ''}${earningsData.growthRate}%`,
      changeType: growthPositive ? 'positive' : 'negative',
      subtitle: `${earningsData.totalBookings} ${earningsData.totalBookings === 1 ? 'booking' : 'bookings'}`
    },
    {
      title: t('this_month'),
      value: formatCurrency(earningsData.monthlyEarnings),
      icon: Calendar,
      color: 'blue',
      change: `${formatCurrency(earningsData.weeklyEarnings)} ${t('this_week')}`,
      changeType: 'neutral',
      subtitle: null
    },
    {
      title: t('pending_payouts'),
      value: formatCurrency(earningsData.pendingEarnings),
      icon: Clock,
      color: 'yellow',
      change: t('awaiting_completion'),
      changeType: 'neutral',
      subtitle: null
    },
    {
      title: t('avg_per_booking'),
      value: formatCurrency(earningsData.averagePerBooking),
      icon: TrendingUp,
      color: 'purple',
      change: `${earningsData.totalBookings} ${earningsData.totalBookings === 1 ? 'booking' : 'bookings'}`,
      changeType: 'neutral',
      subtitle: null
    }
  ];

  // ─── DETAILED VIEW (Earnings page) ──────────────────────────
  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('earnings_overview')}</h2>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${growthPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {growthPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(earningsData.growthRate)}% vs last month
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {earningsCards.map((card, index) => {
              const Icon = card.icon;
              const colorMap = {
                green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
                blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
                yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
                purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
              };
              const c = colorMap[card.color];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-xl border p-5 ${c.bg} ${c.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
                      <Icon className={`h-5 w-5 ${c.icon}`} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      card.changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      card.changeType === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Revenue Chart */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('daily_revenue_last_30_days')}</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.ceil(chartData.length / 8)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#earningsGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No earnings data yet</p>
                  <p className="text-xs mt-1">Complete bookings to see your revenue chart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Earnings + Payout History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Earning Vehicles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Earning Vehicles</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{earningsData.vehicleEarnings.length} vehicles</span>
            </div>
            {earningsData.vehicleEarnings.length > 0 ? (
              <div className="space-y-3">
                {earningsData.vehicleEarnings.map((vehicle, index) => {
                  const maxRevenue = earningsData.vehicleEarnings[0]?.revenue || 1;
                  const pct = Math.round((vehicle.revenue / maxRevenue) * 100);
                  return (
                    <motion.div
                      key={vehicle.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5">#{index + 1}</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.name}</p>
                        </div>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(vehicle.revenue)}
                        </p>
                      </div>
                      <div className="ml-7 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {vehicle.bookings} bookings
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p className="text-sm">No vehicle earnings data yet</p>
              </div>
            )}
          </div>

          {/* Payout History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Completed Bookings</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            {earningsData.payoutHistory.length > 0 ? (
              <div className="space-y-3">
                {earningsData.payoutHistory.map((payout, index) => (
                  <motion.div
                    key={payout.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {payout.vehicle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payout.customer} · {new Date(payout.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(payout.amount)}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p className="text-sm">No completed bookings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── COMPACT VIEW (Dashboard home) ──────────────────────────
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Overview</h3>
        <div className={`flex items-center gap-1 text-xs font-medium ${growthPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {growthPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(earningsData.growthRate)}%
        </div>
      </div>

      {/* Mini chart */}
      {chartData.length > 0 && (
        <div className="mb-4 -mx-2">
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="miniEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#miniEarningsGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Total Earnings</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(earningsData.totalEarnings)}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">This Month</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(earningsData.monthlyEarnings)}</p>
        </div>
      </div>
    </div>
  );
}
