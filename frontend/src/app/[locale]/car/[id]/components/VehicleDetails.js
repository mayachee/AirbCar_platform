import { useTranslations } from 'next-intl'
import { Settings, Users, Fuel, Briefcase, Gauge } from 'lucide-react'

export default function VehicleDetails({ vehicle }) {
  const t = useTranslations('car_details')
  if (!vehicle) return null

  const features = Array.isArray(vehicle.features) ? vehicle.features : []
  const fuelType = vehicle.fuelType || vehicle.fuel_type || vehicle.fuel || '—'
  const transmission = vehicle.transmission || '—'
  const seatsRaw = vehicle.seats || vehicle.seating_capacity
  const seats = seatsRaw ? String(seatsRaw).replace(/\s*seats?$/i, '') : null
  const luggage = vehicle.luggage_capacity || vehicle.luggageCapacity
  const rangeKm = vehicle.range_km

  const specs = [
    { icon: Settings, label: t('transmission'), value: transmission },
    { icon: Users, label: t('seats'), value: seats ? `${seats}` : '—' },
    { icon: Fuel, label: t('fuel_type'), value: fuelType },
    { icon: Briefcase, label: t('luggage'), value: luggage || '—' },
    { icon: Gauge, label: t('range'), value: rangeKm ? `${rangeKm} km` : t('unlimited') },
  ]

  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('vehicle_specifications')}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {specs.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-2 p-4 rounded-xl border border-[var(--surface-3)] bg-white"
          >
            <Icon className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.75} />
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{label}</p>
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {features.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            {t('features')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <span
                key={index}
                className="text-sm text-[var(--text-primary)] border border-[var(--surface-3)] px-3 py-1.5 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
