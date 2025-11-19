export default function Restrictions({ vehicle }) {
  if (!vehicle) {
    return null
  }

  // Safely get restrictions array
  const restrictions = Array.isArray(vehicle.restrictions) 
    ? vehicle.restrictions 
    : []

  // Default restrictions if none provided
  const defaultRestrictions = [
    'Minimum age: 21 years',
    'Valid driver\'s license required',
    'Credit card required for deposit',
    'No smoking in the vehicle',
    'Return vehicle with same fuel level'
  ]

  const displayRestrictions = restrictions.length > 0 ? restrictions : defaultRestrictions

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Car rules & restrictions</h3>
      <div className="space-y-2">
        {displayRestrictions.map((restriction, index) => (
          <div key={index} className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-gray-700">{restriction}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

