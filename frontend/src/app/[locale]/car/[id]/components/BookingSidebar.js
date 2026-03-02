'use client'

import { useTranslations } from 'next-intl'

import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'

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
  const duration = searchDetails?.duration || 1
  const { basePrice, serviceFee, total } = calculateTotalPrice(price, duration)
  
  // Safely get insurance info
  const insurance = vehicle.insurance || {}
  const insuranceCoverage = insurance.coverage || 'Full coverage included'
  const insuranceDeductible = insurance.deductible || '5000 MAD'
  
  // Safely get mileage info
  const mileage = vehicle.mileage || {}
  const mileageIncluded = mileage.included || 200
  const mileageOverage = mileage.overage || '5 MAD/km'
  
  // Safely get availability info
  const availability = vehicle.availability || {}
  const advanceNotice = availability.advanceNotice || '24 hours'
  const minTripLength = availability.minTripLength || '1 day'
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          className="bg-white/5 rounded-xl border border-white/10 shadow-lg p-6 backdrop-blur-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        >
          {/* Price */}
          <motion.div
            className="text-center mb-6"
            variants={itemVariants}
          >
            <motion.div
              className="text-3xl font-bold text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              {formatPrice(price)}
            </motion.div>
            <motion.div
              className="text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t('per_day')}
            </motion.div>
          </motion.div>

          {/* Date Picker */}
          <motion.div
            className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10"
            variants={itemVariants}
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-medium text-gray-400 mb-1">{t('pickup')}</label>
                <div className="text-sm font-medium text-white">{selectedDates.pickup}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label className="block text-xs font-medium text-gray-400 mb-1">{t('return')}</label>
                <div className="text-sm font-medium text-white">{selectedDates.return}</div>
              </motion.div>
            </div>
            <motion.button
              onClick={onChangeDates}
              className="w-full mt-3 py-2 text-sm text-orange-400 font-medium border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition-colors"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {t('change_dates')}
            </motion.button>
          </motion.div>

          {/* Trip Summary */}
          <motion.div
            className="border-t border-b border-white/10 py-4 mb-6"
            variants={itemVariants}
          >
              <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-400">{duration} {duration === 1 ? t('day') : t('days')} {t('rental')}</span>
              <span className="font-medium text-white">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-400">{t('service_fee')}</span>
              <span className="font-medium text-white">{formatPrice(serviceFee)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{t('security_deposit')}</span>
              <span className="font-medium text-white">{formatPrice(5000)}</span>
            </div>
            <div className="text-xs text-green-400/70 text-right mb-2">
              {t('refunded_after_rental')}
            </div>
            <div className="flex justify-between items-center font-semibold text-lg pt-2 border-t border-white/10 mt-2 text-white">
              <span>{t('total')}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </motion.div>

          {/* Book Button */}
          <motion.button
            onClick={onBookNow}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors mb-4"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: '#ea580c',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {t('book_now')}
          </motion.button>

          {/* Insurance Info */}
          <motion.div
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-start space-x-2">
              <motion.svg
                className="w-5 h-5 text-green-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </motion.svg>
                <div>
                <div className="font-medium text-green-400">{t('protected_by_insurance')}</div>
                <div className="text-sm text-green-300">{insuranceCoverage}</div>
                <div className="text-xs text-green-400/80 mt-1">{t('deductible_label', { amount: insuranceDeductible })}</div>
              </div>
            </div>
          </motion.div>

          {/* What's Included */}
          <motion.div
            className="space-y-3"
            variants={itemVariants}
          >
            <h4 className="font-medium text-white">{t('whats_included')}</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{mileageIncluded} {t('km_included')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('comprehensive_insurance')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('roadside_assistance')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('free_cancellation')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

