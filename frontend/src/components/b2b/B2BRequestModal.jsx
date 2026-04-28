import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, DollarSign, MessageSquare, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { partnerService } from '@/features/partner/services/partnerService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

export default function B2BRequestModal({ isOpen, onClose, car, b2bPrice }) {
  const [proposedPrice, setProposedPrice] = useState(b2bPrice || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const t = useTranslations('Partner');
  const tb = useTranslations('Buttons');

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => partnerService.createB2BBooking(data),
    onSuccess: () => {
      toast.success(t('b2bRequestSent', { defaultMessage: 'B2B Request Sent Successfully!' }));
      onClose();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || t('b2bRequestError', { defaultMessage: 'Failed to send B2B Request. Please try again.' }));
    }
  });

  const handleSubmit = () => {
    if (!startDate || !endDate || !proposedPrice) {
      toast.error(t('fillRequiredFields', { defaultMessage: 'Please fill in all required fields' }));
      return;
    }
    
    mutate({
      listing: car.id,
      start_date: startDate,
      end_date: endDate,
      proposed_price: Number(proposedPrice),
      message: message
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">{t('requestCar', { make: car?.make, model: car?.model, defaultMessage: `Request ${car?.make} ${car?.model}` })}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" disabled={isPending}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <p className="text-gray-600 mb-4 text-sm">
                {t('submitRequestTo', { defaultMessage: 'Submit a B2B request to' })} <strong>{car?.partner?.company_name || car?.agency || 'Partner'}</strong>. {t('theyWillReview', { defaultMessage: 'They will review your dates and proposed price per day.' })}
              </p>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">{t('requestedDates', { defaultMessage: 'Requested Dates' })}</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Negotiable Price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex justify-between">
                <span>{t('proposedPricePerDay', { defaultMessage: 'Proposed Price / Day' })}</span>
                <span className="text-xs text-gray-400">{t('defaultPrice', { price: b2bPrice, defaultMessage: `Default: $${b2bPrice}` })}</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Message/Requirements */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('messageToPartner', { defaultMessage: 'Message to Partner' })}</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  rows={4}
                  placeholder={t('messagePlaceholder', { defaultMessage: 'Add any specific requirements or notes...' })}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
            >
              {tb('cancel', { defaultMessage: 'Cancel' })}
            </button>
            <button
              className="px-6 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {tb('sending', { defaultMessage: 'Sending...' })}
                </>
              ) : (
                tb('sendRequest', { defaultMessage: 'Send Request' })
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}