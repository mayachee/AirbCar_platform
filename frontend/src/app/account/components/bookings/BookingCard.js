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
      className="bg-orange-500/50 rounded-2xl shadow-lg border border-orange-500 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500 transition-all duration-300 group"
    >
      <div className="flex flex-col md:flex-row">
        {/* Vehicle Image */}
        <div className="md:w-72 w-full h-56 md:h-auto bg-gray-50 relative overflow-hidden">
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
            className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50`}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1] 
              }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
            >
              <Car className="h-20 w-20 text-orange-400/80" />
            </motion.div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Days until badge for upcoming */}
          {daysUntil !== null && daysUntil >= 0 && status === 'pending' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-4 left-4 bg-orange-500/90 backdrop-blur-md text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-white/50"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                <span>{daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} to go`}</span>
              </div>
            </motion.div>
          )}
          
          {/* Status Badge on Image */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border flex items-center gap-1.5 ${getStatusColor(booking.status)}`}>
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
                  whileHover={{ x: 4, backgroundColor: "rgba(224, 231, 255, 0.6)" }}
                  className="flex items-start gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/80 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm border border-indigo-50">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">Pickup</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}
                    </p>
                    {booking.pickup_location && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">{booking.pickup_location}</p>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 4, backgroundColor: "rgba(209, 250, 229, 0.6)" }}
                  className="flex items-start gap-3 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/80 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm border border-emerald-50">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1">Return</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(booking.end_time || booking.end_date || booking.return_date)}
                    </p>
                    {booking.return_location && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">{booking.return_location}</p>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 4, backgroundColor: "rgba(237, 233, 254, 0.6)" }}
                  className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100/80 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg text-violet-600 shadow-sm border border-violet-50">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-violet-900 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{listing.location || 'Location not specified'}</p>
                  </div>
                </motion.div>
                
                {listing.fuel_type && (
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: "rgba(254, 243, 199, 0.6)" }}
                    className="flex items-start gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-100/80 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm border border-amber-50">
                      <Car className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">Vehicle</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.fuel_type} • {listing.transmission || 'Auto'}
                      </p>
                      {listing.seating_capacity && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">{listing.seating_capacity} seats</p>
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
              <div className="h-full bg-orange-500/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl"></div>
                
                <div className="relative text-center mb-6 z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-orange-900/80 uppercase tracking-wider">Total Price</p>
                  </div>
                  <p className="text-4xl font-black text-gray-900 mb-2 tracking-tight drop-shadow-sm">
                    {formatCurrency(booking.price || booking.total_price || booking.total_amount)}
                  </p>
                  {booking.payment_method && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-orange-100 shadow-sm">
                      <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{booking.payment_method}</span>
                    </div>
                  )}
                </div>
                
                <div className="relative space-y-3 z-10">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDetails(booking)}
                    className="w-full px-4 py-3.5 bg-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <Eye className="h-4 w-4 opacity-90" />
                    <span>View Details</span>
                    <ChevronRight className="h-4 w-4 opacity-75 group-hover/btn:translate-x-0.5 transition-transform" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPrint(booking)}
                    className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm"
                    title="Print receipt"
                  >
                    <Printer className="h-4 w-4 text-gray-400" />
                    <span className="text-xs uppercase tracking-wide">Print booking</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            {canCancel ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCancel(booking.id)}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50/50 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
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
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50/50 border border-green-200 rounded-xl w-fit">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-700">Booking Completed</span>
              </div>
            ) : status === 'cancelled' ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50/50 border border-red-200 rounded-xl w-fit">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-red-700">Booking Cancelled</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

