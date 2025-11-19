'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import ListingCard from './ListingCard'
import EmptyListingsState from './EmptyListingsState'

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

export default function FleetSection({ listings }) {
  return (
    <motion.section
      className="mt-12 space-y-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Fleet highlights
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Explore popular vehicles available from this partner.
          </p>
        </div>
        <motion.div
          className="flex flex-wrap items-center gap-3"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200/60 bg-white/80 backdrop-blur-sm px-5 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search all vehicles
          </Link>
        </motion.div>
      </motion.div>

      {listings?.length ? (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
        >
          {listings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} index={index} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <EmptyListingsState />
        </motion.div>
      )}
    </motion.section>
  )
}
