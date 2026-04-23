'use client'

import { useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import VehicleHeader from './components/VehicleHeader'
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
      searchDetails: { ...searchDetails, locale: params.locale },
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

  const handleChangeDates = () => {
    router.push(buildSearchUrl({ ...searchDetails, locale: params.locale }))
  }

  if (loading && !initialVehicle) {
    return <LoadingState />
  }

  if ((error || !vehicle) && !initialVehicle) {
    return <ErrorState error={error} vehicleId={params.id} />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <Header />

        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-4">
          <AnimatedBreadcrumb vehicleName={vehicle.name} />
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-4 pb-16">
          <VehicleHeader vehicle={vehicle} />

          <ImageGallery
            vehicle={vehicle}
            onSelectImage={selectImage}
            onShowFullGallery={() => setShowFullGallery(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
            <div className="lg:col-span-8 space-y-10 divide-y divide-[var(--surface-3)]">
              <OwnerBlock partner={vehicle.partner} />

              <section className="pt-10">
                <VehicleDetails vehicle={vehicle} />
              </section>

              <section className="pt-10">
                <VehicleThread vehicle={vehicle} />
              </section>

              <div className="lg:hidden pt-10">
                <BookingSidebar
                  vehicle={vehicle}
                  searchDetails={searchDetails}
                  selectedDates={selectedDates}
                  onBookNow={handleBooking}
                  onChangeDates={handleChangeDates}
                />
              </div>

              <section className="pt-10">
                <Restrictions vehicle={vehicle} />
              </section>

              <section className="pt-10">
                <PickupLocation vehicle={vehicle} />
              </section>

              <section className="pt-10">
                <Reviews vehicle={vehicle} />
              </section>
            </div>

            <div className="hidden lg:block lg:col-span-4">
              <BookingSidebar
                vehicle={vehicle}
                searchDetails={searchDetails}
                selectedDates={selectedDates}
                onBookNow={handleBooking}
                onChangeDates={handleChangeDates}
              />
            </div>
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

        <Footer />
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
