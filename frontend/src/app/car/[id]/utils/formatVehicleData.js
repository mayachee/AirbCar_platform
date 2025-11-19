/**
 * Formats raw vehicle data from API into a standardized format for the frontend
 * @param {Object} data - Raw vehicle data from API
 * @returns {Object} Formatted vehicle object
 */
export function formatVehicleData(data) {
  return {
    id: data.id,
    name: `${data.make || ''} ${data.model || ''}`.trim() || 'Vehicle',
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
    owner: formatOwnerData(data.partner_details),
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

/**
 * Formats partner/owner data from API response
 * @param {Object} partnerDetails - Partner details from API
 * @returns {Object} Formatted owner object
 */
function formatOwnerData(partnerDetails) {
  if (!partnerDetails) {
    return {
      name: 'Owner',
      avatar: 'O',
      memberSince: 'Recently',
      rating: 5.0,
      reviewCount: 0,
      responseRate: '100%',
      languages: ['Arabic', 'French', 'English']
    }
  }

  const userName = partnerDetails.user
    ? `${partnerDetails.user.first_name || ''} ${partnerDetails.user.last_name || ''}`.trim()
    : ''

  const companyName = partnerDetails.company_name || ''
  const displayName = companyName || userName || 'Owner'

  return {
    name: displayName,
    avatar: companyName?.[0]?.toUpperCase() || 
            partnerDetails.user?.first_name?.[0]?.toUpperCase() || 
            'O',
    profilePicture: partnerDetails.user?.profile_picture || partnerDetails.logo || null,
    memberSince: partnerDetails.user?.date_joined 
      ? new Date(partnerDetails.user.date_joined).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      : 'Recently',
    rating: 5.0, // TODO: Calculate from reviews
    reviewCount: 0, // TODO: Get from reviews count
    responseRate: '100%', // TODO: Calculate from booking responses
    languages: ['Arabic', 'French', 'English'], // TODO: Get from user profile if available
    companyName: companyName,
    phone: partnerDetails.phone,
    city: partnerDetails.city,
    address: partnerDetails.address,
    businessType: partnerDetails.business_type,
    description: partnerDetails.description,
    logo: partnerDetails.logo,
    verified: partnerDetails.verification_status === 'verified' || 
              partnerDetails.verification_status === 'approved',
    partnerId: partnerDetails.id,
    slug: partnerDetails.slug
  }
}

