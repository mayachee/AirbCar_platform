export function computeFleetInsights(listings) {
  if (!Array.isArray(listings) || !listings.length) {
    return { minPrice: null, maxRating: null, locationCount: 0 }
  }

  // Parse price_per_day - can be string or number
  const prices = listings
    .map((listing) => {
      const price = listing.price_per_day
      if (typeof price === 'number') return price
      if (typeof price === 'string') {
        const parsed = parseFloat(price)
        return isNaN(parsed) ? null : parsed
      }
      return null
    })
    .filter((price) => price !== null && !Number.isNaN(price))
  
  // Parse ratings - can be string or number
  const ratings = listings
    .map((listing) => {
      const rating = listing.rating
      if (typeof rating === 'number') return rating
      if (typeof rating === 'string') {
        const parsed = parseFloat(rating)
        return isNaN(parsed) ? null : parsed
      }
      return null
    })
    .filter((rating) => rating !== null && !Number.isNaN(rating))
  
  const locations = new Set(
    listings
      .map((listing) => listing.location?.trim())
      .filter(Boolean)
  )

  return {
    minPrice: prices.length ? Math.min(...prices) : null,
    maxRating: ratings.length ? Math.max(...ratings).toFixed(1) : null,
    locationCount: locations.size,
  }
}

