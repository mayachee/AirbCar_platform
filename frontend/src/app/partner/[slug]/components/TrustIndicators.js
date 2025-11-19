'use client'

import { motion } from 'framer-motion'
import TrustBadge from './TrustBadge'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function TrustIndicators({ companyName }) {
  return (
    <motion.section
      className="mt-12 rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-amber-50/80 p-8 shadow-sm backdrop-blur-sm"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      <motion.h2
        className="text-xl font-semibold text-neutral-900 mb-6"
        variants={itemVariants}
      >
        Why book with {companyName}?
      </motion.h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <TrustBadge
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Verified Partner"
            description="Fully verified and trusted"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TrustBadge
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Transparent Pricing"
            description="No hidden fees"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TrustBadge
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="24/7 Support"
            description="Always here to help"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TrustBadge
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
            title="Flexible Cancellation"
            description="Free cancellation up to 24h"
          />
        </motion.div>
      </div>
    </motion.section>
  )
}
