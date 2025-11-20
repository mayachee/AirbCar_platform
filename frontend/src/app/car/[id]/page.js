'use client'

import { useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useVehicleData } from './hooks/useVehicleData'
import { useSearchParams as useSearchParamsHook } from './hooks/useSearchParams'
import { buildBookingUrl, buildSearchUrl } from './utils/navigation'
import PageTransition from './components/PageTransition'
import AnimatedBreadcrumb from './components/AnimatedBreadcrumb'
import AnimatedSection from './components/AnimatedSection'
import SearchSummary from './components/SearchSummary'
import VehicleHeader from './components/VehicleHeader'
import ImageGallery from './components/ImageGallery'
import VehicleDetails from './components/VehicleDetails'
import OwnerInfo from './components/OwnerInfo'
import PickupLocation from './components/PickupLocation'
import Restrictions from './components/Restrictions'
import Reviews from './components/Reviews'
import BookingSidebar from './components/BookingSidebar'
import FullGalleryModal from './components/FullGalleryModal'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'

function CarDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Custom hooks for data fetching and search params
  const { vehicle, loading, error } = useVehicleData(params.id)
  const { searchDetails, selectedDates } = useSearchParamsHook(searchParams)
  
  // Local UI state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullGallery, setShowFullGallery] = useState(false)

  // Image gallery handlers
  const nextImage = () => {
    if (vehicle?.images) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (vehicle?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      )
    }
  }

  const selectImage = (index) => setCurrentImageIndex(index)

  // Navigation handlers
  const handleBooking = () => {
    if (!vehicle) {
      console.error('Cannot book: vehicle data is not loaded')
      return
    }
    
    // Get vehicle ID from multiple possible locations
    const vehicleId = vehicle.id || vehicle.listing_id || params.id
    if (!vehicleId) {
      console.error('Cannot book: vehicle ID is missing', { vehicle, params })
      return
    }
    
    const totalPrice = (vehicle.price * searchDetails.duration) + 25
    const bookingUrl = buildBookingUrl({
      vehicleId: String(vehicleId), // Ensure it's a string
      searchDetails,
      totalPrice
    })
    
    console.log('Navigating to booking:', { vehicleId, bookingUrl, vehicle })
    router.push(bookingUrl)
  }

  const handleModifySearch = () => {
    router.push(buildSearchUrl(searchDetails))
  }

  const handleChangeDates = () => {
    router.push(buildSearchUrl(searchDetails))
  }

  // Loading and error states
  if (loading) {
    return <LoadingState />
  }

  if (error || !vehicle) {
    return <ErrorState error={error} vehicleId={params.id} />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Animated Breadcrumb */}
        <AnimatedBreadcrumb vehicleName={vehicle.name} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <motion.div
              className="lg:col-span-2 space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatedSection index={0}>
                <SearchSummary 
                  searchDetails={searchDetails}
                  selectedDates={selectedDates}
                  onModifySearch={handleModifySearch}
                />
              </AnimatedSection>

              <AnimatedSection index={1}>
                <VehicleHeader vehicle={vehicle} />
              </AnimatedSection>

              <AnimatedSection index={2}>
                <ImageGallery 
                  vehicle={vehicle}
                  currentImageIndex={currentImageIndex}
                  onNextImage={nextImage}
                  onPrevImage={prevImage}
                  onSelectImage={selectImage}
                  onShowFullGallery={() => setShowFullGallery(true)}
                />
              </AnimatedSection>

              <AnimatedSection index={3}>
                <VehicleDetails vehicle={vehicle} />
              </AnimatedSection>

              <AnimatedSection index={4}>
                <OwnerInfo vehicle={vehicle} />
              </AnimatedSection>

              <AnimatedSection index={5}>
                <PickupLocation vehicle={vehicle} />
              </AnimatedSection>

              <AnimatedSection index={6}>
                <Restrictions vehicle={vehicle} />
              </AnimatedSection>

              <AnimatedSection index={7}>
                <Reviews vehicle={vehicle} />
              </AnimatedSection>
            </motion.div>

            {/* Right Column - Booking Sidebar */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.4,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
            >
              <BookingSidebar 
                vehicle={vehicle}
                searchDetails={searchDetails}
                selectedDates={selectedDates}
                onBookNow={handleBooking}
                onChangeDates={handleChangeDates}
              />
            </motion.div>
          </div>
        </div>

        {/* Full Gallery Modal */}
        {showFullGallery && (
          <FullGalleryModal 
            vehicle={vehicle}
            currentImageIndex={currentImageIndex}
            onClose={() => setShowFullGallery(false)}
            onSelectImage={selectImage}
          />
        )}

        <Footer />
      </div>
    </PageTransition>
  )
}

export default function CarDetails() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CarDetailsContent />
    </Suspense>
  )
}
