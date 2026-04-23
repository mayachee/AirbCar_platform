import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'

export default function PickupLocation({ vehicle }) {
  const t = useTranslations('car_details')
  if (!vehicle) return null

  const address =
    vehicle.fullAddress ||
    vehicle.address ||
    vehicle.location ||
    t('location_provided_after_booking')

  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('pickup_return_location')}
      </h2>
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[var(--text-secondary)]" strokeWidth={1.75} />
        <div>
          <p className="text-[var(--text-primary)]">{address}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t('exact_location_provided_after_booking')}
          </p>
        </div>
      </div>
    </section>
  )
}
