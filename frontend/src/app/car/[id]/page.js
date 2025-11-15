'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { vehicleService } from '@/features/vehicle/services/vehicleService'
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

function CarDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullGallery, setShowFullGallery] = useState(false)
  const [searchDetails, setSearchDetails] = useState({
    location: '',
    pickupDate: '',
    returnDate: '',
    duration: 1
  })
  const [selectedDates, setSelectedDates] = useState({
    pickup: 'Wed, Aug 20',
    return: 'Thu, Aug 21'
  })

  // Helper function to format vehicle data from API
  const formatVehicleData = (data) => {
    return {
      id: data.id,
      name: `${data.make || ''} ${data.model || ''}`,
      images: data.pictures && data.pictures.length > 0 
        ? data.pictures 
        : ['/carsymbol.jpg'],
      price: parseFloat(data.price_per_day) || 0,
      location: data.location || 'Unknown',
      fullAddress: data.location ? `${data.location}, Morocco` : 'Morocco',
      transmission: data.transmission || 'Automatic',
      fuel: data.fuel_type || 'Gasoline',
      seats: data.seating_capacity || 5,
      year: data.year || new Date().getFullYear(),
      verified: data.availability || false,
      rating: parseFloat(data.rating) || 5.0,
      reviewCount: 0,
      totalTrips: 0,
      responseTime: 'Usually responds within 24 hours',
      features: data.features || [],
      restrictions: [
        'Must return with same fuel level',
        'No smoking',
        'No pets'
      ],
      owner: data.partner_details ? {
        name: data.partner_details.company_name || 
              (data.partner_details.user ? `${data.partner_details.user.first_name || ''} ${data.partner_details.user.last_name || ''}`.trim() : 'Owner') ||
              'Owner',
        avatar: data.partner_details.company_name?.[0]?.toUpperCase() || 
                data.partner_details.user?.first_name?.[0]?.toUpperCase() || 
                'O',
        profilePicture: data.partner_details.user?.profile_picture || data.partner_details.logo || null,
        memberSince: data.partner_details.user?.date_joined 
          ? new Date(data.partner_details.user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          : 'Recently',
        rating: 5.0, // TODO: Calculate from reviews
        reviewCount: 0, // TODO: Get from reviews count
        responseRate: '100%', // TODO: Calculate from booking responses
        languages: ['Arabic', 'French', 'English'], // TODO: Get from user profile if available
        companyName: data.partner_details.company_name,
        phone: data.partner_details.phone,
        city: data.partner_details.city,
        address: data.partner_details.address,
        businessType: data.partner_details.business_type,
        description: data.partner_details.description,
        logo: data.partner_details.logo,
        verified: data.partner_details.verification_status === 'verified',
        partnerId: data.partner_details.id,
        slug: data.partner_details.slug
      } : {
        name: 'Owner',
        avatar: 'O',
        memberSince: 'Recently',
        rating: 5.0,
        reviewCount: 0,
        responseRate: '100%',
        languages: ['Arabic', 'French', 'English']
      },
      availability: {
        advanceNotice: '2 hours',
        maxTripLength: '30 days',
        minTripLength: '2 hours'
      },
      insurance: {
        included: true,
        coverage: 'Comprehensive insurance',
        deductible: '1,500 MAD'
      },
      mileage: {
        included: 200,
        overage: '2 MAD/km'
      },
      reviews: []
    }
  }

  // Capture search parameters from URL
  useEffect(() => {
    const location = searchParams.get('location') || ''
    // Try multiple parameter name variations for dates
    const pickupDate = searchParams.get('pickupDate') || searchParams.get('pickup_date') || ''
    const returnDate = searchParams.get('returnDate') || searchParams.get('dropoffDate') || searchParams.get('return_date') || ''
    
    let duration = 1
    let formattedPickup = 'Wed, Aug 20'
    let formattedReturn = 'Thu, Aug 21'
    
    // Calculate duration and format dates if provided
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate)
      const returnD = new Date(returnDate)
      
      // Set time to start of day for consistent calculation
      pickup.setHours(0, 0, 0, 0)
      returnD.setHours(0, 0, 0, 0)
      
      const diffInMs = returnD.getTime() - pickup.getTime()
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
      duration = Math.max(1, Math.ceil(diffInDays))
      
      formattedPickup = pickup.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
      formattedReturn = returnD.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
    
    setSearchDetails({
      location,
      pickupDate,
      returnDate,
      duration
    })
    
    setSelectedDates({
      pickup: formattedPickup,
      return: formattedReturn
    })
  }, [searchParams])

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch vehicle data from API
        const response = await vehicleService.getVehicle(parseInt(params.id))
        
        if (response.data) {
          const formattedData = formatVehicleData(response.data)
          setVehicle(formattedData)
        } else {
          setError('Vehicle data not found')
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        setError(err.message || 'Failed to load vehicle details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchVehicle()
    }
  }, [params.id])

  const nextImage = () => {
    if (vehicle && vehicle.images) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (vehicle && vehicle.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      )
    }
  }

  const selectImage = (index) => setCurrentImageIndex(index)

  const handleBooking = () => {
    // Build URL with all search parameters for booking page
    const params = new URLSearchParams()
    params.set('carId', vehicle.id)
    
    // Pass through search parameters - check for truthy values and non-empty strings
    if (searchDetails.location) params.set('location', searchDetails.location)
    if (searchDetails.pickupDate && searchDetails.pickupDate.trim()) {
      params.set('pickupDate', searchDetails.pickupDate.trim())
    }
    if (searchDetails.returnDate && searchDetails.returnDate.trim()) {
      params.set('returnDate', searchDetails.returnDate.trim())
    }
    params.set('duration', searchDetails.duration.toString())
    params.set('totalPrice', ((vehicle.price * searchDetails.duration) + 25).toString())
    
    // Debug: Log what we're sending
    console.log('Navigating to booking with params:', {
      carId: vehicle.id,
      pickupDate: searchDetails.pickupDate,
      returnDate: searchDetails.returnDate,
      duration: searchDetails.duration,
      searchDetails
    })
    
    const bookingUrl = `/booking?${params.toString()}`
    console.log('Booking URL:', bookingUrl)
    router.push(bookingUrl)
  }

  const handleModifySearch = () => {
    const params = new URLSearchParams()
    if (searchDetails.location) params.set('location', searchDetails.location)
    if (searchDetails.pickupDate) params.set('pickupDate', searchDetails.pickupDate)
    if (searchDetails.returnDate) params.set('returnDate', searchDetails.returnDate)
    router.push(`/search?${params.toString()}`)
  }

  const handleChangeDates = () => {
    const params = new URLSearchParams()
    if (searchDetails.location) params.set('location', searchDetails.location)
    if (searchDetails.pickupDate) params.set('pickupDate', searchDetails.pickupDate)
    if (searchDetails.returnDate) params.set('returnDate', searchDetails.returnDate)
    router.push(`/search?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? 'Unable to load vehicle' : 'Vehicle not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The vehicle you're looking for doesn't exist or has been removed."}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/search')}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Back to Search
              </button>
              <button 
                onClick={() => router.push('/')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
              Home
            </button>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <button onClick={() => router.push('/search')} className="text-gray-500 hover:text-gray-700">
              Cars in Morocco
            </button>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <SearchSummary 
              searchDetails={searchDetails}
              selectedDates={selectedDates}
              onModifySearch={handleModifySearch}
            />
            <VehicleHeader vehicle={vehicle} />
            <ImageGallery 
              vehicle={vehicle}
              currentImageIndex={currentImageIndex}
              onNextImage={nextImage}
              onPrevImage={prevImage}
              onSelectImage={selectImage}
              onShowFullGallery={() => setShowFullGallery(true)}
            />
            <VehicleDetails vehicle={vehicle} />
            <OwnerInfo vehicle={vehicle} />
            <PickupLocation vehicle={vehicle} />
            <Restrictions vehicle={vehicle} />
            <Reviews vehicle={vehicle} />
          </div>

          {/* Right Column - Booking Sidebar */}
          <BookingSidebar 
            vehicle={vehicle}
            searchDetails={searchDetails}
            selectedDates={selectedDates}
            onBookNow={handleBooking}
            onChangeDates={handleChangeDates}
          />
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
  )
}

export default function CarDetails() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <CarDetailsContent />
    </Suspense>
  )
}
