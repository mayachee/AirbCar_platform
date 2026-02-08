export default function PickupLocation({ vehicle }) {
  if (!vehicle) {
    return null
  }

  // Get address from various possible field names
  const address = vehicle.fullAddress || vehicle.address || vehicle.location || 'Location will be provided after booking'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">Pickup & return location</h3>
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <p className="font-medium text-white">{address}</p>
          <p className="text-sm text-gray-400 mt-1">
            Exact location will be provided after booking confirmation
          </p>
        </div>
      </div>
    </div>
  )
}

