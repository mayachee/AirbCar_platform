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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--text-primary)]">
        <span className="w-1.5 h-8 bg-[var(--color-kc-primary)] rounded-full"></span>
        Technical Specifications
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[var(--text-primary)]">
        {/* Drive */}
        <div className="bg-[var(--surface-1)] p-4 rounded-xl text-center border border-[var(--surface-3)]">
          <Settings className="w-6 h-6 text-[var(--color-kc-primary)] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">Drive</p>
          <p className="font-bold text-sm capitalize">{transmission}</p>
        </div>

        {/* Capacity */}
        <div className="bg-[var(--surface-1)] p-4 rounded-xl text-center border border-[var(--surface-3)]">
          <Users className="w-6 h-6 text-[var(--color-kc-primary)] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">Capacity</p>
          <p className="font-bold text-sm capitalize">{seats.toString().includes('Seat') ? seats : `${seats} Seats`}</p>
        </div>

        {/* Fuel */}
        <div className="bg-[var(--surface-1)] p-4 rounded-xl text-center border border-[var(--surface-3)]">
          <Fuel className="w-6 h-6 text-[var(--color-kc-primary)] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">Fuel</p>
          <p className="font-bold text-sm capitalize">{fuelType}</p>
        </div>

        {/* Storage */}
        <div className="bg-[var(--surface-1)] p-4 rounded-xl text-center border border-[var(--surface-3)]">
          <Briefcase className="w-6 h-6 text-[var(--color-kc-primary)] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">Storage</p>
          <p className="font-bold text-sm capitalize">{vehicle.luggage_capacity || vehicle.luggageCapacity || '2 Large Bags'}</p>
        </div>

        {/* Range */}
        <div className="bg-[var(--surface-1)] p-4 rounded-xl text-center border border-[var(--surface-3)]">
          <MapPin className="w-6 h-6 text-[var(--color-kc-primary)] mx-auto mb-2" />
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">Range</p>
          <p className="font-bold text-sm capitalize">{vehicle.range_km ? `${vehicle.range_km} km` : 'Unlimited'}</p>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--text-primary)]">
            <span className="w-1.5 h-8 bg-[var(--color-kc-primary)] rounded-full"></span>
            {t('features')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-kc-primary)] bg-[#fff] border border-[var(--surface-3)] px-4 py-2 rounded-full"
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


