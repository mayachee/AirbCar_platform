'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, Share, Star, MapPin, Maximize2, Images } from 'lucide-react'
import { getAllVehicleImages } from '@/utils/imageUtils'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { useToast } from '@/contexts/ToastContext'

export default function ImageGallery({ vehicle, onShowFullGallery, onSelectImage }) {
  const t = useTranslations('car_details')
  const { isFavorite, toggleFavorite } = useFavoritesContext()
  const { showToast } = useToast()
  const [sharing, setSharing] = useState(false)

  const images = getAllVehicleImages(vehicle)
  const count = images.length
  const hero = images[0] || '/carsymbol.jpg'
  const stripThumbs = images.slice(1, 4)
  const remaining = Math.max(0, count - 4)

  const vehicleId = vehicle?.id || vehicle?.listing_id
  const saved = vehicleId ? isFavorite(vehicleId) : false

  const title = useMemo(
    () => vehicle?.name || [vehicle?.brand, vehicle?.model].filter(Boolean).join(' '),
    [vehicle]
  )
  const rating = Number(vehicle?.rating) || 0
  const reviewCount = Number(vehicle?.reviewCount ?? vehicle?.review_count) || 0
  const location = vehicle?.location || vehicle?.city || ''
  const isAvailable = vehicle?.is_available !== false && vehicle?.status !== 'unavailable'

  const openAt = (index) => {
    if (onSelectImage) onSelectImage(index)
    if (onShowFullGallery) onShowFullGallery()
  }

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
    <section className="relative rounded-3xl overflow-hidden shadow-2xl group">
      <button
        type="button"
        onClick={() => openAt(0)}
        className="relative block w-full h-[420px] md:h-[600px] lg:h-[680px] overflow-hidden"
        aria-label={t('view_all_photos')}
      >
        <img
          src={hero}
          alt={title || 'Vehicle'}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 45%)' }}
        />
      </button>

      {/* Floating Share/Save controls */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 z-10">
        <button
          type="button"
          onClick={handleShare}
          aria-label={t('share')}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-lg border border-white/40 text-[var(--text-primary)]"
        >
          <Share className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        </button>
        {vehicleId && (
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            aria-label={saved ? t('saved') : t('save')}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-lg border border-white/40 text-[var(--text-primary)]"
          >
            <Heart
              className={`w-4 h-4 md:w-[18px] md:h-[18px] transition-colors ${
                saved ? 'fill-[var(--color-kc-primary)] text-[var(--color-kc-primary)]' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Hero overlay text — title, location, rating */}
      <div className="absolute bottom-6 left-5 md:bottom-10 md:left-10 right-5 md:right-auto md:max-w-2xl pointer-events-none z-10">
        {isAvailable && (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('available_now')}
          </div>
        )}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 md:mb-4 drop-shadow-2xl">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/90 text-sm md:text-base">
          {location && (
            <span className="flex items-center gap-2 font-medium">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-kc-primary-container)]" />
              {location}
            </span>
          )}
          {location && rating > 0 && (
            <span aria-hidden className="hidden md:inline-block h-4 w-px bg-white/20" />
          )}
          {rating > 0 && (
            <span className="flex items-center gap-2 font-medium">
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-[var(--color-kc-primary-container)] text-[var(--color-kc-primary-container)]" />
              {rating.toFixed(1)}
              {reviewCount > 0 && (
                <span className="opacity-80">
                  ({reviewCount} {t('reviews').toLowerCase()})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail strip + fullscreen */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-3 items-center z-10">
        {stripThumbs.length > 0 && (
          <div className="hidden md:flex gap-2.5 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            {stripThumbs.map((src, i) => {
              const idx = i + 1
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openAt(idx) }}
                  className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                  aria-label={`${t('view_all_photos')} ${idx + 1}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              )
            })}
            {remaining > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openAt(4) }}
                className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden cursor-pointer group/more"
                aria-label={t('view_all_photos')}
              >
                <img
                  src={images[4] || hero}
                  alt=""
                  className="w-full h-full object-cover blur-[2px] opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/more:bg-black/20 transition-colors">
                  <span className="text-white font-black text-lg tracking-tighter">+{remaining}</span>
                </div>
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openAt(0) }}
          aria-label={t('view_all_photos')}
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-xl border border-white/40 text-[var(--text-primary)]"
        >
          <Maximize2 className="w-5 h-5 md:w-6 md:h-6 hidden md:block" />
          <Images className="w-5 h-5 md:hidden" />
        </button>
      </div>
    </section>
  )
}
