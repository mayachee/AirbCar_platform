import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/constants'

/**
 * Partner Service - Complete API integration
 */
export const partnerService = {
  // Partner Management
  async registerPartner(partnerData) {
    return apiClient.post('/partners/', {
      company_name: partnerData.businessName || partnerData.company_name,
      tax_id: partnerData.licenseNumber || partnerData.tax_id,
      agree_on_terms: partnerData.agree_on_terms !== undefined ? partnerData.agree_on_terms : true
    })
  },

  async getPartnerProfile() {
    try {
      return await apiClient.get('/partners/me/')
    } catch (error) {
      // If 404 and error message indicates missing profile, return a structured response
      if (error?.status === 404 && error?.message?.includes('Partner profile not found')) {
        return {
          data: null,
          has_partner_profile: false,
          error: error.message
        }
      }
      throw error
    }
  },

  async getPartnerById(partnerId) {
    return apiClient.get(`/partners/${partnerId}/`)
  },

  async updatePartnerProfile(profileData) {
    return apiClient.patch('/partners/me/', profileData)
  },

  async updatePartner(partnerId, partnerData) {
    return apiClient.put(`/partners/${partnerId}/`, partnerData)
  },

  async patchPartner(partnerId, partnerData) {
    return apiClient.patch(`/partners/${partnerId}/`, partnerData)
  },

  async deletePartner(partnerId) {
    return apiClient.delete(`/partners/${partnerId}/`)
  },

  // Vehicle Management (Listings)
  async getVehicles() {
    // Get partner's vehicles from their profile (includes listings)
    const partnerProfile = await this.getPartnerProfile();
    return { data: partnerProfile.listings || [] };
  },

  async getVehiclesByPartnerId(partnerId) {
    // Alternative method: Get vehicles filtered by partner_id
    return apiClient.get(`/listings/?partner_id=${partnerId}`)
  },

  async getVehicle(vehicleId) {
    return apiClient.get(`/listings/${vehicleId}/`)
  },

  async addVehicle(vehicleData) {
    return apiClient.post('/listings/', vehicleData)
  },

  async addVehiclesBulk(vehiclesArray) {
    // Send array of vehicles for bulk creation
    // Increase timeout to 90 seconds for bulk operations (processing multiple vehicles may take time)
    return apiClient.post('/listings/', { vehicles: vehiclesArray }, { timeout: 90000 })
  },

  async updateVehicle(vehicleId, vehicleData) {
    return apiClient.put(`/listings/${vehicleId}/`, vehicleData)
  },

  async patchVehicle(vehicleId, vehicleData) {
    return apiClient.patch(`/listings/${vehicleId}/`, vehicleData)
  },

  async deleteVehicle(vehicleId) {
    return apiClient.delete(`/listings/${vehicleId}/`)
  },

  // Booking Management
  async getBookings() {
    return apiClient.get('/bookings/')
  },

  async getPendingRequests() {
    return apiClient.get('/bookings/pending-requests/')
  },

  async getUpcomingBookings() {
    return apiClient.get('/bookings/upcoming/')
  },

  async acceptBooking(bookingId) {
    return apiClient.post(`/bookings/${bookingId}/accept/`)
  },

  async rejectBooking(bookingId, rejectionReason = '') {
    return apiClient.post(`/bookings/${bookingId}/reject/`, {
      rejection_reason: rejectionReason
    })
  },

  async cancelBooking(bookingId) {
    return apiClient.post(`/bookings/${bookingId}/cancel/`)
  },

  async getCustomerInfo(bookingId) {
    return apiClient.get(`/bookings/${bookingId}/customer-info/`)
  },

  // Dashboard & Analytics
  async getDashboardData() {
    // Get all partner data in parallel
    const [partnerResult, bookings, pendingRequests] = await Promise.allSettled([
      this.getPartnerProfile(),
      this.getBookings(),
      this.getPendingRequests()
    ])
    
    // Debug: Log the raw partner result
    console.log('getDashboardData - partnerResult:', partnerResult);
    console.log('getDashboardData - partnerResult.value:', partnerResult.status === 'fulfilled' ? partnerResult.value : 'rejected');
    
    // Handle partner profile result
    // API client returns { data: {...}, success: true }
    // Backend returns { data: {...} }, so API client wraps it: { data: { data: {...} }, success: true }
    let partnerResponse = partnerResult.status === 'fulfilled' 
      ? partnerResult.value 
      : { data: null, has_partner_profile: false, error: partnerResult.reason?.message }
    
    // Extract partner data - handle nested data structure
    // API client returns: { data: backendResponse, success: true }
    // Backend returns: { data: {...} } for success or { error: '...', has_partner_profile: false } for 404
    // So structure is: { data: { data: {...} }, success: true } OR { data: { error: '...', has_partner_profile: false }, success: true }
    let partnerData = null;
    if (partnerResponse && partnerResponse.data) {
      const backendResponse = partnerResponse.data;
      
      // Check if backend returned an error (404 case)
      if (backendResponse.has_partner_profile === false) {
        console.log('getDashboardData - Backend says no partner profile');
        partnerData = null;
      } 
      // Check if backend response has nested data
      else if (backendResponse.data && typeof backendResponse.data === 'object') {
        // Backend returned { data: {...} }, API client wrapped it: { data: { data: {...} } }
        partnerData = backendResponse.data;
        console.log('getDashboardData - Extracted nested data:', partnerData);
      } 
      // Backend might return data directly (shouldn't happen but handle it)
      else if (typeof backendResponse === 'object' && backendResponse.business_name !== undefined) {
        // Direct partner object
        partnerData = backendResponse;
        console.log('getDashboardData - Using direct data:', partnerData);
      }
      // Check if it's already the partner object
      else if (backendResponse.business_name || backendResponse.tax_id) {
        partnerData = backendResponse;
        console.log('getDashboardData - Using backendResponse as partnerData:', partnerData);
      }
    }
    
    // Final check - if still null, log what we have
    if (!partnerData && partnerResponse) {
      console.warn('getDashboardData - Could not extract partnerData. partnerResponse structure:', {
        hasData: !!partnerResponse.data,
        dataType: typeof partnerResponse.data,
        dataKeys: partnerResponse.data ? Object.keys(partnerResponse.data) : [],
        fullResponse: partnerResponse
      });
    }
    
    console.log('getDashboardData - Extracted partnerData:', partnerData);
    console.log('getDashboardData - partnerData keys:', partnerData ? Object.keys(partnerData) : 'null');
    
    // If partner profile doesn't exist, return early with empty data
    if (!partnerData && partnerResponse.has_partner_profile === false) {
      return {
        partner: null,
        vehicles: [],
        bookings: bookings.status === 'fulfilled' ? (bookings.value.data || []) : [],
        pendingRequests: pendingRequests.status === 'fulfilled' ? (pendingRequests.value.data || []) : [],
        has_partner_profile: false,
        error: partnerResponse.error || 'Partner profile not found'
      }
    }
    
    // Extract data from fulfilled promises
    const bookingsData = bookings.status === 'fulfilled' ? bookings.value : { data: [] }
    const pendingData = pendingRequests.status === 'fulfilled' ? pendingRequests.value : { data: [] }

    // Fetch full vehicle details - get listings from the listings endpoint filtered by partner
    let vehiclesData = [];
    try {
      const partnerId = partnerData?.id;
      if (partnerId) {
        const vehiclesResponse = await this.getVehiclesByPartnerId(partnerId);
        console.log('getDashboardData - vehiclesResponse:', vehiclesResponse);
        // API client wraps: { data: backendResponse, success: true }
        // Backend returns: { data: [...], count: N, message: '...' }
        // So we need: vehiclesResponse.data.data
        if (vehiclesResponse.data) {
          if (Array.isArray(vehiclesResponse.data)) {
            // Direct array (shouldn't happen but handle it)
            vehiclesData = vehiclesResponse.data;
          } else if (Array.isArray(vehiclesResponse.data.data)) {
            // Nested structure: { data: { data: [...] } }
            vehiclesData = vehiclesResponse.data.data;
          } else if (Array.isArray(vehiclesResponse.data.results)) {
            // Paginated structure: { data: { results: [...] } }
            vehiclesData = vehiclesResponse.data.results;
          } else if (Array.isArray(vehiclesResponse.data.listings)) {
            // Alternative structure
            vehiclesData = vehiclesResponse.data.listings;
          }
        }
        console.log('getDashboardData - Extracted vehiclesData:', vehiclesData.length, vehiclesData);
      }
    } catch (error) {
      console.error('Error fetching full vehicle details:', error);
      console.error('Error details:', {
        message: error.message,
        status: error?.status,
        data: error?.data
      });
      // Fallback to brief listings from partner profile
      vehiclesData = partnerData?.listings || [];
    }

    console.log('getDashboardData - Returning partner data:', {
      partner: partnerData,
      partnerKeys: partnerData ? Object.keys(partnerData) : [],
      hasBusinessName: !!partnerData?.business_name,
      hasTaxId: !!partnerData?.tax_id
    });

    return {
      partner: partnerData,
      vehicles: vehiclesData, // Full vehicle details
      bookings: bookingsData.data || [],
      pendingRequests: pendingData.data || [],
      has_partner_profile: true
    }
  },

  async getStats() {
    try {
      const [partner, bookings, pendingRequests] = await Promise.all([
        this.getPartnerProfile(),
        this.getBookings(),
        this.getPendingRequests()
      ])

      // Ensure vehiclesData is always an array
      const vehiclesData = Array.isArray(partner?.data?.listings) 
        ? partner.data.listings 
        : []

      // Ensure bookingsData is always an array - handle different response structures
      let bookingsData = []
      if (bookings?.data) {
        if (Array.isArray(bookings.data)) {
          bookingsData = bookings.data
        } else if (Array.isArray(bookings.data.results)) {
          bookingsData = bookings.data.results
        } else if (Array.isArray(bookings.data.data)) {
          bookingsData = bookings.data.data
        }
      } else if (Array.isArray(bookings)) {
        bookingsData = bookings
      }

      // Ensure pendingData is always an array
      let pendingData = []
      if (pendingRequests?.data) {
        if (Array.isArray(pendingRequests.data)) {
          pendingData = pendingRequests.data
        } else if (Array.isArray(pendingRequests.data.results)) {
          pendingData = pendingRequests.data.results
        } else if (Array.isArray(pendingRequests.data.data)) {
          pendingData = pendingRequests.data.data
        }
      } else if (Array.isArray(pendingRequests)) {
        pendingData = pendingRequests
      }

      // Calculate stats - now safe to use filter since we know it's an array
      const totalVehicles = vehiclesData.length
      const activeBookings = bookingsData.filter(b => b.status === 'accepted').length
      const pendingRequestsCount = pendingData.length
      const completedRentals = bookingsData.filter(b => b.status === 'completed').length
      
      // Calculate monthly earnings
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyEarnings = bookingsData
        .filter(b => {
          if (!b.start_time && !b.start_date && !b.pickup_date) return false
          const bookingDate = new Date(b.start_time || b.start_date || b.pickup_date)
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear &&
                 b.status === 'completed'
        })
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || parseFloat(b.total_amount) || 0), 0)

      // Calculate average rating (mock for now)
      const averageRating = 4.5

      return {
        totalVehicles,
        activeBookings,
        pendingRequests: pendingRequestsCount,
        completedRentals,
        monthlyEarnings,
        averageRating
      }
    } catch (error) {
      console.error('Error calculating partner stats:', error)
      // Return default stats on error
      return {
        totalVehicles: 0,
        activeBookings: 0,
        pendingRequests: 0,
        completedRentals: 0,
        monthlyEarnings: 0,
        averageRating: 0
      }
    }
  },

  // Partner Earnings
  async getEarnings() {
    return apiClient.get('/partners/me/earnings/')
  },

  // Partner Analytics
  async getAnalytics(timeRange = '30d') {
    return apiClient.get(`/partners/me/analytics/?range=${timeRange}`)
  },

  // Partner Reviews
  async getReviews() {
    return apiClient.get('/partners/me/reviews/')
  },

  // Partner Activity
  async getActivity() {
    return apiClient.get('/partners/me/activity/')
  }
}