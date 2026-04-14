'use client'

import { useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useVehicleData } from './hooks/useVehicleData'
import { useSearchParams as useSearchParamsHook } from './hooks/useSearchParams'
import { buildBookingUrl, buildSearchUrl } from './utils/navigation'
import { calculateTotalPrice } from './utils/pricing'
import { trackEvent } from '@/lib/analytics/tracking'
import { useToast } from '@/contexts/ToastContext'
import PageTransition from './components/PageTransition'
import AnimatedBreadcrumb from './components/AnimatedBreadcrumb'
import AnimatedSection from './components/AnimatedSection'
import SearchSummary from './components/SearchSummary'
import ImageGallery from './components/ImageGallery'
import OwnerBlock from './components/OwnerBlock'
import VehicleDetails from './components/VehicleDetails'
import VehicleThread from './components/VehicleThread'
import PickupLocation from './components/PickupLocation'
import Restrictions from './components/Restrictions'
import Reviews from './components/Reviews'
import BookingSidebar from './components/BookingSidebar'
import FullGalleryModal from './components/FullGalleryModal'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'

function CarDetailsContent({ initialVehicle }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('car_details')

  const { vehicle: fetchedVehicle, loading, error } = useVehicleData(params.id)
  const vehicle = fetchedVehicle || initialVehicle
  const { searchDetails, selectedDates } = useSearchParamsHook(searchParams)
  const { showToast } = useToast()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullGallery, setShowFullGallery] = useState(false)

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

  const handleBooking = () => {
    if (!vehicle) {
      showToast(t('error_vehicle_not_loaded'), 'error')
      return
    }

    const vehicleId = vehicle.id || vehicle.listing_id || params.id
    if (!vehicleId) {
      showToast(t('error_vehicle_id_missing'), 'error')
      console.error('Cannot book: vehicle ID is missing', { vehicle, params })
      return
    }

    const price = vehicle.price || vehicle.price_per_day || vehicle.dailyRate || 0
    const securityDeposit = Number(vehicle.security_deposit ?? vehicle.securityDeposit ?? 5000)
    const { total } = calculateTotalPrice(price, searchDetails.duration, securityDeposit)
    const bookingUrl = buildBookingUrl({
      vehicleId: String(vehicleId),
      searchDetails,
      totalPrice: total
    })

    trackEvent('booking_cta_clicked', {
      listing_id: String(vehicleId),
      location: vehicle.location || '',
      duration: Number(searchDetails.duration) || 1,
      price_per_day: Number(price) || 0,
      security_deposit: securityDeposit,
    })

    router.push(bookingUrl)
  }

  const handleModifySearch = () => {
    router.push(buildSearchUrl(searchDetails))
  }

  const handleChangeDates = () => {
    router.push(buildSearchUrl(searchDetails))
  }

  if (loading && !initialVehicle) {
    return <LoadingState />
  }

  if ((error || !vehicle) && !initialVehicle) {
    return <ErrorState error={error} vehicleId={params.id} />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white relative">
        <div className="relative z-10">
          <Header />

          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-6">
            <AnimatedBreadcrumb vehicleName={vehicle.name} />
          </div>

          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pb-12">
            <AnimatedSection index={1}>
              <ImageGallery
                vehicle={vehicle}
                currentImageIndex={currentImageIndex}
                onNextImage={nextImage}
                onPrevImage={prevImage}
                onSelectImage={selectImage}
                onShowFullGallery={() => setShowFullGallery(true)}
              />
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
              <motion.div
                className="lg:col-span-8 space-y-12"
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

                <AnimatedSection index={2}>
                  <OwnerBlock partner={vehicle.partner} />
                </AnimatedSection>

                <AnimatedSection index={3}>
                  <VehicleDetails vehicle={vehicle} />
                </AnimatedSection>

                <AnimatedSection index={4}>
                  <VehicleThread vehicle={vehicle} />
                </AnimatedSection>

                <div className="lg:hidden">
                  <BookingSidebar
                    vehicle={vehicle}
                    searchDetails={searchDetails}
                    selectedDates={selectedDates}
                    onBookNow={handleBooking}
                    onChangeDates={handleChangeDates}
                  />
                </div>

                <AnimatedSection index={6}>
                  <Restrictions vehicle={vehicle} />
                </AnimatedSection>

                <AnimatedSection index={5}>
                  <PickupLocation vehicle={vehicle} />
                </AnimatedSection>

                <AnimatedSection index={7}>
                  <Reviews vehicle={vehicle} />
                </AnimatedSection>
              </motion.div>

              <motion.div
                className="hidden lg:block lg:col-span-4"
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

          {showFullGallery && (
            <FullGalleryModal
              vehicle={vehicle}
              currentImageIndex={currentImageIndex}
              onClose={() => setShowFullGallery(false)}
              onSelectImage={selectImage}
            />
          )}

          <div className="h-24 bg-white" />
          <Footer />
        </div>
      </div>
    </PageTransition>
  )
}

export default function CarDetailClient({ initialVehicle }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <CarDetailsContent initialVehicle={initialVehicle} />
    </Suspense>
  )
}
