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

  // Dashboard & Analytics
  async getDashboardData() {
    // Get all partner data in parallel
    const [partner, bookings, pendingRequests] = await Promise.all([
      this.getPartnerProfile(),
      this.getBookings(),
      this.getPendingRequests()
    ])

    // Fetch full vehicle details - get listings from the listings endpoint filtered by partner
    let vehiclesData = [];
    try {
      const partnerId = partner.data?.id;
      if (partnerId) {
        const vehiclesResponse = await this.getVehiclesByPartnerId(partnerId);
        vehiclesData = Array.isArray(vehiclesResponse.data) 
          ? vehiclesResponse.data 
          : vehiclesResponse.data?.results || vehiclesResponse.data?.listings || [];
      }
    } catch (error) {
      console.error('Error fetching full vehicle details:', error);
      // Fallback to brief listings from partner profile
      vehiclesData = partner.data.listings || [];
    }

    return {
      partner: partner.data,
      vehicles: vehiclesData, // Full vehicle details
      bookings: bookings.data || [],
      pendingRequests: pendingRequests.data || []
    }
  },

  async getStats() {
    const [partner, bookings, pendingRequests] = await Promise.all([
      this.getPartnerProfile(),
      this.getBookings(),
      this.getPendingRequests()
    ])

    const vehiclesData = partner.data.listings || []
    const bookingsData = bookings.data || []
    const pendingData = pendingRequests.data || []

    // Calculate stats
    const totalVehicles = vehiclesData.length
    const activeBookings = bookingsData.filter(b => b.status === 'accepted').length
    const pendingRequestsCount = pendingData.length
    const completedRentals = bookingsData.filter(b => b.status === 'completed').length
    
    // Calculate monthly earnings
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyEarnings = bookingsData
      .filter(b => {
        const bookingDate = new Date(b.start_time)
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               b.status === 'completed'
      })
      .reduce((sum, b) => sum + (b.total_price || 0), 0)

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
  }
}