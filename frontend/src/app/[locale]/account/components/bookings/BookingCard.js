'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Car, Eye, Printer, XCircle, CheckCircle, ChevronRight, Sparkles, CreditCard, Fuel, Users, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, calculateDaysUntilBooking, calculateDuration, getBookingImage, getStatusColor, getStatusIcon } from './bookingUtils';

export default function BookingCard({ booking, onViewDetails, onPrint, onCancel, actionLoading }) {
  const listing = booking.listing || {};
  const imageUrl = getBookingImage(listing);
  const daysUntil = calculateDaysUntilBooking(booking.start_time || booking.start_date);
  const duration = calculateDuration(booking.start_time || booking.start_date, booking.end_time || booking.end_date);
  const status = (booking.status || '').toLowerCase();
  const canCancel = status === 'pending' || status === 'accepted' || status === 'confirmed';

  const statusConfig = {
    pending:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
    confirmed: { bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
    accepted:  { bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
    active:    { bg: 'bg-green-500/15',   border: 'border-green-500/30',   text: 'text-green-400',   dot: 'bg-green-400'   },
    completed: { bg: 'bg-slate-500/15',   border: 'border-slate-500/30',   text: 'text-slate-400',   dot: 'bg-slate-400'   },
    cancelled: { bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400',     dot: 'bg-red-400'     },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/8 transition-all duration-300"
    >
      {/* Top accent line that brightens on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/60 transition-all duration-500" />

      <div className="flex flex-col lg:flex-row">

        {/* ── LEFT: Image column ─────────────────────────────────── */}
        <div className="lg:w-64 xl:w-72 w-full h-52 lg:h-auto flex-shrink-0 relative overflow-hidden bg-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${listing.make || 'Vehicle'} ${listing.model || ''}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
            />
          ) : null}

          {/* Placeholder — dark themed */}
          <div className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900`}>
            <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-3">
              <Car className="h-12 w-12 text-orange-400/70" />
            </div>
            <span className="text-xs text-slate-500 font-medium">No image available</span>
          </div>

          {/* Dark gradient overlay for readability of overlaid badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Status badge — bottom of image */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md ${sc.bg} ${sc.border} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
              {booking.status}
            </span>
          </div>

          {/* Days-until badge — top of image */}
          {daysUntil !== null && daysUntil >= 0 && (status === 'pending' || status === 'confirmed') && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-orange-500 shadow-lg shadow-orange-500/30">
                <Sparkles className="h-3 w-3" />
                {daysUntil === 0 ? 'Today!' : `${daysUntil}d to go`}
              </span>
            </div>
          )}

          {/* Booking ID — top right */}
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-bold text-white/60 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
              #{booking.id}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Content ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* --- Header ------------------------------------------- */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-700/40">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white leading-tight group-hover:text-orange-400 transition-colors truncate">
                  {listing.make && listing.model
                    ? `${listing.make} ${listing.model}`
                    : 'Unknown Vehicle'}
                  {listing.year && (
                    <span className="text-base text-slate-500 font-normal ml-2">{listing.year}</span>
                  )}
                </h3>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {duration && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                      <Clock className="h-3 w-3 text-orange-400" />
                      {duration} day{duration !== 1 ? 's' : ''}
                    </span>
                  )}
                  {listing.fuel_type && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                      <Fuel className="h-3 w-3 text-orange-400" />
                      {listing.fuel_type}
                    </span>
                  )}
                  {listing.transmission && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                      {listing.transmission}
                    </span>
                  )}
                  {listing.seating_capacity && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                      <Users className="h-3 w-3 text-orange-400" />
                      {listing.seating_capacity} seats
                    </span>
                  )}
                </div>
              </div>

              {/* Price — visible on larger screens in header */}
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-2xl font-black text-white tracking-tight">
                  {formatCurrency(booking.price || booking.total_price || booking.total_amount)}
                </p>
                {booking.payment_method && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
                    <CreditCard className="h-3 w-3" />
                    {booking.payment_method}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* --- Trip timeline ------------------------------------ */}
          <div className="px-6 py-4 flex-1">
            <div className="flex items-stretch gap-3">
              {/* Pickup */}
              <div className="flex-1 p-3.5 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-orange-500/20 hover:bg-orange-500/5 transition-colors">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pickup</p>
                <p className="text-sm font-bold text-white leading-snug">
                  {formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}
                </p>
                {booking.pickup_location && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                    <span className="truncate">{booking.pickup_location}</span>
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center self-center flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-orange-500/60" />
              </div>

              {/* Return */}
              <div className="flex-1 p-3.5 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-orange-500/20 hover:bg-orange-500/5 transition-colors">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Return</p>
                <p className="text-sm font-bold text-white leading-snug">
                  {formatDateTime(booking.end_time || booking.end_date || booking.return_date)}
                </p>
                {booking.return_location && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                    <span className="truncate">{booking.return_location}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Location row (listing location) */}
            {listing.location && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
            )}

            {/* Special message */}
            {booking.request_message && (
              <div className="mt-3 p-3 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your message</p>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{booking.request_message}</p>
              </div>
            )}
          </div>

          {/* --- Footer: actions ---------------------------------- */}
          <div className="px-6 pb-5 pt-4 border-t border-slate-700/40">
            <div className="flex items-center justify-between gap-3 flex-wrap">

              {/* Left: status action */}
              <div>
                {canCancel ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCancel(booking.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full"
                        />
                        Cancelling…
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel Booking
                      </>
                    )}
                  </motion.button>
                ) : status === 'completed' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Completed
                  </span>
                ) : status === 'cancelled' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 border border-red-500/25 rounded-xl text-xs font-bold text-red-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelled
                  </span>
                ) : (
                  /* Date badge */
                  booking.requested_at && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(booking.requested_at)}
                    </span>
                  )
                )}
              </div>

              {/* Right: primary actions */}
              <div className="flex items-center gap-2 ml-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onPrint(booking)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onViewDetails(booking)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-md shadow-orange-600/20 hover:shadow-orange-500/30 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </motion.button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

