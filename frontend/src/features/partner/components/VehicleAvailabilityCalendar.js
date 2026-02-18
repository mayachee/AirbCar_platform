'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Calendar, Car, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function VehicleAvailabilityCalendar({ vehicles, bookings }) {
  const t = useTranslations('vehicle_calendar');
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
    
    // Ensure bookings is an array
    const bookingsArray = Array.isArray(bookings) 
      ? bookings 
      : (bookings?.data || bookings?.results || []);
    
    const dateStr = date.toISOString().split('T')[0];
    const vehicleBookings = bookingsArray.filter(booking => 
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
      case 'available': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'booked': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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
    
    // Ensure bookings is an array
    const bookingsArray = Array.isArray(bookings) 
      ? bookings 
      : (bookings?.data || bookings?.results || []);
    
    const vehicleBookings = bookingsArray.filter(booking => 
      booking.listing?.id === vehicleId && 
      booking.status === 'accepted'
    );
    
    const totalBookings = vehicleBookings.length;
    const utilization = (totalBookings / 30) * 100; // Assuming 30 days
    
    return { totalBookings, utilization };
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];
  const dayNames = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
            {t('heading')}
          </h3>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <SelectField
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            options={[
              { value: 'month', label: t('month') },
              { value: 'week', label: t('week') },
              { value: 'day', label: t('day') },
            ]}
            className="w-60 sm:w-auto h-11 sm:h-auto px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start sm:space-x-2 min-w-0">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex-1 sm:flex-none min-w-0 text-base sm:text-lg font-semibold text-gray-900 dark:text-white text-center px-2 truncate">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="min-w-[360px] sm:min-w-[420px]">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square p-1 sm:p-2 border border-gray-200 dark:border-gray-700 ${
                      day ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
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
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">{t('select_vehicle')}</h4>
          
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
                      ? 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.year}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('bookings')}:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{stats.totalBookings}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('utilization')}:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{stats.utilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('legend')}</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2 w-2 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('available')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <XCircle className="h-2 w-2 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('booked')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                  <Clock className="h-2 w-2 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('maintenance')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
