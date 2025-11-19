'use client'

import { motion } from 'framer-motion'

export default function TrustBadge({ icon, title, description }) {
  return (
    <motion.div
      className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="flex-shrink-0 rounded-lg bg-white p-2 text-orange-600 shadow-sm"
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      </div>
    </motion.div>
  )
}
