'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Car, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function VehicleAvailabilityCalendar({ vehicles, bookings }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getVehicleAvailability = (vehicleId, date) => {
    if (!bookings) return 'available';
    
    const dateStr = date.toISOString().split('T')[0];
    const vehicleBookings = bookings.filter(booking => 
      booking.listing?.id === vehicleId && 
      booking.status === 'accepted'
    );
    
    const isBooked = vehicleBookings.some(booking => {
      const startDate = new Date(booking.start_time).toISOString().split('T')[0];
      const endDate = new Date(booking.end_time).toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
    
    return isBooked ? 'booked' : 'available';
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-3 w-3" />;
      case 'booked': return <XCircle className="h-3 w-3" />;
      case 'maintenance': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getVehicleStats = (vehicleId) => {
    if (!bookings) return { totalBookings: 0, utilization: 0 };
    
    const vehicleBookings = bookings.filter(booking => 
      booking.listing?.id === vehicleId && 
      booking.status === 'accepted'
    );
    
    const totalBookings = vehicleBookings.length;
    const utilization = (totalBookings / 30) * 100; // Assuming 30 days
    
    return { totalBookings, utilization };
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Vehicle Availability Calendar</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">Month View</option>
            <option value="week">Week View</option>
            <option value="day">Day View</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`aspect-square p-2 border border-gray-200 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {day.getDate()}
                    </span>
                    <div className="flex-1 flex items-center justify-center">
                      {selectedVehicle && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getAvailabilityColor(getVehicleAvailability(selectedVehicle.id, day))}`}>
                          {getAvailabilityIcon(getVehicleAvailability(selectedVehicle.id, day))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Select Vehicle</h4>
          
          <div className="space-y-3">
            {vehicles?.map((vehicle) => {
              const stats = getVehicleStats(vehicle.id);
              const isSelected = selectedVehicle?.id === vehicle.id;
              
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </h5>
                      <p className="text-xs text-gray-500">{vehicle.year}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Bookings:</span>
                      <span className="ml-1 font-medium">{stats.totalBookings}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Utilization:</span>
                      <span className="ml-1 font-medium">{stats.utilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Legend</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2 w-2 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-2 w-2 text-red-600" />
                </div>
                <span className="text-xs text-gray-600">Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-2 w-2 text-yellow-600" />
                </div>
                <span className="text-xs text-gray-600">Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
