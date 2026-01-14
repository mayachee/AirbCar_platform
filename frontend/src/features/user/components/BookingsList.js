'use client';

import { formatDate, formatBookingStatus, getStatusColor, calculateDays } from '../utils/formatting';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function BookingsList({ bookings, loading, onViewDetails, onCancelBooking }) {
  const { formatPrice } = useCurrency();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6">Start by booking your first car rental!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const vehicle = booking.vehicle || booking.car || {};
        const statusColor = getStatusColor(booking.status);
        
        // Get vehicle info from listing if available
        const listing = booking.listing || vehicle;
        const vehicleName = listing?.make && listing?.model 
          ? `${listing.make} ${listing.model}${listing.year ? ` (${listing.year})` : ''}`
          : vehicle.name || vehicle.make_model || 'Unknown Vehicle';
        
        return (
          <div key={booking.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {vehicleName}
                  </h3>
                  <p className="text-sm text-gray-600">{listing?.location || vehicle.location || 'Location not specified'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                  {formatBookingStatus(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pickup</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(booking.start_time || booking.pickup_date || booking.start_date || booking.requested_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Return</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(booking.end_time || booking.dropoff_date || booking.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {calculateDays(
                      booking.start_time || booking.pickup_date || booking.start_date || booking.requested_at,
                      booking.end_time || booking.dropoff_date || booking.end_date
                    )} day{calculateDays(
                      booking.start_time || booking.pickup_date || booking.start_date || booking.requested_at,
                      booking.end_time || booking.dropoff_date || booking.end_date
                    ) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {vehicle.seats && (
                    <span className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {vehicle.seats} seats
                    </span>
                  )}
                  {vehicle.transmission && (
                    <span className="text-sm text-gray-600">{vehicle.transmission}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-500">
                    {formatPrice(booking.price || booking.total_price || booking.total_amount || 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(booking)}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    View Details
                  </button>
                )}
                {onCancelBooking && booking.status === 'pending' && (
                  <button
                    onClick={() => onCancelBooking(booking)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
