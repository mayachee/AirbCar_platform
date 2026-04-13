'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

import { useTranslations } from 'next-intl'

export default function AnimatedBreadcrumb({ vehicleName }) {
  const t = useTranslations('car_details')
  return (
    <motion.nav
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-24 relative z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-orange-500 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        <li>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </li>
        <li>
          <Link href="/search" className="hover:text-orange-500 transition-colors">
            Search
          </Link>
        </li>
        <li>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </li>
        <li 
          className="text-gray-900 font-semibold truncate max-w-[150px] sm:max-w-md" 
          title={vehicleName}
        >
          {vehicleName || 'Vehicle Details'}
        </li>
      </ol>
    </motion.nav>
  )
}

