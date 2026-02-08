import { apiClient } from '@/lib/api/client'

/**
 * Fetch partner profile by slug or ID
 * @param {string|number} slug - Partner slug identifier or ID
 * @returns {Promise<Object|null>} Partner data or null if not found
 */
export async function fetchPartnerProfile(slug) {
  try {
    // Try to fetch by slug first (if backend supports it)
    // Otherwise, try to fetch all partners and find by slug
    let response
    
    // Check if slug is numeric (ID)
    if (!isNaN(slug)) {
      // Direct ID lookup
      response = await apiClient.get(`/partners/${slug}/`)
    } else {
      // Try to find partner by slug from list
      const partnersResponse = await apiClient.get('/partners/')
      const partners = partnersResponse?.data?.data || partnersResponse?.data || []
      
      // Find partner by slug, business_name, or other identifier
      const partner = partners.find(p => 
        p.slug === slug || 
        p.business_name?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase() ||
        p.id?.toString() === slug
      )
      
      if (!partner) {
        return null
      }
      
      // Fetch full partner details by ID
      response = await apiClient.get(`/partners/${partner.id}/`)
    }
    
    // Handle different response structures
    const partnerData = response?.data?.data || response?.data || response
    
    return partnerData || null
  } catch (error) {
    console.error('Error fetching partner profile:', error)
    
    // Return null for 404 errors (partner not found)
    if (error.response?.status === 404) {
      return null
    }
    
    // Re-throw other errors
    throw error
  }
}

