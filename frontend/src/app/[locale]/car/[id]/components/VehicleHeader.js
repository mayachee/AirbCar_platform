'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star, MapPin, Heart, Share } from 'lucide-react'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { useToast } from '@/contexts/ToastContext'

export default function VehicleHeader({ vehicle }) {
  const t = useTranslations('car_details')
  const { isFavorite, toggleFavorite } = useFavoritesContext()
  const { showToast } = useToast()

  const vehicleId = vehicle?.id || vehicle?.listing_id
  const saved = vehicleId ? isFavorite(vehicleId) : false

  const title = useMemo(
    () => vehicle?.name || [vehicle?.brand, vehicle?.model].filter(Boolean).join(' '),
    [vehicle]
  )

  const rating = Number(vehicle?.rating) || 0
  const reviewCount = Number(vehicle?.reviewCount ?? vehicle?.review_count) || 0
  const totalTrips = Number(vehicle?.totalTrips ?? vehicle?.total_trips) || 0
  const location = vehicle?.location || vehicle?.city || ''

  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const url = typeof window !== 'undefined' ? window.location.href : ''
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        showToast(t('link_copied'), 'success')
      }
    } catch {
      // user cancelled or API unavailable
    } finally {
      setSharing(false)
    }
  }

  const handleSave = () => {
    if (!vehicleId) return
    toggleFavorite(vehicleId)
  }

  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tight truncate">
            {title}
          </h1>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-primary)] flex-wrap">
            {rating > 0 && (
              <>
                <Star className="w-4 h-4 fill-[var(--text-primary)] text-[var(--text-primary)]" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <>
                    <span className="text-[var(--text-secondary)]">·</span>
                    <span className="text-[var(--text-secondary)] underline">
                      {reviewCount} {t('reviews').toLowerCase()}
                    </span>
                  </>
                )}
                <span className="text-[var(--text-secondary)]">·</span>
              </>
            )}

            {totalTrips > 0 && (
              <>
                <span className="text-[var(--text-secondary)]">{totalTrips} {t('trips')}</span>
                <span className="text-[var(--text-secondary)]">·</span>
              </>
            )}

            {location && (
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <MapPin className="w-3.5 h-3.5" />
                <span className="underline">{location}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label={t('share')}
          >
            <Share className="w-4 h-4" />
            <span className="hidden sm:inline underline">{t('share')}</span>
          </button>

          {vehicleId && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
              aria-pressed={saved}
              aria-label={saved ? t('saved') : t('save')}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  saved ? 'fill-[var(--color-kc-primary)] text-[var(--color-kc-primary)]' : ''
                }`}
              />
              <span className="hidden sm:inline underline">
                {saved ? t('saved') : t('save')}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
