'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, TrendingUp, Sparkles } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackButton from './BackButton'
import OwnerSpotlight from './components/OwnerSpotlight'
import FleetSection from './components/FleetSection'
import { fetchPartnerProfile } from './api'
import { computeFleetInsights } from './utils'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export default function PartnerPublicProfilePage() {
  const params = useParams()
  const [partner, setPartner] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPartner = async () => {
      try {
        setLoading(true)
        const slug = params.slug
        if (!slug) {
          setError('Partner not found')
          return
        }

        const partnerData = await fetchPartnerProfile(slug)
        
        if (!partnerData) {
          setError('Partner not found')
          return
        }
        
        // Handle nested data structure
        const actualPartner = partnerData?.data || partnerData
        const partnerListings = actualPartner?.listings || actualPartner?.vehicles || []
        
        setPartner(actualPartner)
        setListings(partnerListings)
        
        // Update page title
        const companyName = actualPartner?.business_name || actualPartner?.company_name || actualPartner?.companyName || 'Partner'
        document.title = `${companyName} | AirbCar Partner`
      } catch (err) {
        console.error('Error loading partner:', err)
        setError(err.message || 'Failed to load partner')
      } finally {
        setLoading(false)
      }
    }

    loadPartner()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Loading partner profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The partner you are looking for does not exist.'}</p>
            <BackButton />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const { minPrice, maxRating, locationCount } = computeFleetInsights(listings)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      {/* Hero Background with Pattern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent_50%)]"></div>
        
        <main className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <BackButton />
            </motion.div>

            {/* Owner Spotlight */}
            <motion.div variants={itemVariants}>
              <OwnerSpotlight partner={partner} />
            </motion.div>

            {/* Stats Cards */}
            {listings.length > 0 && (
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {minPrice && (
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Starting from</p>
                        <p className="text-2xl font-bold text-gray-900">{minPrice} MAD/day</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {maxRating > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{maxRating.toFixed(1)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {locationCount > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Locations</p>
                        <p className="text-2xl font-bold text-gray-900">{locationCount}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Fleet Section */}
            <motion.div variants={itemVariants}>
              <FleetSection listings={listings} />
            </motion.div>
          </motion.div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}
