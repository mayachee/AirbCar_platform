/**
 * Utility functions for partner profile page
 */

/**
 * Compute insights from partner's fleet of listings
 */
export function computeFleetInsights(listings = []) {
  if (!listings || listings.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      maxRating: 0,
      avgRating: 0,
      locationCount: 0,
      totalVehicles: 0,
      locations: [],
    };
  }

  const prices = listings
    .map(listing => parseFloat(listing.price_per_day || listing.price || listing.dailyRate || 0))
    .filter(price => price > 0);

  const ratings = listings
    .map(listing => parseFloat(listing.rating || 0))
    .filter(rating => rating > 0);

  const locations = [...new Set(listings.map(listing => listing.location).filter(Boolean))];

  return {
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    maxRating: ratings.length > 0 ? Math.max(...ratings) : 0,
    avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    locationCount: locations.length,
    totalVehicles: listings.length,
    locations,
  };
}

