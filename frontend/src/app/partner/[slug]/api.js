// Use NEXT_PUBLIC_ prefix for server-side rendering compatibility
// For server-side fetch in Next.js, use localhost which works better than 127.0.0.1
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  process.env.DJANGO_API_URL ||
  'http://localhost:8000'

export async function fetchPartnerProfile(slugOrId) {
  const url = `${API_BASE_URL}/api/partners/public/${slugOrId}/`
  
  try {
    console.log(`[PartnerPage] Fetching partner from: ${url}`)
    
    // Use the public partners endpoint which uses PublicPartnerSerializer
    // This endpoint is designed for public viewing and accepts both numeric ID and slug
    const response = await fetch(url, {
      // Revalidate periodically so public data stays fresh but cached (3 minutes)
      next: { revalidate: 180 },
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[PartnerPage] API error: ${response.status} - ${errorText}`)
      
      if (response.status === 404) {
        return null
      }

      throw new Error(
        `Failed to load partner profile: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    console.log(`[PartnerPage] Successfully fetched partner: ${data.company_name || slugOrId}`)
    
    // Log statistics for debugging
    console.log(`[PartnerPage] Partner statistics:`, {
      total_listings: data.total_listings,
      total_bookings: data.total_bookings,
      average_rating: data.average_rating,
    })
    
    // Log image information for debugging
    if (data.listings && Array.isArray(data.listings)) {
      const listingsWithImages = data.listings.filter(l => l.pictures && l.pictures.length > 0)
      console.log(`[PartnerPage] Partner has ${listingsWithImages.length} listings with images out of ${data.listings.length} total listings`)
      listingsWithImages.forEach((listing, idx) => {
        console.log(`[PartnerPage] Listing ${idx + 1}: ${listing.pictures.length} images`, listing.pictures)
      })
    }
    if (data.logo) {
      console.log(`[PartnerPage] Partner logo: ${data.logo}`)
    }
    if (data.user?.profile_picture) {
      console.log(`[PartnerPage] Owner profile picture: ${data.user.profile_picture}`)
    }
    
    return data
  } catch (error) {
    console.error('[PartnerPage] Error fetching partner profile:', {
      url,
      error: error.message,
      name: error.name,
      cause: error.cause,
    })
    
    // If it's a network error, provide helpful message
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      throw new Error(
        `Failed to connect to backend API. Please ensure the backend server is running at ${API_BASE_URL}`
      )
    }
    
    // Re-throw with more context
    throw new Error(`Failed to fetch partner profile: ${error.message}`)
  }
}

