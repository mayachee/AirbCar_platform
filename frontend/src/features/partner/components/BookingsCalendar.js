'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Car } from 'lucide-react';

export default function BookingsCalendar({ 
  bookings, 
  loading, 
  selectedDate, 
  onDateChange 
}) {
  const [activeTab, setActiveTab] = useState('checking-out');

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'checking-out') {
      return booking.status === 'confirmed' && new Date(booking.pickupDate) <= new Date();
    } else if (activeTab === 'checking-in') {
      return booking.status === 'active' && new Date(booking.dropoffDate) <= new Date();
    } else if (activeTab === 'upcoming') {
      return booking.status === 'confirmed' && new Date(booking.pickupDate) > new Date();
    }
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Bookings Calendar</h3>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'checking-out', label: 'Checking Out', count: bookings.filter(b => b.status === 'confirmed' && new Date(b.pickupDate) <= new Date()).length },
          { id: 'checking-in', label: 'Checking In', count: bookings.filter(b => b.status === 'active' && new Date(b.dropoffDate) <= new Date()).length },
          { id: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.status === 'confirmed' && new Date(b.pickupDate) > new Date()).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {booking.customer?.first_name} {booking.customer?.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{booking.customer?.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Car className="h-4 w-4" />
                      <span>{booking.vehicle?.brand} {booking.vehicle?.model}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(booking.pickupDate).toLocaleDateString()} - 
                        {new Date(booking.dropoffDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  ${booking.totalAmount}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found for this period</p>
        </div>
      )}
    </div>
  );
}
