'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Car, Users, BarChart3, PieChart } from 'lucide-react';

export default function AdvancedAnalytics({ stats, bookings, vehicles }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('revenue');

  // Mock data for demonstration - replace with real data
  const generateMockData = (range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500) + 100,
        bookings: Math.floor(Math.random() * 10) + 1,
        vehicles: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return data;
  };

  const [chartData, setChartData] = useState(generateMockData(timeRange));

  useEffect(() => {
    setChartData(generateMockData(timeRange));
  }, [timeRange]);

  const calculateTrends = () => {
    if (chartData.length < 2) return { revenue: 0, bookings: 0, vehicles: 0 };
    
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const firstAvgRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
    const secondAvgRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;
    
    const firstAvgBookings = firstHalf.reduce((sum, d) => sum + d.bookings, 0) / firstHalf.length;
    const secondAvgBookings = secondHalf.reduce((sum, d) => sum + d.bookings, 0) / secondHalf.length;
    
    return {
      revenue: ((secondAvgRevenue - firstAvgRevenue) / firstAvgRevenue) * 100,
      bookings: ((secondAvgBookings - firstAvgBookings) / firstAvgBookings) * 100,
      vehicles: 0 // Static for now
    };
  };

  const trends = calculateTrends();

  const getStatusDistribution = () => {
    if (!bookings) return [];
    
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / bookings.length) * 100
    }));
  };

  const getVehiclePerformance = () => {
    if (!vehicles || !bookings) return [];
    
    return vehicles.map(vehicle => {
      const vehicleBookings = bookings.filter(b => b.listing?.id === vehicle.id);
      const totalRevenue = vehicleBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const bookingCount = vehicleBookings.length;
      
      return {
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model}`,
        revenue: totalRevenue,
        bookings: bookingCount,
        utilization: bookingCount > 0 ? (bookingCount / 30) * 100 : 0 // Assuming 30 days
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  const statusDistribution = getStatusDistribution();
  const vehiclePerformance = getVehiclePerformance();

  const ChartBar = ({ data, maxValue, color = 'bg-blue-500' }) => (
    <div className="flex items-end space-x-1 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={`w-full ${color} rounded-t`}
            style={{ height: `${(item.value / maxValue) * 100}%` }}
          />
          <span className="text-xs text-gray-500 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="revenue">Revenue</option>
            <option value="bookings">Bookings</option>
            <option value="vehicles">Vehicles</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${
              trends.revenue >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trends.revenue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(trends.revenue).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {chartData.reduce((sum, d) => sum + d.bookings, 0)}
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${
              trends.bookings >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trends.bookings >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(trends.bookings).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles?.length || 0}</p>
            </div>
            <Car className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Daily Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                ${vehicles?.length ? Math.round(vehicles.reduce((sum, v) => sum + (v.price_per_day || 0), 0) / vehicles.length) : 0}
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue Trend</h4>
          <ChartBar
            data={chartData.map(d => ({
              label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.revenue
            }))}
            maxValue={Math.max(...chartData.map(d => d.revenue))}
            color="bg-green-500"
          />
        </div>

        {/* Bookings Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Bookings Trend</h4>
          <ChartBar
            data={chartData.map(d => ({
              label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.bookings
            }))}
            maxValue={Math.max(...chartData.map(d => d.bookings))}
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* Status Distribution & Vehicle Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Booking Status Distribution</h4>
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
                  <span className="text-sm font-medium text-gray-900 capitalize">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <span className="text-sm text-gray-500">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Vehicles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Performing Vehicles</h4>
          <div className="space-y-3">
            {vehiclePerformance.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                  <p className="text-xs text-gray-500">{vehicle.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${vehicle.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{vehicle.utilization.toFixed(1)}% utilization</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
