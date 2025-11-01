'use client';

import { Calendar, Clock, MapPin, Car, Eye, Printer, XCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, calculateDaysUntilBooking, calculateDuration, getBookingImage, getStatusColor, getStatusIcon } from './bookingUtils';

export default function BookingCard({ booking, onViewDetails, onPrint, onCancel, actionLoading }) {
  const listing = booking.listing || {};
  const imageUrl = getBookingImage(listing);
  const daysUntil = calculateDaysUntilBooking(booking.start_time || booking.start_date);
  const duration = calculateDuration(booking.start_time || booking.start_date, booking.end_time || booking.end_date);
  const status = (booking.status || '').toLowerCase();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Vehicle Image */}
        <div className="md:w-64 w-full h-48 md:h-auto bg-gray-100 relative overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`${listing.make} ${listing.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100`}
          >
            <Car className="h-16 w-16 text-orange-300" />
          </div>
          {/* Days until badge for upcoming */}
          {daysUntil !== null && daysUntil >= 0 && status === 'pending' && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} to go`}
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span>{booking.status?.toUpperCase()}</span>
                </span>
                <span className="text-sm text-gray-500">Booking #{booking.id}</span>
                {duration && (
                  <span className="text-sm text-gray-500 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{duration} day{duration !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {booking.requested_at && (
                  <span className="text-sm text-gray-500 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(booking.requested_at)}</span>
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'Unknown Vehicle'}
                {listing.year && ` (${listing.year})`}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>
                    <strong className="text-gray-700">Pickup:</strong> {formatDateTime(booking.start_time || booking.start_date)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>
                    <strong className="text-gray-700">Return:</strong> {formatDateTime(booking.end_time || booking.end_date)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span>{listing.location || 'Location not specified'}</span>
                </div>
                {listing.fuel_type && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span>{listing.fuel_type} • {listing.transmission || 'Auto'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-6 text-right flex flex-col items-end">
              <p className="text-3xl font-bold text-orange-600 mb-2">
                {formatCurrency(booking.price || booking.total_price)}
              </p>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => onViewDetails(booking)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPrint(booking)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Print receipt"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {booking.request_message && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Your message:</strong> {booking.request_message}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            {(booking.status === 'pending' || booking.status === 'accepted' || booking.status === 'confirmed') && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Cancel Booking</span>
              </button>
            )}
            {status === 'completed' && (
              <span className="text-sm text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Booking completed</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

