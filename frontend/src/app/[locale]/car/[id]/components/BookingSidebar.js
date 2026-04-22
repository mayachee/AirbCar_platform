'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ChevronRight, ShieldAlert, Headset } from 'lucide-react'

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

export default function BookingSidebar({ vehicle, searchDetails, selectedDates, onBookNow, onChangeDates }) {
  const { formatPrice } = useCurrency()
  const t = useTranslations('car_details')

  if (!vehicle) {
    return null
  }

  // Safely get price with fallback
  const price = vehicle.price || vehicle.price_per_day || vehicle.dailyRate || 0
  const securityDeposit = Number(vehicle.security_deposit ?? vehicle.securityDeposit ?? 5000)
  const duration = searchDetails?.duration || 1
  const { basePrice, serviceFee, total } = calculateTotalPrice(price, duration, securityDeposit)
  
  return (
    <div className="lg:col-span-1">
      <motion.div
        className="sticky top-12 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          className="bg-white/70 backdrop-blur-[16px] p-8 rounded-[2rem] border border-white/40 shadow-2xl overflow-hidden relative"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Recommended</span>
          </div>
          
          {/* Top Row: Price */}
          <motion.div
            className="flex items-baseline gap-1 mb-8"
            variants={itemVariants}
          >
            <span className="text-4xl font-black text-[var(--text-primary)]">
              {formatPrice(price).replace(/\sMAD|MAD/, '').trim()}
            </span>
            <span className="text-lg font-bold text-[var(--text-secondary)]">
              MAD / {t('day')}
            </span>
          </motion.div>

          {/* Date Picker */}
          <motion.div
            className="space-y-4 mb-8"
            variants={itemVariants}
            onClick={onChangeDates}
          >
            <div className="grid grid-cols-2 bg-[var(--surface-base)] rounded-2xl border border-[var(--surface-3)] overflow-hidden cursor-pointer hover:bg-white transition-colors">
              <div className="p-4 border-r border-[var(--surface-3)]">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Check-In</p>
                <p className="font-bold text-[var(--text-primary)] text-sm">{selectedDates.pickup || "Select Date"}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Check-Out</p>
                <p className="font-bold text-[var(--text-primary)] text-sm">{selectedDates.return || "Select Date"}</p>
              </div>
            </div>
          </motion.div>

          {/* Price Breakdown */}
          <motion.div className="space-y-3 mb-8 border-t border-[var(--surface-3)] pt-6" variants={itemVariants}>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{formatPrice(price)} x {duration} {duration === 1 ? t('day') : t('days')}</span>
              <span className="font-bold text-[var(--text-primary)]">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{t('service_fee')}</span>
              <span className="font-bold text-green-600">{serviceFee === 0 ? 'FREE' : formatPrice(serviceFee)}</span>
            </div>
            
            <div className="flex justify-between pt-3 border-t border-[var(--surface-3)]">
              <span className="text-xl font-bold text-[var(--text-primary)]">Total</span>
              <span className="text-xl font-black text-[var(--color-kc-primary)]">{formatPrice(total)}</span>
            </div>
          </motion.div>

          {/* Security Deposit Callout */}
          <motion.div
            className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-8"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Security Deposit</span>
            </div>
            <p className="text-sm font-semibold text-orange-800">
              {formatPrice(securityDeposit)} <span className="font-normal opacity-75">(Refundable)</span>
            </p>
            <p className="text-[10px] text-orange-700/60 mt-1 italic">
              Authorized hold per Moroccan rental standards.
            </p>
          </motion.div>

          {/* Book Button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={onBookNow}
              className="w-full bg-[#f97316] text-[#ffffff] py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Confirm Booking
            </button>
            <p className="text-center text-[10px] text-[var(--text-secondary)] mt-4 font-medium uppercase tracking-widest">
              You won&apos;t be charged yet
            </p>
          </motion.div>
        </motion.div>

        {/* Contact Agency Small Card */}
        <motion.div
          className="bg-[var(--surface-1)] p-6 rounded-2xl flex items-center justify-between border border-[var(--surface-3)] hover:border-[var(--color-kc-primary)]/30 transition-colors group cursor-pointer"
          variants={cardVariants}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Headset className="w-5 h-5 text-[var(--color-kc-primary)] group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Need Help?</p>
              <p className="font-bold text-[var(--text-primary)] text-sm">Chat with Owner</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full border border-[var(--surface-3)] flex items-center justify-center hover:bg-white transition-colors group-hover:bg-[var(--color-kc-primary)] group-hover:text-white group-hover:border-[var(--color-kc-primary)]">
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}


