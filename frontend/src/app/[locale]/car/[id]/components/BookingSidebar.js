'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ChevronRight, ShieldCheck } from 'lucide-react'

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
          className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Top Row: Price & Pill */}
          <motion.div
            className="flex items-start justify-between mb-6"
            variants={itemVariants}
          >
            <div>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-[32px] md:text-[40px] font-extrabold text-gray-900 leading-none">
                  {formatPrice(price).replace(/\sMAD|MAD/, '').trim()}
                </span>
                <span className="text-sm font-medium text-gray-400 mt-2">
                  MAD / {t('day')}
                </span>
              </div>
            </div>
            <div className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
              RECOMMENDED
            </div>
          </motion.div>

          {/* Check-in/out Box */}
          <motion.div
            className="border border-gray-200 rounded-xl p-4 flex divide-x mb-6 cursor-pointer hover:bg-gray-50 transition-colors"
            variants={itemVariants}
            onClick={onChangeDates}
          >
            <div className="flex-1 pr-4">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">CHECK-IN</label>
              <div className="text-sm font-bold text-gray-900">{selectedDates.pickup || "Select Date"}</div>
            </div>
            <div className="flex-1 pl-4">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">CHECK-OUT</label>
              <div className="text-sm font-bold text-gray-900">{selectedDates.return || "Select Date"}</div>
            </div>
          </motion.div>

          {/* Price Breakdown */}
          <motion.div className="space-y-3 mb-6" variants={itemVariants}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{formatPrice(price)} x {duration} {duration === 1 ? t('day') : t('days')}</span>
              <span className="font-bold text-gray-900">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('service_fee')}</span>
              <span className="font-bold text-gray-900">{formatPrice(serviceFee)}</span>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-900">Total</span>
              <span className="font-bold text-lg text-red-600">{formatPrice(total)}</span>
            </div>
          </motion.div>

          {/* Security Deposit Box */}
          <motion.div
            className="bg-orange-50 border border-orange-100 rounded-xl p-4 my-6"
            variants={itemVariants}
          >
            <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              SECURITY DEPOSIT
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600 text-lg">{formatPrice(securityDeposit)}</span>
              <span className="text-gray-500 text-xs font-medium">(Refundable)</span>
            </div>
            <div className="italic text-[10px] text-gray-400 mt-1">
              Fully refunded 48 hours after safe return
            </div>
          </motion.div>

          {/* Book Button */}
          <motion.div variants={itemVariants} className="mt-2">
            <button
              onClick={onBookNow}
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl w-full py-4 font-bold shadow-md transition-all active:scale-[0.98]"
            >
              Confirm Booking
            </button>
            <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-3 font-semibold">
              YOU WON&apos;T BE CHARGED YET
            </div>
          </motion.div>
        </motion.div>

        {/* Support Chat */}
        <motion.div
          className="mt-6 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors shadow-sm border border-gray-100"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-sm border border-gray-100">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="Agent" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">NEED HELP?</div>
              <div className="text-sm font-bold text-gray-900">Chat with Karim</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}


