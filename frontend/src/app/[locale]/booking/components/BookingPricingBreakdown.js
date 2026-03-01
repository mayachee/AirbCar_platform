/**
 * Booking Pricing Breakdown Component
 * Shows transparent pricing with all fees
 */

import { useCurrency } from '@/contexts/CurrencyContext'

export default function BookingPricingBreakdown({ 
  basePrice, 
  duration, 
  fees = {}, 
  totalPrice 
}) {
  const subtotal = parseFloat(basePrice) || 0;
  const { formatPrice } = useCurrency();
  const serviceFee = fees.serviceFee || 25; // Fixed service fee
  const securityFee = fees.securityFee || 5000; // Fixed security deposit
  const insuranceFee = fees.insuranceFee || 0; // Optional insurance
  
  const finalTotal = subtotal + serviceFee + securityFee + insuranceFee;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
      
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Rental ({duration} {duration === '1' ? 'day' : 'days'})
          </span>
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Service Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Service Fee</span>
            <button 
              className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="10% platform service fee"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(serviceFee)}
          </span>
        </div>

        {/* Security Deposit */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Security Deposit</span>
            <button 
              className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refundable after vehicle return"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(securityFee)}
          </span>
        </div>

        {/* Optional Insurance */}
        {insuranceFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Insurance</span>
            <span className="text-sm font-medium text-orange-600">
              +{formatPrice(insuranceFee)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-orange-600">
            {formatPrice(finalTotal)}
          </span>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Security deposit refunded upon vehicle return
        </p>
      </div>
    </div>
  );
}

