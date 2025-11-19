export default function VehicleDetails({ vehicle }) {
  if (!vehicle) {
    return null
  }

  // Safely get features array
  const features = Array.isArray(vehicle.features) ? vehicle.features : []
  
  // Get fuel type from various possible field names
  const fuelType = vehicle.fuelType || vehicle.fuel_type || vehicle.fuel || 'N/A'
  
  // Get transmission
  const transmission = vehicle.transmission || 'N/A'
  
  // Get seats
  const seats = vehicle.seats || vehicle.seating_capacity || 'N/A'
  
  // Get name
  const name = vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* Specifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Car details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Make & Model</span>
            <span className="font-medium">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Year</span>
            <span className="font-medium">{vehicle.year || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Seats</span>
            <span className="font-medium">{seats}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transmission</span>
            <span className="font-medium capitalize">{transmission}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fuel type</span>
            <span className="font-medium capitalize">{fuelType}</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 gap-2">
          {features.length > 0 ? (
            features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">{feature}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">No features listed</p>
          )}
        </div>
      </div>
    </div>
  )
}

