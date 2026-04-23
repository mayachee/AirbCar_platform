import React from 'react'
import { useTranslations } from 'next-intl'
import { BadgeCheck } from 'lucide-react'

export default function OwnerBlock({ partner }) {
  const t = useTranslations('car_details')
  if (!partner) return null

  const ownerName =
    partner?.business_name ||
    partner?.businessName ||
    [partner?.user?.first_name, partner?.user?.last_name].filter(Boolean).join(' ') ||
    'Partner'
  const fleetSize = partner?.listing_count || partner?.listings?.length || partner?.vehicles?.length || 0
  const expYears = partner?.experience_years || null
  const avatarUrl =
    partner?.logo_url ||
    partner?.user?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${ownerName}`
  const responseTime = partner?.response_time || null
  const description = partner?.description || partner?.bio || null

  const stats = [
    expYears && { label: t('experience'), value: `${expYears} ${t('years')}` },
    fleetSize > 0 && { label: t('fleet_size'), value: fleetSize },
    responseTime && { label: t('response_time'), value: responseTime },
  ].filter(Boolean)

  return (
    <section>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img
            alt={ownerName}
            src={avatarUrl}
            className="w-14 h-14 rounded-full object-cover border border-[var(--surface-3)]"
          />
          {partner?.is_verified && (
            <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
              <BadgeCheck className="w-4 h-4 text-[var(--color-kc-primary)]" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--text-secondary)]">{t('hosted_by')}</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {ownerName}
          </h3>

          {stats.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--text-secondary)]">
              {stats.map((s, i) => (
                <span key={i}>
                  <span className="text-[var(--text-primary)] font-medium">{s.value}</span>{' '}
                  {s.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">
          {description}
        </p>
      )}
    </section>
  )
}
