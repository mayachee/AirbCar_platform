'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api/client'
import { authService } from '@/features/auth/services/authService'
import { BookingSummary, UserInfo, BookingNotice, BookingSuccess, BookingForm } from './components'

function BookingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [vehicleLoading, setVehicleLoading] = useState(true)

  // Try multiple parameter name variations for vehicle ID
  const carId = searchParams.get('carId') || 
                searchParams.get('vehicle_id') || 
                searchParams.get('vehicleId') || 
                searchParams.get('listing_id') || 
                searchParams.get('listingId') ||
                searchParams.get('id') ||
                searchParams.get('listing') ||
                null
  
  // Clean carId - remove whitespace and validate
  const cleanCarId = carId ? String(carId).trim() : null
  const validCarId = cleanCarId && cleanCarId !== '' && !isNaN(Number(cleanCarId)) ? cleanCarId : null
  // Try multiple parameter name variations - also trim whitespace and check for empty strings
  const pickupDateRaw = searchParams.get('pickupDate') || searchParams.get('pickup_date') || searchParams.get('startDate')
  const returnDateRaw = searchParams.get('returnDate') || searchParams.get('dropoffDate') || searchParams.get('return_date') || searchParams.get('endDate')
  const pickupDate = pickupDateRaw?.trim() || null
  const returnDate = returnDateRaw?.trim() || null
  const totalPrice = searchParams.get('totalPrice') || searchParams.get('total_price')
  const duration = searchParams.get('duration')
  
  // Debug: Log URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Booking page URL params:', {
        carId: validCarId,
        rawCarId: carId,
        pickupDate,
        returnDate,
        totalPrice,
        duration,
        allParams: Object.fromEntries(searchParams.entries())
      })
    }
  }, [validCarId, carId, pickupDate, returnDate, totalPrice, duration, searchParams])

  // Fetch full user profile with identity documents
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser || authLoading) return
      
      try {
        setUserLoading(true)
        const response = await authService.getProfile()
        // The response might be wrapped in ApiResponse or direct data
        // Handle nested response structure: { data: { data: {...} } } or { data: {...} }
        let userData = response?.data || response
        if (userData?.data && typeof userData.data === 'object') {
          userData = userData.data
        }
        
        // Debug logging in development
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('🔍 Booking Page - User Data:', {
            hasUserData: !!userData,
            hasLicenseFront: !!(userData?.license_front_document_url),
            hasLicenseBack: !!(userData?.license_back_document_url),
            licenseFields: userData ? Object.keys(userData).filter(k => k.includes('license')) : []
          })
        }
        
        setUser(userData)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        // Fallback to auth user if profile fetch fails
        setUser(authUser)
      } finally {
        setUserLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [authUser, authLoading])

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!validCarId) {
        setVehicleLoading(false)
        return
      }
      
      try {
        setVehicleLoading(true)
        setError(null)
        // Increase timeout to 90 seconds for vehicle details (backend may be slow)
        const response = await apiClient.get(`/listings/${validCarId}/`, undefined, { timeout: 90000 })
        // Handle different response structures
        const vehicleData = response?.data?.data || response?.data || response
        setVehicle(vehicleData)
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        
        // Handle timeout errors specifically
        if (err?.isTimeoutError || err?.message?.includes('timeout')) {
          setError('The server is taking too long to respond. Please try again in a moment. If the problem persists, the server may be temporarily unavailable.')
        } else if (err?.status === 404) {
          setError('Vehicle not found. Please check the vehicle ID and try again.')
        } else if (err?.status === 403) {
          setError('You do not have permission to view this vehicle.')
        } else {
          setError(`Failed to load vehicle details: ${err.message || 'Unknown error'}. Please try refreshing the page.`)
        }
      } finally {
        setVehicleLoading(false)
      }
    }
    
    fetchVehicle()
  }, [validCarId])

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/signin?redirect=/booking' + window.location.search)
    }
  }, [authUser, authLoading, router])

  const handleCreateBooking = async (specialRequest = '', licenseFiles = null, paymentMethod = 'online') => {
    if (!validCarId) {
      setError('Car ID is missing. Please go back and select a vehicle.')
      // Try to redirect to search if no vehicle ID
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          router.push('/search')
        }, 2000)
      }
      return
    }

    // Use full user profile if available, otherwise fallback to auth user
    const currentUser = user || authUser

    if (!currentUser) {
      router.push('/auth/signin?redirect=/booking' + window.location.search)
      return
    }

    // Validate dates - provide helpful error message
    if (!pickupDate || !returnDate) {
      setError('Please select pickup and return dates. If you came from a car listing page, please go back and select dates first.')
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Validate date format
    const pickupDateObj = new Date(pickupDate)
    const returnDateObj = new Date(returnDate)
    
    if (isNaN(pickupDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
      setError('Invalid date format. Please select valid pickup and return dates.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const pickup = pickupDateObj
    const returnD = returnDateObj
    const now = new Date()

    if (pickup < now) {
      setError('Pickup date cannot be in the past')
      return
    }

    if (returnD <= pickup) {
      setError('Return date must be after pickup date')
      return
    }

    // License files are optional but recommended
    if (!licenseFiles || (!licenseFiles.front && !licenseFiles.back)) {
      console.warn('No license files provided - booking will proceed without them')
    }

    try {
      setLoading(true)
      setError(null)

      // Format dates properly for backend
      const startTime = new Date(pickupDate)
      startTime.setHours(10, 0, 0, 0) // Default pickup time: 10 AM
      const endTime = new Date(returnDate)
      endTime.setHours(18, 0, 0, 0) // Default return time: 6 PM

      // Create FormData to handle file upload
      const formData = new FormData()
      formData.append('listing', validCarId)
      formData.append('listing_id', validCarId) // Also add listing_id for compatibility
      
      // Add dates in multiple formats for compatibility
      if (pickupDate) {
        formData.append('pickup_date', pickupDate)
        formData.append('pickupDate', pickupDate)
        // Extract date from startTime if it's a full datetime
        const pickupDateOnly = pickupDate.includes('T') ? pickupDate.split('T')[0] : pickupDate
        formData.append('pickup_date', pickupDateOnly)
      }
      
      if (returnDate) {
        formData.append('return_date', returnDate)
        formData.append('returnDate', returnDate)
        // Extract date from endTime if it's a full datetime
        const returnDateOnly = returnDate.includes('T') ? returnDate.split('T')[0] : returnDate
        formData.append('return_date', returnDateOnly)
      }
      
      // Add times
      formData.append('start_time', startTime.toISOString())
      formData.append('end_time', endTime.toISOString())
      formData.append('pickup_time', startTime.toISOString())
      formData.append('return_time', endTime.toISOString())
      
      formData.append('price', totalPrice || 0)
      formData.append('total_amount', totalPrice || 0)
      formData.append('request_message', specialRequest || 'Booking request from website')
      formData.append('payment_method', paymentMethod || 'online') // 'online' or 'cash'
      
      // Append license files if provided
      if (licenseFiles) {
        if (licenseFiles.front) {
          formData.append('license_front_document', licenseFiles.front)
        }
        if (licenseFiles.back) {
          formData.append('license_back_document', licenseFiles.back)
        }
      }
      
      // Don't set Content-Type - let the browser set it with the boundary
      // Increase timeout to 90 seconds for booking creation (backend may be slow on Render free tier)
      const response = await apiClient.post('/bookings/', formData, { timeout: 90000 })
      
      setBookingData(response.data)
      setBookingCreated(true)
    } catch (err) {
      console.error('Error creating booking:', err)
      // Provide more specific error messages
      if (err.message?.includes('timeout')) {
        setError('Request timed out. Please try again or contact support if the problem persists.')
      } else if (err.message?.includes('400') || err.message?.includes('Bad Request')) {
        setError('Invalid booking data. Please check your dates and try again.')
      } else if (err.message?.includes('409') || err.message?.includes('Conflict')) {
        setError('This vehicle is not available for the selected dates. Please choose different dates.')
      } else {
        setError(err.message || 'Failed to create booking. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || userLoading) {
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

  if (!user && !authUser) {
    return null
  }

  // Use full user profile if available, otherwise fallback to auth user
  const currentUser = user || authUser

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

        {/* Warning if dates are missing */}
        {(!pickupDate || !returnDate) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Dates Required</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Please go back to the car listing page and select pickup and return dates before booking.
                </p>
                {validCarId && (
                  <button
                    onClick={() => router.push(`/car/${validCarId}${window.location.search}`)}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Go to car details page →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
              user={currentUser}
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
              <UserInfo user={currentUser} />

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
