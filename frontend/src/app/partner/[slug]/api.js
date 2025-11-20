/**
 * API functions for fetching partner profile data
 */

export async function fetchPartnerProfile(slug) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    
    console.log('🔍 Fetching partner profile for slug:', slug);
    console.log('🔍 API URL:', apiUrl);
    
    // Backend only supports fetching by ID (UUID), not slug
    // The slug parameter should be the partner's UUID
    let response;
    
    try {
      // Try fetching by ID directly (slug should be the UUID)
      const partnerUrl = `${apiUrl}/partners/${slug}/`;
      console.log('🔍 Fetching from:', partnerUrl);
      
      response = await fetch(partnerUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      });
      
      console.log('🔍 Response status:', response.status, response.statusText);
    } catch (fetchError) {
      // Network error - backend might not be running
      console.error('❌ Network error fetching partner:', fetchError);
      console.error('❌ Error details:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      });
      throw new Error(`Failed to connect to backend: ${fetchError.message}`);
    }

    if (!response.ok) {
      console.warn('⚠️ Partner fetch failed:', response.status, response.statusText);
      
      if (response.status === 404) {
        console.warn('⚠️ Partner not found (404)');
        return null;
      }
      
      // Try to get error message from response
      let errorMessage = `Failed to fetch partner: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('❌ Error response:', errorData);
      } catch (e) {
        // Response is not JSON, use status
        console.error('❌ Could not parse error response as JSON');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Partner data received:', { hasData: !!data, keys: data ? Object.keys(data) : [] });
    
    // Handle different response structures
    const partner = data.data || data;
    
    if (!partner || !partner.id) {
      console.warn('⚠️ Partner data is invalid:', { partner, hasId: !!partner?.id });
      return null;
    }
    
    console.log('✅ Partner found:', { id: partner.id, name: partner.business_name || partner.company_name });
    
    // Fetch listings for this partner
    try {
      const listingsResponse = await fetch(`${apiUrl}/listings/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      });

      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        const allListings = listingsData.data || listingsData || [];
        // Filter listings by partner ID
        partner.listings = allListings.filter(listing => {
          const listingPartnerId = listing.partner?.id || listing.partner_id || listing.partner;
          return listingPartnerId === partner.id || listingPartnerId === partner.id.toString();
        });
      } else {
        partner.listings = [];
      }
    } catch (err) {
      console.warn('Failed to fetch partner listings:', err);
      partner.listings = [];
    }

    return partner;
  } catch (error) {
    console.error('Error fetching partner profile:', error);
    // Re-throw with more context
    if (error.message.includes('Failed to connect') || error.message.includes('fetch failed')) {
      throw new Error('Unable to connect to the backend server. Please ensure the backend is running.');
    }
    throw error;
  }
}

