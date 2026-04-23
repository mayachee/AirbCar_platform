'use client'

import { useTranslations } from 'next-intl'
import { Images } from 'lucide-react'
import { getAllVehicleImages } from '@/utils/imageUtils'

export default function ImageGallery({ vehicle, onShowFullGallery, onSelectImage }) {
  const t = useTranslations('car_details')
  const images = getAllVehicleImages(vehicle)
  const count = images.length

  const openAt = (index) => {
    if (onSelectImage) onSelectImage(index)
    if (onShowFullGallery) onShowFullGallery()
  }

  const hero = images[0] || '/carsymbol.jpg'
  const side = [images[1], images[2], images[3], images[4]]

  return (
    <section className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden h-[320px] md:h-[420px] lg:h-[460px]">
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={t('view_all_photos')}
          className="relative h-full overflow-hidden group bg-[var(--surface-2)]"
        >
          <img
            src={hero}
            alt={vehicle?.name || 'Vehicle'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </button>

        <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {side.map((img, i) => {
            const src = img || hero
            return (
              <button
                key={i}
                type="button"
                onClick={() => openAt(Math.min(i + 1, count - 1))}
                aria-label={t('view_all_photos')}
                className="relative overflow-hidden group bg-[var(--surface-2)]"
              >
                <img
                  src={src}
                  alt={`${vehicle?.name || 'Vehicle'} ${i + 2}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>
            )
          })}
        </div>
      </div>

      {count > 1 && (
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-[var(--text-primary)] px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg border border-[var(--surface-3)] transition-shadow"
        >
          <Images className="w-4 h-4" />
          <span>{t('view_all_photos')}</span>
          <span className="text-[var(--text-secondary)] font-medium">· {count}</span>
        </button>
      )}
    </section>
  )
}
