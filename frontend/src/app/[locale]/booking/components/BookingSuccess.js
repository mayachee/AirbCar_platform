import { useRouter } from 'next/navigation'
import { useCurrency } from '@/contexts/CurrencyContext'

export default function BookingSuccess({ bookingData }) {
  const router = useRouter()
  const { formatPrice } = useCurrency()

  // Support both shapes:
  // - booking object directly
  // - wrapper { data: booking, message }
  const booking = bookingData?.data || bookingData

  const pickupDateValue = booking?.start_time || booking?.pickup_date || booking?.pickupDate
  const returnDateValue = booking?.end_time || booking?.return_date || booking?.returnDate
  const pickupTimeValue = booking?.pickup_time || booking?.pickupTime
  const returnTimeValue = booking?.return_time || booking?.returnTime
  const totalAmountValue = booking?.price || booking?.total_amount || booking?.totalAmount

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Booking Request Submitted!</h1>
          <p className="text-green-100 text-lg max-w-md mx-auto">
            Your booking request has been sent to the car owner for review.
          </p>
        </div>

        {/* Success Content */}
        <div className="p-8">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Booking ID</p>
                <p className="font-bold text-lg text-gray-900">#{booking?.id || 'PENDING'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></div>
                  <p className="font-bold text-lg text-gray-900">Pending Approval</p>
                </div>
              </div>
            </div>
            {pickupDateValue && returnDateValue && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pickup Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(pickupDateValue).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {(booking?.start_time || pickupTimeValue) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {booking?.start_time
                        ? new Date(booking.start_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : pickupTimeValue}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Return Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(returnDateValue).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {(booking?.end_time || returnTimeValue) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {booking?.end_time
                        ? new Date(booking.end_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : returnTimeValue}
                    </p>
                  )}
                </div>
              </div>
            )}
            {totalAmountValue && (
              <div className="mt-4 bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(totalAmountValue)}</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happens next?
            </h3>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>The car owner will review your booking request within 24 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>You'll receive an email notification once they respond</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Upon approval, you'll need to complete payment to secure your booking</span>
              </li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Important Notice</p>
                <p className="text-xs text-amber-800">
                  This booking is not yet confirmed. You'll receive a confirmation email once the owner approves your request and payment is completed.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/account?tab=bookings')}
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View My Bookings
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


