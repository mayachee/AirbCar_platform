/**
 * Parses and formats date from URL search parameters
 * @param {string} dateString - Date string from URL params
 * @returns {Date|null} Parsed date or null
 */
export function parseDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Calculates rental duration in days between two dates
 * @param {Date|string} pickupDate - Pickup date
 * @param {Date|string} returnDate - Return date
 * @returns {number} Duration in days (minimum 1)
 */
export function calculateDuration(pickupDate, returnDate) {
  if (!pickupDate || !returnDate) return 1

  const pickup = typeof pickupDate === 'string' ? parseDate(pickupDate) : pickupDate
  const returnD = typeof returnDate === 'string' ? parseDate(returnDate) : returnDate

  if (!pickup || !returnD) return 1

  const diffInMs = returnD.getTime() - pickup.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
  return Math.max(1, Math.ceil(diffInDays))
}

/**
 * Formats date to short format (e.g., "Wed, Aug 20")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatShortDate(date) {
  if (!date) return 'Select date'
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  if (!dateObj) return 'Select date'

  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Extracts search parameters from URL with multiple name variations
 * @param {URLSearchParams} searchParams - Next.js search params
 * @returns {Object} Extracted search details
 */
export function extractSearchParams(searchParams) {
  const location = searchParams.get('location') || ''
  
  // Try multiple parameter name variations for dates
  const pickupDate = searchParams.get('pickupDate') || 
                     searchParams.get('pickup_date') || 
                     searchParams.get('startDate') || 
                     ''
  
  const returnDate = searchParams.get('returnDate') || 
                     searchParams.get('dropoffDate') || 
                     searchParams.get('return_date') || 
                     searchParams.get('endDate') || 
                     ''

  const duration = calculateDuration(pickupDate, returnDate)
  const formattedPickup = formatShortDate(pickupDate)
  const formattedReturn = formatShortDate(returnDate)

  return {
    location,
    pickupDate,
    returnDate,
    duration,
    formattedPickup,
    formattedReturn
  }
}

