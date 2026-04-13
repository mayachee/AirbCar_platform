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
  const fuelType = vehicle.fuelType || vehicle.fuel_type || vehicle.fuel || 'Petrol'
  
  // Get transmission
  const transmission = vehicle.transmission || 'Automatic'
  
  // Get seats
  const seats = vehicle.seats || vehicle.seating_capacity || '4 Seats'
  
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-[#121c2a]">
        <span className="w-1.5 h-8 bg-[#9d4300] rounded-full"></span>
        Technical Specifications
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[#121c2a]">
        {/* Drive */}
        <div className="bg-[#eff3ff] p-4 rounded-xl text-center border border-[#dee9fd]">
          <Settings className="w-6 h-6 text-[#9d4300] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[#545f73] tracking-widest uppercase mb-1">Drive</p>
          <p className="font-bold text-sm capitalize">{transmission}</p>
        </div>

        {/* Capacity */}
        <div className="bg-[#eff3ff] p-4 rounded-xl text-center border border-[#dee9fd]">
          <Users className="w-6 h-6 text-[#9d4300] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[#545f73] tracking-widest uppercase mb-1">Capacity</p>
          <p className="font-bold text-sm capitalize">{seats.toString().includes('Seat') ? seats : `${seats} Seats`}</p>
        </div>

        {/* Fuel */}
        <div className="bg-[#eff3ff] p-4 rounded-xl text-center border border-[#dee9fd]">
          <Fuel className="w-6 h-6 text-[#9d4300] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[#545f73] tracking-widest uppercase mb-1">Fuel</p>
          <p className="font-bold text-sm capitalize">{fuelType}</p>
        </div>

        {/* Storage */}
        <div className="bg-[#eff3ff] p-4 rounded-xl text-center border border-[#dee9fd]">
          <Briefcase className="w-6 h-6 text-[#9d4300] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[#545f73] tracking-widest uppercase mb-1">Storage</p>
          <p className="font-bold text-sm capitalize">{vehicle.luggage_capacity || vehicle.luggageCapacity || '2 Large Bags'}</p>
        </div>

        {/* Range */}
        <div className="bg-[#eff3ff] p-4 rounded-xl text-center border border-[#dee9fd]">
          <MapPin className="w-6 h-6 text-[#9d4300] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[#545f73] tracking-widest uppercase mb-1">Range</p>
          <p className="font-bold text-sm capitalize">{vehicle.range_km ? `${vehicle.range_km} km` : 'Unlimited'}</p>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-[#121c2a]">
            <span className="w-1.5 h-8 bg-[#9d4300] rounded-full"></span>
            {t('features')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-[10px] font-bold uppercase tracking-wider text-[#9d4300] bg-[#fff] border border-[#dee9fd] px-4 py-2 rounded-full"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}


