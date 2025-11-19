'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function OwnerSpotlight({ partner }) {
  const companyName = partner?.company_name || 'Partner'
  const ownerName =
    [partner?.user?.first_name, partner?.user?.last_name]
      .filter(Boolean)
      .join(' ') || companyName
  const ownerInitials = companyName[0]?.toUpperCase() || ownerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  
  const ownerImage = partner?.logo || partner?.user?.profile_picture || null
  const memberSince = partner?.created_at
    ? new Date(partner.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : partner?.user?.date_joined 
    ? new Date(partner.user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  const isVerified = partner?.verification_status === 'approved' || partner?.verification_status === 'verified'
  
  const totalListings = partner?.total_listings || partner?.listings?.length || 0
  const averageRating = partner?.average_rating 
    ? (typeof partner.average_rating === 'number' ? partner.average_rating.toFixed(1) : parseFloat(partner.average_rating).toFixed(1))
    : null
  // Get total_bookings from backend API response
  const totalBookings = partner?.total_bookings ?? 0
  
  // Debug log to verify backend connection
  if (process.env.NODE_ENV === 'development') {
    console.log('[OwnerSpotlight] Partner data:', {
      total_bookings: partner?.total_bookings,
      total_listings: partner?.total_listings,
      average_rating: partner?.average_rating,
    })
  }

  return (
    <motion.section
      className="rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-white via-white to-orange-50/20 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with icon */}
      <motion.div className="mb-6 flex items-center gap-3" variants={itemVariants}>
        <motion.div
          className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 shadow-lg"
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </motion.div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Meet the owner
        </h2>
      </motion.div>

      {/* Profile Section */}
      <motion.div className="flex items-start gap-4 sm:gap-5" variants={itemVariants}>
        <motion.div
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-2 border-orange-200/80 bg-gradient-to-br from-orange-100 to-orange-50 shadow-md">
            {ownerImage ? (
              <Image
                src={ownerImage}
                alt={companyName}
                fill
                className="object-cover"
                sizes="96px"
                unoptimized={ownerImage.includes('supabase.co')}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-orange-600">
                {ownerInitials}
              </div>
            )}
          </div>
          {isVerified && (
            <Tooltip.Provider delayDuration={300}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <motion.div
                    className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 shadow-lg cursor-pointer z-10"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4, stiffness: 500 }}
                  >
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-xl z-50"
                    sideOffset={5}
                  >
                    Verified Partner
                    <Tooltip.Arrow className="fill-neutral-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <motion.h3
                className="text-lg sm:text-xl font-bold text-neutral-900"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {companyName}
              </motion.h3>
            </div>
            {isVerified && (
              <motion.span
                className="flex-shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 0.3, stiffness: 500 }}
              >
                Verified
              </motion.span>
            )}
          </div>
          
          {partner?.business_type && (
            <motion.div
              className="mt-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <span className="inline-flex items-center rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                {partner.business_type}
              </span>
            </motion.div>
          )}
          
          {memberSince && (
            <motion.div
              className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Member since {memberSince}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Description */}
      {partner?.description && (
        <motion.div
          className="mt-5 rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-orange-100/60"
          variants={itemVariants}
        >
          <p className="text-sm leading-relaxed text-neutral-700">
            {partner.description}
          </p>
        </motion.div>
      )}
      
      {/* Contact Information */}
      <motion.div className="mt-5 space-y-2.5 border-t border-neutral-200/60 pt-5" variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Contact Information
          </h4>
          {totalListings > 0 && (
            <motion.div
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-100 to-orange-50 px-2.5 py-1 border border-orange-200/60"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5, stiffness: 500 }}
            >
              <svg className="h-3.5 w-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <span className="text-xs font-bold text-orange-700">{totalListings} Cars</span>
            </motion.div>
          )}
        </div>
        {partner?.phone && (
          <motion.a
            href={`tel:${partner.phone}`}
            className="flex items-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-orange-50 hover:text-orange-600 border border-neutral-200/60 hover:border-orange-200 hover:shadow-sm"
            whileHover={{ x: 3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="flex-shrink-0 rounded-lg bg-orange-100 p-1.5">
              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className="flex-1">{partner.phone}</span>
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.a>
        )}
        {partner?.user?.email && (
          <motion.a
            href={`mailto:${partner.user.email}`}
            className="flex items-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-orange-50 hover:text-orange-600 border border-neutral-200/60 hover:border-orange-200 hover:shadow-sm"
            whileHover={{ x: 3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="flex-shrink-0 rounded-lg bg-orange-100 p-1.5">
              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="flex-1 truncate">{partner.user.email}</span>
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.a>
        )}
        {partner?.website && (
          <motion.a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-orange-50 hover:text-orange-600 border border-neutral-200/60 hover:border-orange-200 hover:shadow-sm"
            whileHover={{ x: 3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="flex-shrink-0 rounded-lg bg-orange-100 p-1.5">
              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <span className="flex-1 truncate">Visit website</span>
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </motion.a>
        )}
      </motion.div>
      
      {/* Statistics Grid */}
      {(totalListings > 0 || averageRating || totalBookings >= 0) && (
        <motion.div
          className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-neutral-200/60 pt-5"
          variants={itemVariants}
        >
          {totalListings > 0 && (
            <motion.div
              className="group rounded-xl bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/60 p-4 border border-orange-200/60 transition-all hover:shadow-md"
              whileHover={{ scale: 1.03, y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-orange-200/80 p-1.5">
                  <svg className="h-4 w-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wide">Vehicles</span>
              </div>
              <motion.p
                className="text-2xl font-bold text-orange-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.6, stiffness: 500 }}
              >
                {totalListings}
              </motion.p>
              <p className="text-xs text-orange-700 mt-1">Available now</p>
            </motion.div>
          )}
          <motion.div
            className="group rounded-xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-100/60 p-4 border border-blue-200/60 transition-all hover:shadow-md"
            whileHover={{ scale: 1.03, y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-blue-200/80 p-1.5">
                <svg className="h-4 w-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Bookings</span>
            </div>
            <motion.p
              className="text-2xl font-bold text-blue-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.65, stiffness: 500 }}
            >
              {totalBookings}
            </motion.p>
            <p className="text-xs text-blue-700 mt-1">Total bookings</p>
          </motion.div>
          {averageRating && (
            <motion.div
              className="group rounded-xl bg-gradient-to-br from-yellow-50 via-amber-50/80 to-yellow-100/60 p-4 border border-yellow-200/60 transition-all hover:shadow-md"
              whileHover={{ scale: 1.03, y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-yellow-200/80 p-1.5">
                  <svg className="h-4 w-4 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Rating</span>
              </div>
              <div className="flex items-baseline gap-1">
                <motion.p
                  className="text-2xl font-bold text-yellow-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.7, stiffness: 500 }}
                >
                  {averageRating}
                </motion.p>
                <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-xs text-yellow-700 mt-1">Customer reviews</p>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Location Info */}
      {(partner?.city || partner?.address) && (
        <motion.div
          className="mt-5 rounded-xl bg-white/60 backdrop-blur-sm border border-orange-100/60 p-3"
          variants={itemVariants}
        >
          <div className="flex items-start gap-2.5 text-sm text-neutral-700">
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <span className="font-medium">{partner.city}</span>
              {partner.address && (
                <span className="text-neutral-600">, {partner.address}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  )
}
