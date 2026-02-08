'use client'

/**
 * Build booking URL with search parameters
 */
export function buildBookingUrl({ vehicleId, searchDetails, totalPrice }) {
  const params = new URLSearchParams()
  
  if (searchDetails.location) params.append('location', searchDetails.location)
  // Support both camelCase and snake_case for dates
  if (searchDetails.pickupDate) {
    params.append('pickupDate', searchDetails.pickupDate)
    params.append('pickup_date', searchDetails.pickupDate) // Fallback
  }
  if (searchDetails.returnDate) {
    params.append('returnDate', searchDetails.returnDate)
    params.append('return_date', searchDetails.returnDate) // Fallback
  }
  if (searchDetails.pickupTime) {
    params.append('pickupTime', searchDetails.pickupTime)
    params.append('pickup_time', searchDetails.pickupTime) // Fallback
  }
  if (searchDetails.returnTime) {
    params.append('returnTime', searchDetails.returnTime)
    params.append('return_time', searchDetails.returnTime) // Fallback
  }
  if (vehicleId) {
    // Use carId as the primary parameter name for consistency
    params.append('carId', String(vehicleId))
    // Also include multiple fallback names
    params.append('vehicle_id', String(vehicleId))
    params.append('vehicleId', String(vehicleId))
    params.append('listing_id', String(vehicleId))
    params.append('listingId', String(vehicleId))
  }
  if (totalPrice) {
    params.append('totalPrice', String(totalPrice))
    params.append('total_price', String(totalPrice)) // Fallback
  }
  
  const queryString = params.toString()
  return `/booking${queryString ? `?${queryString}` : ''}`
}

/**
 * Build search URL with parameters
 */
export function buildSearchUrl(searchDetails) {
  const params = new URLSearchParams()
  
  if (searchDetails.location) params.append('location', searchDetails.location)
  if (searchDetails.pickupDate) params.append('pickup_date', searchDetails.pickupDate)
  if (searchDetails.returnDate) params.append('return_date', searchDetails.returnDate)
  if (searchDetails.pickupTime) params.append('pickup_time', searchDetails.pickupTime)
  if (searchDetails.returnTime) params.append('return_time', searchDetails.returnTime)
  
  const queryString = params.toString()
  return `/search${queryString ? `?${queryString}` : ''}`
}

