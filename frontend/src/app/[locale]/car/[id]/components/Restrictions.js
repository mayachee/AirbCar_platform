import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

export default function Restrictions({ vehicle }) {
  const t = useTranslations('car_details')
  if (!vehicle) return null

  const restrictions = Array.isArray(vehicle.restrictions) ? vehicle.restrictions : []

  const defaultRestrictions = [
    t('min_age_default'),
    t('valid_license_required'),
    t('credit_card_required_deposit'),
    t('no_smoking'),
    t('return_same_fuel'),
  ]

  const displayRestrictions = restrictions.length > 0 ? restrictions : defaultRestrictions

  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('car_rules_restrictions')}
      </h2>

      <ul className="space-y-2.5">
        {displayRestrictions.map((restriction, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-[var(--text-primary)]"
          >
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-secondary)]" strokeWidth={2} />
            <span>{restriction}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
