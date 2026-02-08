'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Clock, Car,
  RefreshCw, Download, BarChart3, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { partnerService } from '@/features/partner/services/partnerService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const formatCurrency = (v) => {
  const num = parseFloat(v) || 0;
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
};

const formatCurrencyCompact = (v) => {
  const num = parseFloat(v) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M MAD`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K MAD`;
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
};

const ChartTooltip = ({ active, payload, label, isCurrency = true }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {isCurrency ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function PartnerEarnings({ earnings: initialEarnings, loading: parentLoading }) {
  const [earnings, setEarnings] = useState(initialEarnings);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('area');

  // Sync with parent prop
  useEffect(() => {
    if (initialEarnings) setEarnings(initialEarnings);
  }, [initialEarnings]);

  // Fetch on mount if no initial data
  useEffect(() => {
    if (!earnings && !parentLoading) {
      handleRefresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await partnerService.getEarnings();
      const data = resp?.data?.data || resp?.data || resp;
      if (data && typeof data === 'object') setEarnings(data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Parse data
  const totalEarnings = parseFloat(earnings?.total_earnings) || 0;
  const monthlyEarnings = parseFloat(earnings?.monthly_earnings) || 0;
  const weeklyEarnings = parseFloat(earnings?.weekly_earnings) || 0;
  const pendingEarnings = parseFloat(earnings?.pending_earnings) || 0;
  const avgPerBooking = parseFloat(earnings?.average_per_booking) || 0;
  const growthRate = parseFloat(earnings?.growth_rate) || 0;
  const totalBookings = earnings?.total_bookings || 0;

  const dailyEarnings = useMemo(() => {
    const raw = earnings?.daily_earnings || [];
    return raw.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(d.revenue) || 0,
      bookings: d.bookings || 0,
    }));
  }, [earnings]);

  const vehicleEarnings = useMemo(() => earnings?.vehicle_earnings || [], [earnings]);
  const payoutHistory = useMemo(() => earnings?.payout_history || [], [earnings]);

  const isLoading = loading || parentLoading;

  // Stat cards config
  const statCards = [
    {
      title: 'Total Earnings',
      value: formatCurrency(totalEarnings),
      subtitle: `${totalBookings} completed bookings`,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Monthly Earnings',
      value: formatCurrency(monthlyEarnings),
      trend: growthRate,
      subtitle: 'Last 30 days',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Weekly Earnings',
      value: formatCurrency(weeklyEarnings),
      subtitle: 'Last 7 days',
      icon: BarChart3,
      color: 'purple',
    },
    {
      title: 'Pending Earnings',
      value: formatCurrency(pendingEarnings),
      subtitle: 'Accepted bookings',
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Avg per Booking',
      value: formatCurrency(avgPerBooking),
      subtitle: 'Per completed booking',
      icon: Wallet,
      color: 'indigo',
    },
  ];

  const colorMap = {
    green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  };

  // CSV export
  const handleExportCSV = useCallback(() => {
    if (!payoutHistory.length) return;
    const headers = ['Date', 'Vehicle', 'Customer', 'Amount (MAD)', 'Status'];
    const rows = payoutHistory.map(p => [p.date, p.vehicle, p.customer, p.amount, p.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [payoutHistory]);

  if (isLoading && !earnings) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Earnings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your revenue and payouts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!payoutHistory.length}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const c = colorMap[card.color];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-xl border p-5 ${c.bg} ${c.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                {card.trend !== undefined && card.trend !== null && (
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

      {/* Daily Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Daily Earnings (Last 30 Days)</h4>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { value: 'area', label: 'Area' },
              { value: 'bar', label: 'Bar' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setChartType(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartType === opt.value
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {dailyEarnings.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === 'area' ? (
              <AreaChart data={dailyEarnings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.ceil(dailyEarnings.length / 7)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            ) : (
              <BarChart data={dailyEarnings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.ceil(dailyEarnings.length / 7)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No earnings data available yet
          </div>
        )}
      </motion.div>

      {/* Vehicle Earnings & Payout History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Revenue by Vehicle</h4>
          </div>

          {vehicleEarnings.length > 0 ? (
            <div className="space-y-3">
              {vehicleEarnings.map((vehicle, i) => {
                const maxRev = vehicleEarnings[0]?.revenue || 1;
                const pct = Math.round((vehicle.revenue / maxRev) * 100);
                return (
                  <motion.div
                    key={vehicle.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mr-2">{vehicle.name}</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(vehicle.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {vehicle.bookings} booking{vehicle.bookings !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No vehicle earnings data yet
            </div>
          )}
        </motion.div>

        {/* Payout History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Recent Payouts</h4>
          </div>

          {payoutHistory.length > 0 ? (
            <div className="space-y-2">
              {payoutHistory.map((payout, i) => (
                <motion.div
                  key={payout.id || i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{payout.vehicle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{payout.customer}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(payout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {formatCurrency(payout.amount)}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {payout.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No payout history yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Growth Summary */}
      {(totalEarnings > 0 || growthRate !== 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Growth Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your monthly earnings {growthRate >= 0 ? 'grew' : 'decreased'} by{' '}
                <span className={`font-semibold ${growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(growthRate).toFixed(1)}%
                </span>{' '}
                compared to the previous period.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrencyCompact(monthlyEarnings)}</p>
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                growthRate >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
              }`}>
                {growthRate >= 0
                  ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
