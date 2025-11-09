'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api/client'
import { BookingSummary, UserInfo, BookingNotice, BookingSuccess, BookingForm, BookingProgress } from './components'

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [vehicleLoading, setVehicleLoading] = useState(true)

  const carId = searchParams.get('carId')
  const pickupDate = searchParams.get('pickupDate')
  const returnDate = searchParams.get('returnDate')
  const totalPrice = searchParams.get('totalPrice')
  const duration = searchParams.get('duration')

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!carId) return
      
      try {
        setVehicleLoading(true)
        const response = await apiClient.get(`/listings/${carId}/`)
        setVehicle(response.data)
      } catch (err) {
        console.error('Error fetching vehicle:', err)
      } finally {
        setVehicleLoading(false)
      }
    }
    
    fetchVehicle()
  }, [carId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/booking' + window.location.search)
    }
  }, [user, authLoading, router])

  const handleCreateBooking = async (specialRequest = '', licenseFile = null) => {
    if (!carId) {
      setError('Car ID is missing')
      return
    }

    if (!user) {
      router.push('/auth/signin?redirect=/booking' + window.location.search)
      return
    }

    if (!licenseFile) {
      setError('Please upload your driver\'s license')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create FormData to handle file upload
      const formData = new FormData()
      formData.append('listing', carId)
      formData.append('start_time', pickupDate || new Date().toISOString())
      formData.append('end_time', returnDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      formData.append('price', totalPrice || 0)
      formData.append('request_message', specialRequest || 'Booking request from website')
      formData.append('driver_license', licenseFile)

      // Don't set Content-Type - let the browser set it with the boundary
      const response = await apiClient.post('/bookings/', formData)
      
      setBookingData(response.data)
      setBookingCreated(true)
    } catch (err) {
      console.error('Error creating booking:', err)
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (bookingCreated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <BookingSuccess bookingData={bookingData} />
        <Footer />
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to car details
        </button>

        {/* Step Indicator */}
        <BookingProgress currentStep={1} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info Card */}
            {vehicleLoading ? (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : vehicle && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transform transition-all hover:shadow-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Details</h2>
                  <div className="flex gap-4">
                    {vehicle.pictures && vehicle.pictures.length > 0 && (
                      <div className="relative group">
                        <img
                          src={vehicle.pictures[0]}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-24 h-24 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600 mt-1">{vehicle.year} • {vehicle.transmission} • {vehicle.fuel_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{vehicle.location}</p>
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-orange-600">
                          {totalPrice} MAD
                        </span>
                        <span className="text-sm text-gray-500 ml-2">for {duration} {duration === '1' ? 'day' : 'days'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Important Notice */}
            <BookingNotice />

            {/* Booking Form */}
            <BookingForm
              onConfirm={handleCreateBooking}
              onCancel={() => router.back()}
              loading={loading}
              error={error}
              user={user}
            />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Booking Summary */}
              <BookingSummary 
                duration={duration}
                pickupDate={pickupDate}
                returnDate={returnDate}
                totalPrice={totalPrice}
              />

              {/* User Info */}
              <UserInfo user={user} />

              {/* Help & Support Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-xs text-blue-700 mb-3">
                  Our support team is available 24/7 to assist you with your booking.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  )
}
