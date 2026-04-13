import { useCurrency } from '@/contexts/CurrencyContext';

export default function BookingDetailsModal({ 
  selectedBooking, 
  onClose, 
  getStatusColor, 
  formatDate, 
  calculateDuration, 
  onCancel, 
  cancelLoading 
}) {
  const { formatPrice } = useCurrency();

  if (!selectedBooking) return null

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl bg-white rounded-none shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Car Details */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="font-medium text-gray-900 mb-4">Vehicle Information</h4>
            <div className="flex items-start space-x-4">
              {selectedBooking.listing?.picture_url ? (
                <img
                  src={selectedBooking.listing.picture_url}
                  alt={selectedBooking.listing?.name || `${selectedBooking.listing.make} ${selectedBooking.listing.model}`}
                  className="w-32 h-24 object-cover rounded-none"
                />
              ) : (
                <div className="w-32 h-24 bg-gray-200 rounded-none flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h5 className="text-lg font-semibold text-gray-900">
                  {selectedBooking.listing?.name || `${selectedBooking.listing?.make} ${selectedBooking.listing?.model}`} {selectedBooking.listing?.year ? `(${selectedBooking.listing?.year})` : ''}
                </h5>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Transmission:</span> {selectedBooking.listing?.transmission}</p>
                  <p><span className="font-medium">Fuel Type:</span> {selectedBooking.listing?.fuel_type || selectedBooking.listing?.fuel || selectedBooking.listing?.fuelType}</p>
                  <p><span className="font-medium">Seats:</span> {selectedBooking.listing?.seating_capacity || selectedBooking.listing?.seats}</p>
                  <p><span className="font-medium">Location:</span> {selectedBooking.listing?.location}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking Details */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="font-medium text-gray-900 mb-4">Booking Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Booking ID</p>
                <p className="text-gray-600">#{selectedBooking.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <span className={`inline-block px-3 py-1 rounded-none text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Pick-up Date</p>
                <p className="text-gray-600">{formatDate(selectedBooking.start_time)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Drop-off Date</p>
                <p className="text-gray-600">{formatDate(selectedBooking.end_time)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-gray-600">{calculateDuration(selectedBooking.start_time, selectedBooking.end_time)} day(s)</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Total Price</p>
                <p className="text-lg font-semibold text-orange-600">{formatPrice(selectedBooking.price)}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-none text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {(selectedBooking.status === 'pending' || selectedBooking.status === 'accepted') && new Date(selectedBooking.start_time) > new Date() && (
              <button
                onClick={() => {
                  onCancel(selectedBooking.id)
                  onClose()
                }}
                disabled={cancelLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}










