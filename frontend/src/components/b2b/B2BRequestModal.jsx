'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, MessageSquare, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { partnerService } from '@/features/partner/services/partnerService'
import { useToast } from '@/contexts/ToastContext'

/**
 * B2B request modal.
 *
 * Posts to /partners/car-shares/ via the existing CarShareRequest endpoint.
 * The serializer resolves the listing by `public_id`, so the consumer of
 * this modal must pass a `car` object with that field populated (the
 * standard listing detail GET returns it).
 */
export default function B2BRequestModal({ isOpen, onClose, car, b2bPrice }) {
  const dailyRate = b2bPrice ?? car?.b2b_price_per_day ?? car?.price_per_day ?? ''
  const [proposedPrice, setProposedPrice] = useState(dailyRate || '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')
  const { showToast } = useToast()

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => partnerService.createCarShareRequest(data),
    onSuccess: () => {
      showToast('B2B request sent. Track it in My Requests.', 'success')
      onClose()
    },
    onError: (error) => {
      const detail =
        error?.data?.error ||
        error?.data?.detail ||
        error?.message ||
        'Failed to send B2B request. Please try again.'
      showToast(detail, 'error')
    },
  })

  const handleSubmit = () => {
    if (!startDate || !endDate || !proposedPrice) {
      showToast('Please fill in all required fields.', 'error')
      return
    }
    if (endDate < startDate) {
      showToast('End date must be on or after start date.', 'error')
      return
    }
    if (!car?.public_id) {
      showToast(
        'This listing has no public ID — ask the agency to publish it first.',
        'error',
      )
      return
    }

    const numericPrice = Number(proposedPrice)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showToast('Enter a valid MAD price.', 'error')
      return
    }

    mutate({
      public_id: car.public_id,
      start_date: startDate,
      end_date: endDate,
      total_price: numericPrice,
      notes: message || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">
              Request {car?.make} {car?.model}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <p className="text-gray-600 text-sm">
              Submit a B2B request to{' '}
              <strong>
                {car?.partner?.business_name || car?.partner?.businessName || 'the partner agency'}
              </strong>
              . They will review your dates and proposed price per day.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Requested dates</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex justify-between">
                <span>Proposed price (MAD / day)</span>
                {dailyRate ? (
                  <span className="text-xs text-gray-400">Listed: {dailyRate} MAD</span>
                ) : null}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  rows={3}
                  placeholder="Pickup time, intended use, etc."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isPending}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              className="px-6 py-2.5 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition flex items-center justify-center min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send request'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
