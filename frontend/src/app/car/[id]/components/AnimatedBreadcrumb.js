'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AnimatedBreadcrumb({ vehicleName }) {
  return (
    <motion.nav
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        <li>
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href="/search" className="hover:text-orange-600 transition-colors">
            Search
          </Link>
        </li>
        <li>/</li>
        <li className="text-gray-900 font-medium">{vehicleName || 'Vehicle Details'}</li>
      </ol>
    </motion.nav>
  )
}

