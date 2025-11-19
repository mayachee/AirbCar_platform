'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function ListingCard({ listing, index = 0 }) {
  const pictures = Array.isArray(listing.pictures) ? listing.pictures : []
  const coverImage = pictures.find(
    pic => pic && typeof pic === 'string' && pic.trim().length > 0 && (pic.startsWith('http://') || pic.startsWith('https://'))
  )?.trim() || null
  
  const sanitizedLocation = listing.location?.trim()
  
  let formattedPrice = '—'
  if (listing.price_per_day) {
    const price = typeof listing.price_per_day === 'number' 
      ? listing.price_per_day 
      : parseFloat(String(listing.price_per_day))
    if (!isNaN(price) && isFinite(price)) {
      formattedPrice = `€${price.toFixed(2)}`
    }
  }

  return (
    <motion.article
      className="overflow-hidden rounded-3xl border border-neutral-200/60 bg-white shadow-sm backdrop-blur-sm"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        default: { delay: index * 0.08, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
        hover: { type: 'spring', stiffness: 400, damping: 20 }
      }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <motion.div
        className="relative h-52 w-full bg-neutral-100 overflow-hidden"
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim() || 'Vehicle image'}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={false}
            unoptimized={coverImage.includes('supabase.co')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400 bg-gradient-to-br from-neutral-100 to-neutral-50">
            <div className="text-center">
              <motion.div
                className="text-4xl mb-2 font-semibold"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 500 }}
              >
                {listing.make?.[0]?.toUpperCase() || '?'}
              </motion.div>
              <div className="text-xs">No image available</div>
            </div>
          </div>
        )}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      <div className="space-y-3 p-5">
        <div>
          <motion.h3
            className="text-lg font-semibold text-neutral-900"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {listing.year} {listing.make} {listing.model}
          </motion.h3>
          {sanitizedLocation && (
            <motion.p
              className="text-sm text-neutral-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              {sanitizedLocation}
            </motion.p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-600">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-lg font-semibold text-neutral-900">
              {formattedPrice}
            </span>{' '}
            / day
          </motion.span>
          <motion.span
            className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.25, stiffness: 500 }}
          >
            Rating: {listing.rating ?? '–'}
          </motion.span>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={`/car/${listing.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
          >
            <span>View details</span>
            <motion.svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </Link>
        </motion.div>
      </div>
    </motion.article>
  )
}
