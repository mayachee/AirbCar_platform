import { useCurrency } from '@/contexts/CurrencyContext';

export default function BookingCard({ 
  booking, 
  getStatusColor, 
  formatDate, 
  calculateDuration, 
  onViewDetails, 
  onCancel, 
  cancelLoading 
}) {
  const { formatPrice } = useCurrency();

  return (
    <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {booking.listing?.name || `${booking.listing?.make} ${booking.listing?.model}`} {booking.listing?.year ? `(${booking.listing?.year})` : ''}
              </h3>
              <span className={`px-3 py-1 rounded-none text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Pick-up</p>
                <p>{formatDate(booking.start_time)}</p>
                <p>{booking.listing?.location}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Drop-off</p>
                <p>{formatDate(booking.end_time)}</p>
                <p>{booking.listing?.location}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p>{calculateDuration(booking.start_time, booking.end_time)} {calculateDuration(booking.start_time, booking.end_time) === 1 ? 'day' : 'days'}</p>
                <p className="font-semibold text-orange-600">{formatPrice(booking.price)}</p>
              </div>
            </div>
          </div>
          
          <div className="ml-6">
            {booking.listing?.picture_url ? (
              <img
                src={booking.listing.picture_url}
                alt={booking.listing?.name || `${booking.listing.make} ${booking.listing.model}`}
                className="w-24 h-16 object-cover rounded-none"
              />
            ) : (
              <div className="w-24 h-16 bg-gray-200 rounded-none flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Booking ID: #{booking.id} • Booked on {new Date(booking.date).toLocaleDateString()}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onViewDetails(booking)}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              View Details
            </button>
            
            {(booking.status === 'pending' || booking.status === 'accepted') && new Date(booking.start_time) > new Date() && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelLoading}
                className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


