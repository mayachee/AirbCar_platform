import { apiClient } from '@/lib/api/client'

/**
 * Booking Service - API integration for bookings
 */
export class BookingService {
  async getBookings() {
    const response = await apiClient.get('/bookings/')
    // apiClient returns { data, success, message }
    return response.data
  }

  async getBooking(bookingId) {
    const response = await apiClient.get(`/bookings/${bookingId}/`)
    return response.data
  }

  async createBooking(bookingData) {
    const response = await apiClient.post('/bookings/', bookingData)
    return response.data
  }

  async cancelBooking(bookingId) {
    const response = await apiClient.post(`/bookings/${bookingId}/cancel/`)
    return response.data
  }

  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/bookings/${bookingId}/accept/`)
    return response.data
  }

  async rejectBooking(bookingId, rejectionReason = '') {
    const response = await apiClient.post(`/bookings/${bookingId}/reject/`, { 
      rejection_reason: rejectionReason 
    })
    return response.data
  }

  async getPendingRequests() {
    const response = await apiClient.get('/bookings/pending-requests/')
    return response.data
  }

  async getUpcomingBookings() {
    try {
      const response = await apiClient.get('/bookings/upcoming/')
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
    const response = await apiClient.put(`/bookings/${bookingId}/`, bookingData)
    return response.data
  }

  /**
   * Update booking (partial update - PATCH)
   * @param {string|number} bookingId - Booking ID
   * @param {Object} bookingData - Partial booking data
   * @returns {Promise} Updated booking data
   */
  async patchBooking(bookingId, bookingData) {
    const response = await apiClient.patch(`/bookings/${bookingId}/`, bookingData)
    return response.data
  }

  /**
   * Delete booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async deleteBooking(bookingId) {
    const response = await apiClient.delete(`/bookings/${bookingId}/`)
    return response.data
  }
}

// Create and export a singleton instance
export const bookingService = new BookingService()

// Export as both bookingService and bookingsService for compatibility
export { bookingService as bookingsService }
