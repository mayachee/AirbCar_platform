import { apiClient } from '@/lib/api/client'

/**
 * Partner Service - Complete API integration
 */
export const partnerService = {
  // Partner Management
  async registerPartner(partnerData) {
    const business_name =
      partnerData.business_name ||
      partnerData.businessName ||
      partnerData.company_name ||
      partnerData.companyName ||
      partnerData.businessName ||
      ''

    const business_type =
      partnerData.business_type ||
      partnerData.businessType ||
      ''

    const payload = {
      business_name,
      business_type,
      business_license:
        partnerData.business_license ||
        partnerData.businessLicense ||
        partnerData.licenseNumber ||
        undefined,
      tax_id: partnerData.tax_id || partnerData.taxId || undefined,
      bank_account: partnerData.bank_account || partnerData.bankAccount || undefined,
      description: partnerData.description || undefined,
      phone_number: partnerData.phone_number || partnerData.phone || undefined,
      address: partnerData.address || undefined,
      city: partnerData.city || undefined,
      state: partnerData.state || undefined,
      agree_on_terms:
        partnerData.agree_on_terms !== undefined ? partnerData.agree_on_terms : true
    }

    // Remove undefined keys so DRF doesn't get noisy
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    return apiClient.post('/partners/', payload)
  },

  async getPartnerProfile() {
    return apiClient.get('/partners/me/')
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
    // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
    return apiClient.get('/bookings/', undefined, { timeout: 90000 })
  },

  async getPendingRequests() {
    // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
    return apiClient.get('/bookings/pending-requests/', undefined, { timeout: 90000 })
  },

  async getUpcomingBookings() {
    // Increase timeout to 90 seconds for bookings (Render free tier can be slow)
    return apiClient.get('/bookings/upcoming/', undefined, { timeout: 90000 })
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
    // Partner dashboard only makes sense if a partner profile exists.
    // Fetch partner profile first so we can skip partner-only endpoints when missing.
    let partnerResponse;
    try {
      partnerResponse = await this.getPartnerProfile();
    } catch (error) {
      if (error?.status === 404 && (error?.message || '').toLowerCase().includes('partner profile not found')) {
        return {
          partner: null,
          vehicles: [],
          bookings: [],
          pendingRequests: [],
          has_partner_profile: false,
          error: error.message || 'Partner profile not found'
        };
      }
      throw error;
    }

    // API client wraps backend JSON as: { data: backendResponse, success: true }
    // Backend partner endpoint returns: { data: partner }
    const partnerData = partnerResponse?.data?.data || null;
    if (!partnerData) {
      return {
        partner: null,
        vehicles: [],
        bookings: [],
        pendingRequests: [],
        has_partner_profile: false,
        error: 'Partner profile not found'
      };
    }

    // Fetch partner-only data in parallel now that we have a valid partner.
    const [bookingsResult, pendingRequestsResult] = await Promise.allSettled([
      this.getBookings(),
      this.getPendingRequests()
    ]);

    const bookingsData = bookingsResult.status === 'fulfilled' ? bookingsResult.value : null;
    const pendingData = pendingRequestsResult.status === 'fulfilled' ? pendingRequestsResult.value : null;

    // Fetch full vehicle details - get listings from the listings endpoint filtered by partner
    let vehiclesData = [];
    try {
      const partnerId = partnerData?.id;
      if (partnerId) {
        const vehiclesResponse = await this.getVehiclesByPartnerId(partnerId);
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

    const bookingsList = bookingsData?.data?.data || bookingsData?.data || [];
    const pendingList = pendingData?.data?.data || pendingData?.data || [];

    return {
      partner: partnerData,
      vehicles: vehiclesData, // Full vehicle details
      bookings: Array.isArray(bookingsList) ? bookingsList : [],
      pendingRequests: Array.isArray(pendingList) ? pendingList : [],
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
      const vehiclesData = Array.isArray(partner?.data?.data?.listings)
        ? partner.data.data.listings
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