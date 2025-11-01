'use client';

import { useState, useEffect } from 'react';

export default function VehiclePerformanceInsights({ vehicles }) {
  const [insights, setInsights] = useState({
    topPerformer: null,
    leastBooked: null,
    averageRating: 0,
    totalBookings: 0,
    revenueByVehicle: []
  });

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      // Mock insights calculation - replace with real data
      const mockInsights = {
        topPerformer: vehicles[0],
        leastBooked: vehicles[vehicles.length - 1] || vehicles[0],
        averageRating: 4.2,
        totalBookings: vehicles.reduce((sum, v) => sum + (v.bookings || 0), 0),
        revenueByVehicle: vehicles.map(v => ({
          id: v.id,
          name: `${v.make} ${v.model}`,
          revenue: Math.random() * 2000 + 500,
          bookings: v.bookings || Math.floor(Math.random() * 20) + 1
        }))
      };
      setInsights(mockInsights);
    }
  }, [vehicles]);

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Performance</h3>
      
      <div className="space-y-4">
        {/* Top Performer */}
        {insights.topPerformer && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-800 dark:text-green-200">🏆 Top Performer</h4>
              <span className="text-sm text-green-600 dark:text-green-400">
                {insights.averageRating.toFixed(1)} ⭐
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {insights.topPerformer.make} {insights.topPerformer.model}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {insights.topPerformer.bookings || 0} bookings this month
            </p>
          </div>
        )}

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Avg Rating</span>
              <span className={`font-semibold ${getPerformanceColor(insights.averageRating)}`}>
                {insights.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Bookings</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {insights.totalBookings}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue by Vehicle */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue by Vehicle</h4>
          <div className="space-y-2">
            {insights.revenueByVehicle.slice(0, 3).map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.bookings} bookings</p>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  ${vehicle.revenue.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
