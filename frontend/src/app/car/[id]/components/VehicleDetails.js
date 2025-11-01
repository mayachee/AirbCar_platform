export default function VehicleDetails({ vehicle }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* Specifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Car details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Make & Model</span>
            <span className="font-medium">{vehicle.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Year</span>
            <span className="font-medium">{vehicle.year}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Seats</span>
            <span className="font-medium">{vehicle.seats}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transmission</span>
            <span className="font-medium">{vehicle.transmission}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fuel type</span>
            <span className="font-medium">{vehicle.fuel}</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 gap-2">
          {vehicle.features.length > 0 ? (
            vehicle.features.map((feature, index) => (
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

