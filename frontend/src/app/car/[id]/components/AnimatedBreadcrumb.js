'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AnimatedBreadcrumb({ vehicleName }) {
  return (
    <motion.nav
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link 
          href="/" 
          className="hover:text-orange-600 transition-colors"
        >
          Home
        </Link>
        <span>/</span>
        <Link 
          href="/search" 
          className="hover:text-orange-600 transition-colors"
        >
          Search
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {vehicleName || 'Vehicle Details'}
        </span>
      </div>
    </motion.nav>
  )
}

