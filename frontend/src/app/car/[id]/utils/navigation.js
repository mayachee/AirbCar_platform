/**
 * Builds booking URL with search parameters
 * @param {Object} params - Parameters for booking
 * @param {number} params.vehicleId - Vehicle ID
 * @param {Object} params.searchDetails - Search details (location, dates, duration)
 * @param {number} params.totalPrice - Total price for booking
 * @returns {string} Booking URL with query parameters
 */
export function buildBookingUrl({ vehicleId, searchDetails, totalPrice }) {
  const params = new URLSearchParams()
  params.set('carId', vehicleId.toString())
  
  if (searchDetails.location) {
    params.set('location', searchDetails.location)
  }
  
  if (searchDetails.pickupDate?.trim()) {
    params.set('pickupDate', searchDetails.pickupDate.trim())
  }
  
  if (searchDetails.returnDate?.trim()) {
    params.set('returnDate', searchDetails.returnDate.trim())
  }
  
  params.set('duration', searchDetails.duration.toString())
  params.set('totalPrice', totalPrice.toString())
  
  return `/booking?${params.toString()}`
}

/**
 * Builds search URL with search parameters
 * @param {Object} searchDetails - Search details (location, dates)
 * @returns {string} Search URL with query parameters
 */
export function buildSearchUrl(searchDetails) {
  const params = new URLSearchParams()
  
  if (searchDetails.location) {
    params.set('location', searchDetails.location)
  }
  
  if (searchDetails.pickupDate) {
    params.set('pickupDate', searchDetails.pickupDate)
  }
  
  if (searchDetails.returnDate) {
    params.set('returnDate', searchDetails.returnDate)
  }
  
  return `/search?${params.toString()}`
}

