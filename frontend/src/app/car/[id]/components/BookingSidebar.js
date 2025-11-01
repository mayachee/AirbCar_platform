export default function BookingSidebar({ vehicle, searchDetails, selectedDates, onBookNow, onChangeDates }) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-6">
        <div className="bg-white rounded-xl border shadow-lg p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900">{vehicle.price} MAD</div>
            <div className="text-gray-600">per day</div>
          </div>

          {/* Date Picker */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pickup</label>
                <div className="text-sm font-medium">{selectedDates.pickup}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Return</label>
                <div className="text-sm font-medium">{selectedDates.return}</div>
              </div>
            </div>
            <button 
              onClick={onChangeDates}
              className="w-full mt-3 py-2 text-sm text-orange-600 font-medium border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              Change dates
            </button>
          </div>

          {/* Trip Summary */}
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">{searchDetails.duration} {searchDetails.duration === 1 ? 'day' : 'days'} rental</span>
              <span className="font-medium">{(vehicle.price * searchDetails.duration).toLocaleString()} MAD</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span>{(vehicle.price * searchDetails.duration).toLocaleString()} MAD</span>
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={onBookNow}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors mb-4"
          >
            Book now
          </button>

          {/* Insurance Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <div className="font-medium text-green-800">Protected by insurance</div>
                <div className="text-sm text-green-700">{vehicle.insurance.coverage}</div>
                <div className="text-xs text-green-600 mt-1">Deductible: {vehicle.insurance.deductible}</div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What's included</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{vehicle.mileage.included} km included</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Comprehensive insurance</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>24/7 roadside assistance</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free cancellation (48h)</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Extra km: {vehicle.mileage.overage}</div>
              <div>Advance notice: {vehicle.availability.advanceNotice}</div>
              <div>Min trip: {vehicle.availability.minTripLength}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

