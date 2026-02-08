'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, Home, Car } from 'lucide-react'

export default function AnimatedBreadcrumb({ partnerName }) {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const carId = searchParams.get('carId')

  return (
    <motion.nav
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-24 relative z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-400">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-orange-400 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        {from === 'car' && carId ? (
          <>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </li>
            <li>
              <Link 
                href={`/car/${carId}`}
                className="flex items-center hover:text-orange-400 transition-colors"
              >
                <Car className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Vehicle</span>
                <span className="sm:hidden">Car</span>
              </Link>
            </li>
          </>
        ) : null}

        <li>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </li>
        <li>
          <span className="text-gray-400">Partner</span>
        </li>
        <li>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </li>
        <li 
          className="text-white font-medium truncate max-w-[150px] sm:max-w-md" 
          title={partnerName}
        >
          {partnerName || 'Partner Profile'}
        </li>
      </ol>
    </motion.nav>
  )
}
