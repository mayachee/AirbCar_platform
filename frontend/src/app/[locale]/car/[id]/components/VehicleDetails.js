import { useTranslations } from 'next-intl'
import { Settings, Users, Fuel, Briefcase, MapPin } from 'lucide-react'

export default function VehicleDetails({ vehicle }) {
  const t = useTranslations('car_details')
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
  
  return (
    <div className="my-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-[#9a4b3d] rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-900">Technical Specifications</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Drive */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Settings className="text-[#a2513f] w-5 h-5 mb-2" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            DRIVE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {transmission}
          </span>
        </div>

        {/* Capacity */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Users className="text-[#a2513f] w-5 h-5 mb-2" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            CAPACITY
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {seats} Persons
          </span>
        </div>

        {/* Fuel */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Fuel className="text-[#a2513f] w-5 h-5 mb-2" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            FUEL
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {fuelType}
          </span>
        </div>

        {/* Storage */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Briefcase className="text-[#a2513f] w-5 h-5 mb-2" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            STORAGE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {vehicle.storage || '2 Bags'}
          </span>
        </div>

        {/* Range */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <MapPin className="text-[#a2513f] w-5 h-5 mb-2" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            RANGE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {vehicle.range || '350 Mi'}
          </span>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#9a4b3d] rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('features')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 border border-gray-200 px-3 py-2 rounded-full"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


