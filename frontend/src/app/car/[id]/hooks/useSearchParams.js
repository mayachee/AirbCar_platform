'use client'

import { useMemo } from 'react'

export function useSearchParams(searchParams) {
  const searchDetails = useMemo(() => {
    const location = searchParams?.get('location') || ''
    const pickupDate = searchParams?.get('pickupDate') || ''
    const returnDate = searchParams?.get('returnDate') || ''
    const pickupTime = searchParams?.get('pickupTime') || '10:00'
    const returnTime = searchParams?.get('returnTime') || '10:00'

    // Calculate duration in days
    let duration = 1
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate)
      const returnD = new Date(returnDate)
      const diffTime = Math.abs(returnD - pickup)
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
    }

    return {
      location,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      duration
    }
  }, [searchParams])

  const selectedDates = useMemo(() => {
    const pickupDate = searchParams?.get('pickupDate') || ''
    const returnDate = searchParams?.get('returnDate') || ''

    // Format dates for display
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    }

    return {
      pickup: formatDate(pickupDate),
      return: formatDate(returnDate),
      pickupRaw: pickupDate,
      returnRaw: returnDate
    }
  }, [searchParams])

  return { searchDetails, selectedDates }
}

