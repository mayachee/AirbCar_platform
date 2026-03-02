'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Car, Eye, Printer, XCircle, CheckCircle, ChevronRight, Sparkles, CreditCard, Fuel, Users, ArrowDown, RefreshCw } from 'lucide-react';
import { formatDateTime, formatDate, calculateDaysUntilBooking, calculateDuration, getBookingImage, getStatusColor, getStatusIcon } from './bookingUtils';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';

const CURRENCY_CYCLE = ['MAD', 'USD', 'EUR'];

export default function BookingCard({ booking, onViewDetails, onPrint, onCancel, actionLoading }) {
  const listing = booking.listing || {};
  const { currency, setCurrency, formatPrice } = useCurrency();
  const imageUrl = getBookingImage(listing);
  const daysUntil = calculateDaysUntilBooking(booking.start_time || booking.start_date);
  const duration = calculateDuration(booking.start_time || booking.start_date, booking.end_time || booking.end_date);
  const status = (booking.status || '').toLowerCase();
  const canCancel = status === 'pending' || status === 'accepted' || status === 'confirmed';

  const statusConfig = {
    pending:   { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
    confirmed: { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
    accepted:  { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
    active:    { bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400'  },
    completed: { bg: 'bg-slate-500/15',  border: 'border-slate-500/30',  text: 'text-slate-400',  dot: 'bg-slate-400'  },
    cancelled: { bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-400'    },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/8 transition-all duration-300"
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/60 transition-all duration-500" />

      <div className="flex flex-col lg:flex-row">

        {/* ── Image ─────────────────────────────────────────────── */}
        {/* Mobile: landscape banner (shorter). Desktop: tall left column */}
        <div className="w-full h-36 sm:h-44 lg:w-64 xl:w-72 lg:h-auto flex-shrink-0 relative overflow-hidden bg-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${listing.make || 'Vehicle'} ${listing.model || ''}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
            />
          ) : null}

          {/* Placeholder */}
          <div className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} flex-row items-center justify-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900`}>
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Car className="h-10 w-10 text-orange-400/60" />
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Status badge — inside image, bottom-left */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border backdrop-blur-md ${sc.bg} ${sc.border} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
              {booking.status}
            </span>
          </div>

          {/* Days until — top-left */}
          {daysUntil !== null && daysUntil >= 0 && (status === 'pending' || status === 'confirmed') && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-orange-500 shadow-orange-500/40 shadow-md">
                <Sparkles className="h-3 w-3" />
                {daysUntil === 0 ? 'Today!' : `${daysUntil}d to go`}
              </span>
            </div>
          )}

          {/* Booking ID — top-right */}
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-bold text-white/60 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
              #{booking.id}
            </span>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* --- Header: name + price ----------------------------- */}
          <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-700/40">
            {/* Vehicle name row */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-orange-400 transition-colors">
                {listing.make && listing.model
                  ? `${listing.make} ${listing.model}`
                  : 'Unknown Vehicle'}
                {listing.year && (
                  <span className="text-sm sm:text-base text-slate-500 font-normal ml-2">{listing.year}</span>
                )}
              </h3>
              {/* Price — always visible, top right */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currency}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"
                    >
                      {formatPrice(booking.price || booking.total_price || booking.total_amount)}
                    </motion.p>
                  </AnimatePresence>
                  {/* Currency cycle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = CURRENCY_CYCLE.indexOf(currency);
                      setCurrency(CURRENCY_CYCLE[(idx + 1) % CURRENCY_CYCLE.length]);
                    }}
                    title={`Switch currency (${currency})`}
                    className="flex-shrink-0 p-1 rounded-md bg-slate-700/60 border border-slate-600/40 text-slate-400 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400/70 mt-0.5">
                  {CURRENCIES[currency]?.code}
                  {booking.payment_method && (
                    <span className="text-slate-500 font-normal">· {booking.payment_method}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Vehicle attribute pills — wrapping row */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {duration && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-600/40">
                  <Clock className="h-3 w-3 text-orange-400" />
                  {duration}d
                </span>
              )}
              {listing.fuel_type && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-600/40">
                  <Fuel className="h-3 w-3 text-orange-400" />
                  {listing.fuel_type}
                </span>
              )}
              {listing.transmission && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-600/40">
                  {listing.transmission}
                </span>
              )}
              {listing.seating_capacity && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-600/40">
                  <Users className="h-3 w-3 text-orange-400" />
                  {listing.seating_capacity} seats
                </span>
              )}
            </div>
          </div>

          {/* --- Trip timeline ------------------------------------ */}
          {/* Mobile: stacked vertically. sm+: side by side */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex-1 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">

              {/* Pickup */}
              <div className="flex-1 flex items-start gap-3 px-3.5 py-3 rounded-xl bg-slate-700/25 border border-slate-600/25">
                <div className="w-1.5 h-full self-stretch flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                  <div className="flex-1 w-px bg-orange-500/20 sm:hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pickup</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}
                  </p>
                  {booking.pickup_location && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{booking.pickup_location}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow — down on mobile, hidden on sm (border replaces it) */}
              <div className="flex sm:hidden items-center justify-center pl-2">
                <ArrowDown className="h-3.5 w-3.5 text-orange-500/40" />
              </div>

              {/* Return */}
              <div className="flex-1 flex items-start gap-3 px-3.5 py-3 rounded-xl bg-slate-700/25 border border-slate-600/25">
                <div className="w-1.5 flex-shrink-0 pt-1">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Return</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {formatDateTime(booking.end_time || booking.end_date || booking.return_date)}
                  </p>
                  {booking.return_location && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{booking.return_location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Listing location */}
            {listing.location && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1.5 sm:pt-2">
                <MapPin className="h-3 w-3 text-orange-400/60 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
            )}

            {/* Message */}
            {booking.request_message && (
              <div className="mt-2 p-3 bg-slate-700/20 rounded-xl border border-slate-600/25">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your message</p>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2">{booking.request_message}</p>
              </div>
            )}
          </div>

          {/* --- Footer ------------------------------------------- */}
          <div className="px-4 sm:px-6 pb-4 pt-3 border-t border-slate-700/40 space-y-2">

            {/* Primary CTA — full width on mobile */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewDetails(booking)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-md shadow-orange-600/20 hover:shadow-orange-500/30 transition-all"
            >
              <Eye className="h-4 w-4" />
              View Details
              <ChevronRight className="h-4 w-4 opacity-70" />
            </motion.button>

            {/* Secondary row: Print + Cancel/Status */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPrint(booking)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-400 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all flex-shrink-0"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </motion.button>

              {canCancel ? (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCancel(booking.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : status === 'cancelled' ? (
                <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelled
                </span>
              ) : booking.requested_at ? (
                <span className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(booking.requested_at)}
                </span>
              ) : <span className="flex-1" />}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

