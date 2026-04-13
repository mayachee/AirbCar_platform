'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ChevronRight, ShieldAlert } from 'lucide-react'

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
        className="sticky top-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Top Row: Price & Pill */}
          <motion.div
            className="flex items-start justify-between mb-8"
            variants={itemVariants}
          >
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                  {formatPrice(price).replace(/\sMAD|MAD/, '').trim()}
                </span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  MAD / {t('day')}
                </span>
              </div>
            </div>
            <div className="bg-[#ea580c]/10 text-[#ea580c] text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest shadow-sm border border-orange-100 uppercase">
              RECOMMENDED
            </div>
          </motion.div>

          {/* Check-in/out Box */}
          <motion.div
            className="border-2 border-gray-100 rounded-2xl p-4 flex divide-x divide-gray-100 mb-8 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            variants={itemVariants}
            onClick={onChangeDates}
          >
            <div className="flex-1 pr-4">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">CHECK-IN</label>
              <div className="text-sm font-bold text-gray-900">{selectedDates.pickup || "Select Date"}</div>
            </div>
            <div className="flex-1 pl-4">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">CHECK-OUT</label>
              <div className="text-sm font-bold text-gray-900">{selectedDates.return || "Select Date"}</div>
            </div>
          </motion.div>

          {/* Price Breakdown */}
          <motion.div className="space-y-4 mb-8" variants={itemVariants}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{formatPrice(price)} x {duration} {duration === 1 ? t('day') : t('days')}</span>
              <span className="font-bold text-gray-900">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{t('service_fee')}</span>
              <span className="font-bold text-gray-900">{formatPrice(serviceFee)}</span>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-extrabold text-xl text-gray-900">Total</span>
              <span className="font-extrabold text-xl text-gray-900">{formatPrice(total)}</span>
            </div>
          </motion.div>

          {/* Security Deposit Box */}
          <motion.div
            className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold uppercase tracking-widest mb-2">
              <ShieldAlert className="w-4 h-4" />
              SECURITY DEPOSIT
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-red-600 text-xl">{formatPrice(securityDeposit)}</span>
              <span className="text-red-400 text-[11px] font-bold uppercase tracking-wider">(Refundable)</span>
            </div>
            <div className="font-medium text-[11px] text-red-500">
              Fully refunded 48 hours after safe return
            </div>
          </motion.div>

          {/* Book Button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={onBookNow}
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-[1.25rem] w-full py-5 text-lg font-bold shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              Confirm Booking
            </button>
            <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-4 font-bold">
              YOU WON&apos;T BE CHARGED YET
            </div>
          </motion.div>
        </motion.div>

        {/* Support Chat */}
        <motion.div
          className="mt-6 bg-white hover:bg-gray-50 rounded-3xl p-5 flex items-center justify-between cursor-pointer transition-colors shadow-lg border border-gray-100"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center shadow-sm border-2 border-white">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="Owner" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">NEED HELP?</div>
              <div className="text-sm font-bold text-gray-900">Chat with Karim</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-white group-hover:text-gray-900 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}


