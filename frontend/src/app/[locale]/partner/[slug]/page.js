'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, TrendingUp, Sparkles, Calendar, Phone, Mail, Car, Award } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackButton from './BackButton'
import AnimatedBreadcrumb from './components/AnimatedBreadcrumb'
import OwnerSpotlight from './components/OwnerSpotlight'
import FleetSection from './components/FleetSection'
import { fetchPartnerProfile } from './api'
import { computeFleetInsights } from './utils'
import { useCurrency } from '@/contexts/CurrencyContext'

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
  const { formatPrice } = useCurrency()
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
      <div className="min-h-screen bg-[#0F172A]">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="w-16 h-16 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500"></div>
            </div>
            <p className="text-gray-400 font-medium animate-pulse">Loading partner profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 p-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Partner Not Found</h2>
              <p className="text-gray-400 mb-6">{error || 'The partner you are looking for does not exist.'}</p>
              <BackButton />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const { minPrice, maxRating, locationCount } = computeFleetInsights(listings)
  
  // Extract partner data for display
  const partnerData = partner?.data || partner || {}
  const companyName = partnerData?.business_name || partnerData?.company_name || partnerData?.companyName || 'Partner'
  const description = partnerData?.description || partnerData?.bio
  const location = partnerData?.location || partnerData?.city || partnerData?.user?.city
  const phone = partnerData?.phone || partnerData?.phone_number || partnerData?.user?.phone_number
  const email = partnerData?.email || partnerData?.user?.email
  const totalBookings = partnerData?.total_bookings || 0
  const totalEarnings = partnerData?.total_earnings || 0
  const reviewCount = partnerData?.review_count || 0
  const rating = partnerData?.rating || 0

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <AnimatedBreadcrumb partnerName={companyName} />

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <BackButton />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Owner Spotlight (Header Card) */}
              <div className="lg:col-span-2">
                <motion.div variants={itemVariants}>
                  <OwnerSpotlight partner={partner} />
                </motion.div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-1 lg:row-span-2 space-y-6 h-fit">
                {/* Analytics/Stats Card */}
                <motion.div 
                  variants={itemVariants}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-4">Analytics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <Car className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="text-gray-300 font-medium">Total Bookings</span>
                      </div>
                      <span className="text-white font-bold">{totalBookings}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                        <span className="text-gray-300 font-medium">Rating</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold block">{rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">{reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Info Card */}
                <motion.div 
                  variants={itemVariants}
                  className="hidden sm:block bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-4">Contact Info</h2>
                  <div className="space-y-4">
                    {location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400 font-medium">Location</p>
                          <p className="text-white">{location}</p>
                        </div>
                      </div>
                    )}
                    
                    {phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400 font-medium">Phone</p>
                          <a href={`tel:${phone}`} className="text-orange-400 hover:text-orange-300 transition-colors">
                            {phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400 font-medium">Email</p>
                          <a href={`mailto:${email}`} className="text-orange-400 hover:text-orange-300 transition-colors break-all">
                            {email}
                          </a>
                        </div>
                      </div>
                    )}

                    {!location && !phone && !email && (
                      <p className="text-gray-500 italic text-sm">
                        No contact information available.
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Fleet Insights Card */}
                {listings.length > 0 && (
                  <motion.div 
                    variants={itemVariants}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 p-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Fleet Insights</h2>
                    <div className="space-y-4">
                      {minPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Starting Price</span>
                          <span className="text-white font-bold">{formatPrice(minPrice)}/day</span>
                        </div>
                      )}
                      {locationCount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Locations</span>
                          <span className="text-white font-bold">{locationCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Vehicles</span>
                        <span className="text-white font-bold">{listings.length}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Fleet Section */}
              <div className="lg:col-span-2">
                <motion.div variants={itemVariants}>
                  <FleetSection listings={listings} />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      
          {/* Smooth transition to footer */}
          <div className="h-24 bg-gradient-to-b from-[#0F172A]/20 to-[#0B0F19]" />
      <Footer />
    </div>
  )
}
