'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Car, BarChart3 } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function AdvancedAnalytics({ analytics, stats, bookings, vehicles }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('revenue');

  // Use analytics from backend if available
  const chartData = analytics?.revenueByDay || [];
  const revenueTrend = analytics?.revenueTrend || 0;
  const bookingsTrend = analytics?.bookingsTrend || 0;
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalBookings = analytics?.totalBookings || bookings?.length || 0;
  const activeVehicles = analytics?.activeVehicles || vehicles?.filter(v => v.is_available)?.length || 0;
  const averageDailyRate = analytics?.averageDailyRate || (vehicles?.length ? vehicles.reduce((sum, v) => sum + (v.price_per_day || 0), 0) / vehicles.length : 0);

  // Trends from backend analytics
  const trends = {
    revenue: revenueTrend,
    bookings: bookingsTrend,
    vehicles: 0
  };

  // Use backend data if available, otherwise calculate from bookings/vehicles
  const statusCounts = analytics?.statusDistribution
    ? analytics.statusDistribution
    : (bookings
        ? bookings.reduce((acc, booking) => {
            const status = booking?.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        : {});

  const statusDistribution = Array.isArray(statusCounts)
    ? statusCounts
        .filter(Boolean)
        .map((item) => {
          const status = item.status ?? item.name ?? item.label ?? 'unknown';
          const count = Number(item.count ?? item.value ?? 0) || 0;
          return {
            status,
            count,
            percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
          };
        })
    : Object.entries(statusCounts || {}).map(([status, count]) => ({
        status,
        count,
        percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
      }));

  const vehiclePerformance = analytics?.vehiclePerformance || 
    (vehicles && bookings ? vehicles.map(vehicle => {
      const vehicleBookings = bookings.filter(b => b.listing?.id === vehicle.id);
      const totalRevenue = vehicleBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const bookingCount = vehicleBookings.length;
      
      return {
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model}`,
        revenue: totalRevenue,
        bookings: bookingCount,
        utilization: bookingCount > 0 ? (bookingCount / 30) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue) : []);

  const ChartBar = ({ data, maxValue, color = 'bg-blue-500' }) => (
    <div className="flex items-end space-x-1 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={`w-full ${color} rounded-t`}
            style={{ height: `${(item.value / maxValue) * 100}%` }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Analytics</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <SelectField
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
            ]}
            className="w-60 sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <SelectField
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'bookings', label: 'Bookings' },
              { value: 'vehicles', label: 'Vehicles' },
            ]}
            className="w-60 sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${
              trends.revenue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trends.revenue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(trends.revenue).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalBookings}
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${
              trends.bookings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trends.bookings >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(trends.bookings).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Vehicles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeVehicles}</p>
            </div>
            <Car className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Daily Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${Math.round(averageDailyRate)}
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h4>
          <ChartBar
            data={chartData.length > 0 ? chartData.map(d => ({
              label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.revenue || 0
            })) : [{ label: 'No data', value: 0 }]}
            maxValue={chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue || 0), 1) : 1}
            color="bg-green-500"
          />
        </div>

        {/* Bookings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Bookings Trend</h4>
          <ChartBar
            data={chartData.length > 0 ? chartData.map(d => ({
              label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.bookings || 0
            })) : [{ label: 'No data', value: 0 }]}
            maxValue={chartData.length > 0 ? Math.max(...chartData.map(d => d.bookings || 0), 1) : 1}
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* Status Distribution & Vehicle Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Booking Status Distribution</h4>
          <div className="space-y-3">
            {statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'accepted' ? 'bg-green-500' :
                    item.status === 'pending' ? 'bg-yellow-500' :
                    item.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.count}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Vehicles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Top Performing Vehicles</h4>
          <div className="space-y-3">
            {vehiclePerformance.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">${vehicle.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.utilization.toFixed(1)}% utilization</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
