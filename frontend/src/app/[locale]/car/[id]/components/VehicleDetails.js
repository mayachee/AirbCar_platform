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
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
        <span className="w-1.5 h-8 bg-[var(--color-kc-primary)] rounded-full" />
        {t('vehicle_specifications')}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {specs.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-[var(--surface-3)] bg-[var(--surface-1)]"
          >
            <Icon className="w-5 h-5 text-[var(--color-kc-primary)]" strokeWidth={1.75} />
            <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase">
              {label}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] capitalize truncate w-full">
              {value}
            </p>
          </div>
        ))}
      </div>

      {features.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-[var(--color-kc-primary)] rounded-full" />
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
