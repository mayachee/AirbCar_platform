'use client'

export function useSearchParams(searchParams) {
  // Extract search parameters from URL
  const location = searchParams.get('location') || ''
  const pickupDate = searchParams.get('pickup_date') || searchParams.get('pickupDate') || ''
  const returnDate = searchParams.get('return_date') || searchParams.get('returnDate') || ''
  const pickupTime = searchParams.get('pickup_time') || searchParams.get('pickupTime') || '10:00'
  const returnTime = searchParams.get('return_time') || searchParams.get('returnTime') || '10:00'

  // Calculate duration in days
  const calculateDuration = () => {
    if (!pickupDate || !returnDate) return 1
    
    const pickup = new Date(pickupDate)
    const return_d = new Date(returnDate)
    const diffTime = Math.abs(return_d - pickup)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays || 1
  }

  const duration = calculateDuration()

  const searchDetails = {
    location,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    duration
  }

  const selectedDates = {
    pickup: pickupDate,
    return: returnDate,
    pickupTime,
    returnTime
  }

  return { searchDetails, selectedDates }
}

