'use client'

/**
 * Build booking URL with vehicle and search details
 */
export function buildBookingUrl({ vehicleId, searchDetails, totalPrice }) {
  const params = new URLSearchParams()
  
  params.set('vehicleId', vehicleId)
  params.set('location', searchDetails.location || '')
  params.set('pickupDate', searchDetails.pickupDate || '')
  params.set('returnDate', searchDetails.returnDate || '')
  params.set('pickupTime', searchDetails.pickupTime || '10:00')
  params.set('returnTime', searchDetails.returnTime || '10:00')
  params.set('duration', searchDetails.duration || 1)
  params.set('totalPrice', totalPrice || 0)

  return `/booking?${params.toString()}`
}

/**
 * Build search URL with search details
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
  if (searchDetails.pickupTime) {
    params.set('pickupTime', searchDetails.pickupTime)
  }
  if (searchDetails.returnTime) {
    params.set('returnTime', searchDetails.returnTime)
  }

  return `/search?${params.toString()}`
}

