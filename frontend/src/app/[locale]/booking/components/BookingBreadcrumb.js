'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'

export default function BookingBreadcrumb({ vehicleName, carId }) {
  return (
    <motion.nav
      className="mb-6 relative z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
    >
      {/* Mobile View: Simple Back Button */}
      <div className="flex md:hidden items-center">
        {carId ? (
           <Link 
            href={`/car/${carId}`} 
            className="flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate max-w-[250px]">Back to {vehicleName || 'Vehicle'}</span>
          </Link>
        ) : (
           <Link 
            href="/search" 
            className="flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
            Back to Search
          </Link>
        )}
      </div>

      {/* Desktop View: Full Breadcrumb */}
      <ol className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-orange-400 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        <li>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </li>
        <li>
          <Link href="/search" className="hover:text-orange-400 transition-colors">
            Search
          </Link>
        </li>
        {carId && (
          <>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </li>
            <li>
              <Link href={`/car/${carId}`} className="hover:text-orange-400 transition-colors truncate max-w-[150px] sm:max-w-xs block">
                {vehicleName || 'Vehicle'}
              </Link>
            </li>
          </>
        )}
        <li>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </li>
        <li 
          className="text-white font-medium" 
        >
          Booking
        </li>
      </ol>
    </motion.nav>
  )
}
