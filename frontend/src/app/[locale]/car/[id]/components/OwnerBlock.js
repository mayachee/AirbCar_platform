'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BadgeCheck, Quote, ArrowRight } from 'lucide-react'
import VerifiedBadge from '@/components/partner/VerifiedBadge'

export default function OwnerBlock({ partner }) {
  const t = useTranslations('car_details')
  const params = useParams()
  const locale = params?.locale || 'en'
  if (!partner) return null

  const ownerName =
    partner?.business_name ||
    partner?.businessName ||
    [partner?.user?.first_name, partner?.user?.last_name].filter(Boolean).join(' ') ||
    'Partner'
  const fleetSize = partner?.listing_count || partner?.listings?.length || partner?.vehicles?.length || 0
  const expYears = partner?.experience_years || null
  const responseTime = partner?.response_time || null
  const description = partner?.description || partner?.bio || t('host_quote_default')
  const avatarUrl =
    partner?.logo_url ||
    partner?.user?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ownerName)}`

  const partnerSlug = partner?.slug || partner?.id
  const profileHref = partnerSlug ? `/${locale}/partner/${partnerSlug}` : null

  const stats = [
    expYears && { label: t('experience'), value: `${expYears}+ ${t('years')}` },
    fleetSize > 0 && {
      label: t('fleet_size'),
      value: `${fleetSize} ${fleetSize === 1 ? t('vehicle_in_fleet') : t('vehicles_in_fleet')}`,
    },
    responseTime && { label: t('response_time'), value: responseTime },
  ].filter(Boolean)

  return (
    <section className="bg-[var(--surface-1)] rounded-2xl p-6 md:p-8 border border-[var(--surface-3)]">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        <div className="relative shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
            <img
              alt={ownerName}
              src={avatarUrl}
              className="w-full h-full object-cover"
            />
          </div>
          {partner?.is_verified && (
            <span className="absolute -bottom-2 -right-2 bg-[var(--color-kc-primary)] text-white p-1.5 rounded-lg shadow-lg">
              <BadgeCheck className="w-4 h-4" />
            </span>
          )}
        </div>

        <div className="flex-grow text-center md:text-left min-w-0 w-full">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--color-kc-primary)] uppercase tracking-widest mb-1">
                {t('hosted_by')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] truncate">
                  {ownerName}
                </h3>
                <VerifiedBadge verified={partner?.is_verified} />
              </div>
            </div>

            {profileHref && (
              <Link
                href={profileHref}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-[var(--color-kc-primary)] border border-[var(--color-kc-primary)]/30 hover:bg-[var(--color-kc-primary)] hover:text-white hover:border-[var(--color-kc-primary)] transition-colors self-center md:self-start"
              >
                {t('view_profile')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="relative mt-4">
            <Quote
              aria-hidden
              className="hidden md:block absolute -top-3 -left-5 w-9 h-9 text-[var(--surface-3)] -z-0"
            />
            <p className="relative text-[var(--text-secondary)] italic leading-relaxed text-base md:text-lg z-10">
              {description}
            </p>
          </div>

          {stats.length > 0 && (
            <div className="mt-5 md:mt-6 flex flex-wrap justify-center md:justify-start items-stretch gap-x-6 gap-y-3">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="hidden md:block w-px h-8 bg-[var(--surface-3)] mr-6"
                    />
                  )}
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                      {s.label}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {s.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
