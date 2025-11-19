import { useState, useEffect } from 'react'
import { extractSearchParams } from '../utils/dateHelpers'

/**
 * Custom hook for managing search parameters from URL
 * @param {URLSearchParams} searchParams - Next.js search params
 * @returns {Object} Search details and formatted dates
 */
export function useSearchParams(searchParams) {
  const [searchDetails, setSearchDetails] = useState({
    location: '',
    pickupDate: '',
    returnDate: '',
    duration: 1
  })
  const [selectedDates, setSelectedDates] = useState({
    pickup: 'Select date',
    return: 'Select date'
  })

  useEffect(() => {
    const extracted = extractSearchParams(searchParams)
    
    setSearchDetails({
      location: extracted.location,
      pickupDate: extracted.pickupDate,
      returnDate: extracted.returnDate,
      duration: extracted.duration
    })
    
    setSelectedDates({
      pickup: extracted.formattedPickup,
      return: extracted.formattedReturn
    })
  }, [searchParams])

  return { searchDetails, selectedDates }
}

