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
        <div className="w-1.5 h-6 bg-[#ea580c] rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-900">Technical Specifications</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Drive */}
        <div className="bg-orange-50/50 rounded-full px-4 py-3 flex flex-col items-center justify-center text-center shadow-sm border border-orange-100 hover:shadow-md transition-all">
          <Settings className="text-[#ea580c] w-6 h-6 mb-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            DRIVE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {transmission}
          </span>
        </div>

        {/* Capacity */}
        <div className="bg-orange-50/50 rounded-full px-4 py-3 flex flex-col items-center justify-center text-center shadow-sm border border-orange-100 hover:shadow-md transition-all">
          <Users className="text-[#ea580c] w-6 h-6 mb-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            CAPACITY
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {seats} Persons
          </span>
        </div>

        {/* Fuel */}
        <div className="bg-orange-50/50 rounded-full px-4 py-3 flex flex-col items-center justify-center text-center shadow-sm border border-orange-100 hover:shadow-md transition-all">
          <Fuel className="text-[#ea580c] w-6 h-6 mb-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            FUEL
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {fuelType}
          </span>
        </div>

        {/* Storage */}
        <div className="bg-orange-50/50 rounded-full px-4 py-3 flex flex-col items-center justify-center text-center shadow-sm border border-orange-100 hover:shadow-md transition-all">
          <Briefcase className="text-[#ea580c] w-6 h-6 mb-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            STORAGE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {vehicle.luggage_capacity || vehicle.luggageCapacity || '2 Bags'}
          </span>
        </div>

        {/* Range */}
        <div className="bg-orange-50/50 rounded-full px-4 py-3 flex flex-col items-center justify-center text-center shadow-sm border border-orange-100 hover:shadow-md transition-all col-span-2 md:col-span-1">
          <MapPin className="text-[#ea580c] w-6 h-6 mb-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            RANGE
          </span>
          <span className="font-bold text-gray-900 text-sm capitalize">
            {vehicle.range_km || 'Unlimited'}
          </span>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#ea580c] rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('features')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] bg-orange-50 border border-orange-100 px-4 py-2 rounded-full"
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


