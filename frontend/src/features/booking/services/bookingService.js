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

  _extractList(payload) {
    // Supports shapes like:
    // - [ ... ]
    // - { data: [ ... ] }
    // - { data: { data: [ ... ], ... } }
    // - { data: { results: [ ... ] } }
    // - axios-like response { data: ... }
    if (!payload) return []

    // If caller passed axios response, unwrap once
    const root = payload?.data !== undefined ? payload.data : payload

    if (Array.isArray(root)) return root

    // Backend common: { data: [...] }
    if (Array.isArray(root?.data)) return root.data

    // Nested wrapper: { data: { data: [...] } }
    if (Array.isArray(root?.data?.data)) return root.data.data

    // DRF pagination style: { results: [...] }
    if (Array.isArray(root?.results)) return root.results
    if (Array.isArray(root?.data?.results)) return root.data.results

    return []
  }

  async getBookings() {
    // Enhanced client handles retries and timeouts automatically
    const response = await this.client.get('/bookings/', undefined, { timeout: 120000 })
    return this._extractList(response)
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
    // Preserve backward compat: some call sites expect array, some expect object.
    // Return array when possible.
    const list = this._extractList(response)
    return list.length > 0 ? list : (response?.data ?? [])
  }

  async getUpcomingBookings() {
    try {
      const response = await this.client.get('/bookings/upcoming/', undefined, { timeout: 120000 })
      return this._extractList(response)
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
