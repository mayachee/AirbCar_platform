'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api/client'
import { authService } from '@/features/auth/services/authService'
import { trackEvent } from '@/lib/analytics/tracking'
import { BookingSummary, UserInfo, BookingNotice, BookingSuccess, BookingForm, BookingBreadcrumb } from './components'
import BookingFlow from './components/BookingFlow'

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
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnTime, setReturnTime] = useState('18:00')

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
  const location = searchParams.get('location') || 'Tetouan'
  const totalPrice = searchParams.get('totalPrice') || searchParams.get('total_price')
  const duration = searchParams.get('duration')

  // Keep editable dates in local state (avoid full reload when user changes dates)
  const [pickupDateState, setPickupDateState] = useState(pickupDate)
  const [returnDateState, setReturnDateState] = useState(returnDate)

  // Keep state in sync if URL params change (e.g. navigation back/forward)
  useEffect(() => {
    setPickupDateState(pickupDate)
    setReturnDateState(returnDate)
  }, [pickupDate, returnDate])
  
  // Debug: Log URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Booking page URL params:', {
        carId: validCarId,
        rawCarId: carId,
        pickupDate: pickupDateState,
        returnDate: returnDateState,
        totalPrice,
        duration,
        allParams: Object.fromEntries(searchParams.entries())
      })
    }
  }, [validCarId, carId, pickupDateState, returnDateState, totalPrice, duration, searchParams])

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

  const formatBookingError = (err) => {
    const status = err?.status
    const data = err?.data

    if (err?.isTimeoutError) {
      return 'Request timed out. Please try again. (Render can be slow on free tier.)'
    }
    if (err?.isNetworkError || err?.isConnectionError) {
      return err?.message || 'Unable to connect to the server. Please try again.'
    }
    if (status === 409) {
      return 'This vehicle is not available for the selected dates. Please choose different dates.'
    }
    if (status === 400) {
      // Backend often returns { error, message } or { error, errors }
      if (data?.errors && typeof data.errors === 'object') {
        const firstField = Object.keys(data.errors)[0]
        const firstValue = data.errors[firstField]
        const firstMessage = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
        return `${firstField}: ${firstMessage}`
      }
      if (data?.message && data?.error) {
        return `${data.error}: ${data.message}`
      }
      return data?.error || data?.detail || data?.message || 'Invalid booking data. Please check your inputs.'
    }

    return err?.message || 'Failed to create booking. Please try again.'
  }

  const handleCreateBooking = async (specialRequest = '', licenseFiles = null, paymentMethod = 'online', phoneNumber = '') => {
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
    if (!pickupDateState || !returnDateState) {
      setError('Please select pickup and return dates. If you came from a car listing page, please go back and select dates first.')
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Validate date format
    const pickupDateObj = new Date(pickupDateState)
    const returnDateObj = new Date(returnDateState)
    
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

    // Validate time format (HH:MM)
    const timeRe = /^\d{2}:\d{2}$/
    if (!timeRe.test(pickupTime) || !timeRe.test(returnTime)) {
      setError('Invalid time format. Please use HH:MM.')
      return
    }

    // Validate location
    const bookingLocation = String(location || vehicle?.location || '').trim()
    if (!bookingLocation) {
      setError('Pickup/return location is required.')
      return
    }

    // License files are optional but recommended
    if (!licenseFiles || (!licenseFiles.front && !licenseFiles.back)) {
      console.warn('No license files provided - booking will proceed without them')
    }

    const phoneValue = String(phoneNumber || currentUser?.phone_number || currentUser?.phoneNumber || currentUser?.phone || '').trim()

    try {
      setLoading(true)
      setError(null)
      trackEvent('booking_submit_started', {
        listing_id: String(validCarId),
        pickup_date: pickupDateState || '',
        return_date: returnDateState || '',
        payment_method: paymentMethod || 'online',
      })

      // Format dates properly for backend with selected times
      const startTime = new Date(pickupDateState)
      const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number)
      startTime.setHours(pickupHour || 10, pickupMinute || 0, 0, 0)
      
      const endTime = new Date(returnDateState)
      const [returnHour, returnMinute] = returnTime.split(':').map(Number)
      endTime.setHours(returnHour || 18, returnMinute || 0, 0, 0)

      // Create FormData to handle file upload
      const formData = new FormData()
      // Send both naming conventions for maximum backend compatibility
      formData.append('listing_id', validCarId)
      formData.append('listing', validCarId)
      
      // Add required dates (YYYY-MM-DD) for backend validation
      const pickupDateStr = startTime.toISOString().split('T')[0]
      const returnDateStr = endTime.toISOString().split('T')[0]
      formData.append('pickup_date', pickupDateStr)
      formData.append('return_date', returnDateStr)
      
      // Add times
      formData.append('pickup_time', pickupTime)
      formData.append('return_time', returnTime)
      
      // Add locations (required by backend)
      formData.append('pickup_location', bookingLocation)
      formData.append('return_location', bookingLocation)
      
      // Total amount: prefer query param, otherwise compute a best-effort fallback
      let totalAmount = Number(totalPrice)
      if (!Number.isFinite(totalAmount)) {
        const days = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)))
        const pricePerDay = Number(vehicle?.price_per_day ?? vehicle?.pricePerDay ?? vehicle?.dailyRate ?? 0)
        const securityDeposit = Number(vehicle?.security_deposit ?? vehicle?.securityDeposit ?? 5000)
        const serviceFee = 25
        totalAmount = Number.isFinite(pricePerDay) ? (pricePerDay * days) + securityDeposit + serviceFee : (securityDeposit + serviceFee)
      }
      formData.append('total_amount', String(totalAmount))
      formData.append('request_message', specialRequest || 'Booking request from website')
      formData.append('payment_method', paymentMethod || 'online') // 'online' or 'cash'

      if (phoneValue) {
        // Support both conventions
        formData.append('phone_number', phoneValue)
        formData.append('phoneNumber', phoneValue)
      }
      
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

      // Backend may return { data: booking, message } or booking directly
      const responseData = response?.data
      const booking = responseData?.data || responseData
      setBookingData(booking)
      setBookingCreated(true)
      trackEvent('booking_submit_success', {
        listing_id: String(validCarId),
        booking_id: booking?.id || null,
        total_amount: totalAmount,
      })
    } catch (err) {
      console.error('Error creating booking:', err)
      setError(formatBookingError(err))
      trackEvent('booking_submit_failed', {
        listing_id: String(validCarId),
        status: err?.status || null,
        error: String(err?.message || 'unknown_error'),
      })
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
      <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        <div className="relative z-10">
          <Header />
          <BookingSuccess bookingData={bookingData} />
          <Footer />
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#0F172A] relative">
      {/* Abstract Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          {/* Breadcrumb */}
          <BookingBreadcrumb 
            vehicleName={vehicle ? `${vehicle.make} ${vehicle.model}` : ''} 
            carId={validCarId} 
          />

          {/* Warning if dates are missing */}
          {(!pickupDateState || !returnDateState) && (
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-md p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-200 mb-1">Dates Required</h3>
                  <p className="text-sm text-yellow-200/80 mb-3">
                    Please go back to the car listing page and select pickup and return dates before booking.
                  </p>
                  {validCarId && (
                    <button
                      onClick={() => router.push(`/car/${validCarId}${window.location.search}`)}
                      className="text-sm font-medium text-yellow-200 hover:text-yellow-100 underline"
                    >
                      Go to car details page →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Step Booking Flow */}
          <BookingFlow
            pickupDate={pickupDateState}
            returnDate={returnDateState}
            pickupTime={pickupTime}
            returnTime={returnTime}
            onDatesChange={(type, date) => {
              if (type === 'pickup') {
                setPickupDateState(date)
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('pickupDate', date)
                window.history.pushState({}, '', newUrl)
              } else {
                setReturnDateState(date)
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('returnDate', date)
                window.history.pushState({}, '', newUrl)
              }
            }}
            onTimeChange={(type, time) => {
              if (type === 'pickup') {
                setPickupTime(time)
              } else {
                setReturnTime(time)
              }
            }}
            user={currentUser}
            vehicle={vehicle}
            totalPrice={totalPrice}
            duration={duration}
            onConfirm={(specialRequest, licenseFiles, paymentMethod, phoneNumber) => {
              // This is called from step 3's confirm button
              // All form data is collected and passed to handleCreateBooking
              handleCreateBooking(specialRequest, licenseFiles, paymentMethod, phoneNumber)
            }}
            loading={loading}
            error={error}
          >
            {/* Step 2 Content - Documents */}
            <BookingForm
              onConfirm={(specialRequest, licenseFiles, paymentMethod) => {
                // This callback is not used when hideButtons=true
                // Form data is collected via onFormDataUpdate callback instead
              }}
              onCancel={() => router.back()}
              loading={loading}
              error={error}
              user={currentUser}
              hideButtons={true}
            />
          </BookingFlow>
        </div>

          {/* Smooth transition to footer */}
          <div className="h-24 bg-gradient-to-b from-[#0F172A]/20 to-[#0B0F19]" />
        <Footer />
      </div>
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
