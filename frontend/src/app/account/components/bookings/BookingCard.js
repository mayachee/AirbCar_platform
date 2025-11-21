'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Car, Eye, Printer, XCircle, CheckCircle, ChevronRight, Sparkles, TrendingUp, CreditCard } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, calculateDaysUntilBooking, calculateDuration, getBookingImage, getStatusColor, getStatusIcon } from './bookingUtils';

export default function BookingCard({ booking, onViewDetails, onPrint, onCancel, actionLoading }) {
  const listing = booking.listing || {};
  const imageUrl = getBookingImage(listing);
  const daysUntil = calculateDaysUntilBooking(booking.start_time || booking.start_date);
  const duration = calculateDuration(booking.start_time || booking.start_date, booking.end_time || booking.end_date);
  const status = (booking.status || '').toLowerCase();
  const canCancel = status === 'pending' || status === 'accepted' || status === 'confirmed';

  // Debug logging in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!imageUrl) {
      console.log('🔍 BookingCard - No image found:', {
        listing: listing,
        hasImages: !!listing.images,
        hasPictures: !!listing.pictures,
        imageUrl: listing.image_url,
        pictureUrl: listing.picture_url,
        allKeys: Object.keys(listing)
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex flex-col md:flex-row">
        {/* Vehicle Image */}
        <div className="md:w-72 w-full h-56 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {imageUrl ? (
            <motion.img 
              src={imageUrl} 
              alt={`${listing.make || 'Vehicle'} ${listing.model || ''}`}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                console.warn('Image failed to load:', imageUrl);
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl);
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50`}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Car className="h-20 w-20 text-orange-300" />
            </motion.div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Days until badge for upcoming */}
          {daysUntil !== null && daysUntil >= 0 && status === 'pending' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm border border-orange-400/30"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} to go`}</span>
              </div>
            </motion.div>
          )}
          
          {/* Status Badge on Image */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm border flex items-center gap-1.5 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span>{booking.status?.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 space-y-4">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'Unknown Vehicle'}
                      {listing.year && <span className="text-lg text-gray-500 font-normal"> ({listing.year})</span>}
                    </h3>
                    <div className="flex items-center flex-wrap gap-3 mt-2">
                      <span className="text-sm text-gray-500 font-medium">Booking #{booking.id}</span>
                      {duration && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-orange-500" />
                          <span className="font-medium">{duration} day{duration !== 1 ? 's' : ''}</span>
                        </span>
                      )}
                      {booking.requested_at && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                          <span>{formatDate(booking.requested_at)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Pickup</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}
                    </p>
                    {booking.pickup_location && (
                      <p className="text-xs text-gray-600 mt-1">{booking.pickup_location}</p>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">Return</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(booking.end_time || booking.end_date || booking.return_date)}
                    </p>
                    {booking.return_location && (
                      <p className="text-xs text-gray-600 mt-1">{booking.return_location}</p>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900">{listing.location || 'Location not specified'}</p>
                  </div>
                </motion.div>
                
                {listing.fuel_type && (
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Car className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Vehicle</p>
                      <p className="text-sm font-medium text-gray-900">
                        {listing.fuel_type} • {listing.transmission || 'Auto'}
                      </p>
                      {listing.seating_capacity && (
                        <p className="text-xs text-gray-600 mt-1">{listing.seating_capacity} seats</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Special Message */}
              {booking.request_message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Your Message</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{booking.request_message}</p>
                </motion.div>
              )}
            </div>
            
            {/* Price & Actions Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">Total Amount</p>
                  </div>
                  <p className="text-4xl font-bold text-orange-600 mb-1">
                    {formatCurrency(booking.price || booking.total_price || booking.total_amount)}
                  </p>
                  {booking.payment_method && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs text-gray-600 capitalize">{booking.payment_method}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDetails(booking)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPrint(booking)}
                      className="flex-1 px-3 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                      title="Print receipt"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="text-xs">Print</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            {canCancel ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCancel(booking.id)}
                disabled={actionLoading}
                className="px-6 py-3 text-sm font-semibold text-red-600 bg-red-50 border-2 border-red-300 rounded-xl hover:bg-red-100 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {actionLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"
                    />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Booking</span>
                  </>
                )}
              </motion.button>
            ) : status === 'completed' ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-2 border-green-200 rounded-xl w-fit">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Booking Completed</span>
              </div>
            ) : status === 'cancelled' ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-2 border-red-200 rounded-xl w-fit">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-semibold text-red-800">Booking Cancelled</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

