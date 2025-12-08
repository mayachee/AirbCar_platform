import { apiClient } from '@/lib/api/client'
import { enhancedApiClient } from '@/lib/api/enhancedClient'

/**
 * Booking Service - API integration for bookings
 * Uses enhanced client for better error handling and retry logic
 */
export class BookingService {
  // Use enhanced client if available, fallback to regular client
  get client() {
    return enhancedApiClient || apiClient;
  }
  async getBookings() {
    // Enhanced client handles retries and timeouts automatically
    const response = await this.client.get('/bookings/', undefined, { timeout: 120000 })
    // Client returns { data, success, message }
    // Backend returns { data: [...], count, total_count, page, page_size }
    // So response.data is { data: [...], count, ... }
    // We need to return response.data.data (the actual array) or response.data
    console.log('📡 BookingService.getBookings response:', response);
    if (response && response.data) {
      // If response.data has a 'data' property, return that (backend structure)
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // If response.data is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Otherwise return the whole response.data object
      return response.data;
    }
    return response.data || [];
  }

  async getBooking(bookingId) {
    const response = await this.client.get(`/bookings/${bookingId}/`)
    return response.data
  }

  async createBooking(bookingData) {
    // Enhanced client handles file uploads and retries
    const response = await this.client.post('/bookings/', bookingData, { timeout: 120000 })
    return response.data
  }

  async cancelBooking(bookingId) {
    const response = await this.client.post(`/bookings/${bookingId}/cancel/`)
    return response.data
  }

  async acceptBooking(bookingId) {
    const response = await this.client.post(`/bookings/${bookingId}/accept/`)
    return response.data
  }

  async rejectBooking(bookingId, rejectionReason = '') {
    const response = await this.client.post(`/bookings/${bookingId}/reject/`, { 
      rejection_reason: rejectionReason 
    })
    return response.data
  }

  async getPendingRequests() {
    const response = await this.client.get('/bookings/pending-requests/')
    return response.data
  }

  async getUpcomingBookings() {
    try {
      const response = await this.client.get('/bookings/upcoming/', undefined, { timeout: 120000 })
      // Handle different response structures
      if (Array.isArray(response)) {
        return response
      }
      if (response.data) {
        return Array.isArray(response.data) ? response.data : []
      }
      return []
    } catch (error) {
      console.warn('Error fetching upcoming bookings:', error)
      return []
    }
  }

  /**
   * Update booking (full update - PUT)
   * @param {string|number} bookingId - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise} Updated booking data
   */
  async updateBooking(bookingId, bookingData) {
    const response = await this.client.put(`/bookings/${bookingId}/`, bookingData)
    return response.data
  }

  /**
   * Update booking (partial update - PATCH)
   * @param {string|number} bookingId - Booking ID
   * @param {Object} bookingData - Partial booking data
   * @returns {Promise} Updated booking data
   */
  async patchBooking(bookingId, bookingData) {
    const response = await this.client.patch(`/bookings/${bookingId}/`, bookingData)
    return response.data
  }

  /**
   * Delete booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async deleteBooking(bookingId) {
    const response = await this.client.delete(`/bookings/${bookingId}/`)
    return response.data
  }
}

// Create and export a singleton instance
export const bookingService = new BookingService()

// Export as both bookingService and bookingsService for compatibility
export { bookingService as bookingsService }
