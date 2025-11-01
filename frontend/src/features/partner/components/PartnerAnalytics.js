'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Car } from 'lucide-react';

export default function PartnerAnalytics({ stats, bookings, vehicles }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartData, setChartData] = useState([]);

  // Generate mock chart data based on time range
  useEffect(() => {
    const generateChartData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          bookings: Math.floor(Math.random() * 10) + 1,
          revenue: Math.floor(Math.random() * 1000) + 200,
          vehicles: Math.floor(Math.random() * 3) + 1
        });
      }
      
      setChartData(data);
    };

    generateChartData();
  }, [timeRange]);

  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
  const totalBookings = chartData.reduce((sum, day) => sum + day.bookings, 0);
  const avgDailyRevenue = totalRevenue / chartData.length;

  const revenueChange = chartData.length > 1 ? 
    ((chartData[chartData.length - 1].revenue - chartData[0].revenue) / chartData[0].revenue * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              <p className="text-sm text-gray-500 mt-1">
                Avg: {(totalBookings / chartData.length).toFixed(1)}/day
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Daily Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${avgDailyRevenue.toFixed(0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {timeRange} average
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {chartData.map((day, index) => {
            const maxRevenue = Math.max(...chartData.map(d => d.revenue));
            const height = (day.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: $${day.revenue}`}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {chartData.map((day, index) => {
            const maxBookings = Math.max(...chartData.map(d => d.bookings));
            const height = (day.bookings / maxBookings) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.bookings} bookings`}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Performance</h3>
        <div className="space-y-4">
          {vehicles?.slice(0, 5).map((vehicle) => {
            const vehicleBookings = bookings?.filter(b => b.vehicle?.id === vehicle.id) || [];
            const totalRevenue = vehicleBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
            
            return (
              <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">{vehicle.year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{vehicleBookings.length} bookings</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
