import { useCurrency } from '@/contexts/CurrencyContext'

export default function BookingSummary({ duration, pickupDate, returnDate, totalPrice }) {
  const { formatPrice } = useCurrency()
  const formatDate = (dateString) => {
    if (!dateString) return 'Not selected'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <h2 className="text-lg font-semibold text-black">Booking Summary</h2>
      </div>
      <div className="p-6 space-y-4">
        {pickupDate && (
          <div className="flex items-start justify-between">
            <div className="flex items-center flex-1">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                <p className="font-semibold text-gray-900 mt-0.5">{formatDate(pickupDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">10:00 AM (default)</p>
              </div>
            </div>
          </div>
        )}
        {returnDate && (
          <div className="flex items-start justify-between">
            <div className="flex items-center flex-1">
              <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Return</p>
                <p className="font-semibold text-gray-900 mt-0.5">{formatDate(returnDate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">6:00 PM (default)</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Rental Duration</p>
              <p className="font-medium text-gray-900">{duration} {duration === '1' ? 'day' : 'days'}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(totalPrice)}</p>
            </div>
            <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Free cancellation up to 24 hours before pickup
          </p>
        </div>
      </div>
    </div>
  )
}


