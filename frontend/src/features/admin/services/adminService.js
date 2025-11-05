import { apiClient } from '@/lib/api/client';

/**
 * Admin Service
 * Handles admin-specific API calls
 */
class AdminService {
  // ============ USERS API ============
  /**
   * Get all users
   * @returns {Promise} Users list
   */
  async getUsers() {
    // Increase timeout for large datasets (30 seconds)
    return apiClient.get('/users/', undefined, { timeout: 30000 });
  }

  /**
   * Get user by ID
   * @param {string|number} userId - User ID
   * @returns {Promise} User data
   */
  async getUserById(userId) {
    return apiClient.get(`/users/${userId}/`);
  }

  /**
   * Delete user
   * @param {string|number} userId - User ID
   * @returns {Promise}
   */
  async deleteUser(userId) {
    return apiClient.delete(`/users/${userId}/`);
  }

  /**
   * Update user
   * @param {string|number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user data
   */
  async updateUser(userId, userData) {
    return apiClient.patch(`/users/${userId}/`, userData);
  }

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise} Created user data
   */
  async createUser(userData) {
    return apiClient.post('/users/', userData);
  }

  // ============ PARTNERS API ============
  /**
   * Get all partners
   * @returns {Promise} Partners list
   */
  async getPartners() {
    // Increase timeout for large datasets (30 seconds)
    return apiClient.get('/partners/', undefined, { timeout: 30000 });
  }

  /**
   * Get partner by ID
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise} Partner data
   */
  async getPartnerById(partnerId) {
    return apiClient.get(`/partners/${partnerId}/`);
  }

  /**
   * Update partner
   * @param {string|number} partnerId - Partner ID
   * @param {Object} partnerData - Updated partner data
   * @returns {Promise} Updated partner data
   */
  async updatePartner(partnerId, partnerData) {
    return apiClient.patch(`/partners/${partnerId}/`, partnerData);
  }

  /**
   * Delete partner
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise}
   */
  async deletePartner(partnerId) {
    return apiClient.delete(`/partners/${partnerId}/`);
  }

  /**
   * Approve partner
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise}
   */
  async approvePartner(partnerId) {
    // Update partner verification_status to 'approved' and set is_verified to true
    return apiClient.patch(`/partners/${partnerId}/`, {
      verification_status: 'approved',
      is_verified: true
    });
  }

  /**
   * Reject partner
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise}
   */
  async rejectPartner(partnerId) {
    // Update partner verification_status to 'rejected' and set is_verified to false
    return apiClient.patch(`/partners/${partnerId}/`, {
      verification_status: 'rejected',
      is_verified: false
    });
  }

  // ============ BOOKINGS API ============
  /**
   * Get all bookings
   * @returns {Promise} Bookings list
   */
  async getBookings() {
    // Increase timeout for large datasets (30 seconds)
    return apiClient.get('/bookings/', undefined, { timeout: 30000 });
  }

  /**
   * Get booking by ID
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise} Booking data
   */
  async getBookingById(bookingId) {
    return apiClient.get(`/bookings/${bookingId}/`);
  }

  /**
   * Update booking
   * @param {string|number} bookingId - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise} Updated booking data
   */
  async updateBooking(bookingId, bookingData) {
    return apiClient.patch(`/bookings/${bookingId}/`, bookingData);
  }

  /**
   * Delete booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async deleteBooking(bookingId) {
    return apiClient.delete(`/bookings/${bookingId}/`);
  }

  /**
   * Accept booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async acceptBooking(bookingId) {
    return apiClient.post(`/bookings/${bookingId}/accept/`);
  }

  /**
   * Reject booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async rejectBooking(bookingId) {
    return apiClient.post(`/bookings/${bookingId}/reject/`);
  }

  /**
   * Cancel booking
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise}
   */
  async cancelBooking(bookingId) {
    return apiClient.post(`/bookings/${bookingId}/cancel/`);
  }

  /**
   * Get pending booking requests
   * @returns {Promise} Pending bookings list
   */
  async getPendingBookings() {
    return apiClient.get('/bookings/pending-requests/');
  }

  // ============ LISTINGS API ============
  /**
   * Get all listings
   * @returns {Promise} Listings list
   */
  async getListings() {
    // Increase timeout for large datasets (30 seconds)
    return apiClient.get('/listings/', undefined, { timeout: 30000 });
  }

  /**
   * Get listing by ID
   * @param {string|number} listingId - Listing ID
   * @returns {Promise} Listing data
   */
  async getListingById(listingId) {
    return apiClient.get(`/listings/${listingId}/`);
  }

  /**
   * Update listing
   * @param {string|number} listingId - Listing ID
   * @param {Object} listingData - Updated listing data
   * @returns {Promise} Updated listing data
   */
  async updateListing(listingId, listingData) {
    return apiClient.patch(`/listings/${listingId}/`, listingData);
  }

  /**
   * Delete listing
   * @param {string|number} listingId - Listing ID
   * @returns {Promise}
   */
  async deleteListing(listingId) {
    return apiClient.delete(`/listings/${listingId}/`);
  }

  // ============ STATISTICS API ============
  /**
   * Get platform statistics
   * @returns {Promise} Statistics data
   */
  async getStats() {
    // Increase timeout for stats (20 seconds)
    return apiClient.get('/admin/stats/', undefined, { timeout: 20000 }).catch(() => {
      // Return default stats if endpoint doesn't exist
      return {
        totalUsers: 0,
        totalBookings: 0,
        totalPartners: 0,
        totalListings: 0,
        totalEarnings: 0,
      };
    });
  }

  /**
   * Get user statistics
   * @returns {Promise} User statistics
   */
  async getUserStats() {
    return apiClient.get('/admin/users/stats/');
  }

  /**
   * Get booking statistics
   * @returns {Promise} Booking statistics
   */
  async getBookingStats() {
    return apiClient.get('/admin/bookings/stats/');
  }

  // ============ EXPORT API ============
  /**
   * Export users to CSV
   * @returns {Promise} CSV data
   */
  async exportUsers() {
    return apiClient.get('/admin/users/export/', { responseType: 'blob' });
  }

  /**
   * Export bookings to CSV
   * @returns {Promise} CSV data
   */
  async exportBookings() {
    return apiClient.get('/admin/bookings/export/', { responseType: 'blob' });
  }

  // ============ ANALYTICS API ============
  /**
   * Get platform analytics
   * @returns {Promise} Analytics data
   */
  async getAnalytics() {
    // Increase timeout for analytics (30 seconds - may involve complex calculations)
    return apiClient.get('/admin/analytics/', undefined, { timeout: 30000 });
  }

  /**
   * Get revenue analytics
   * @returns {Promise} Revenue data
   */
  async getRevenueAnalytics() {
    // Increase timeout for analytics (30 seconds - may involve complex calculations)
    return apiClient.get('/admin/revenue/', undefined, { timeout: 30000 });
  }

  // ============ NOTIFICATIONS API ============
  /**
   * Send notification to users
   * @param {Object} notificationData - Notification data
   * @returns {Promise}
   */
  async sendNotification(notificationData) {
    return apiClient.post('/admin/notifications/send/', notificationData);
  }

  // ============ REPORTS API ============
  /**
   * Generate report
   * @param {Object} reportData - Report parameters
   * @returns {Promise} Report data
   */
  async generateReport(reportData) {
    return apiClient.post('/admin/reports/generate/', reportData);
  }

  // ============ SETTINGS API ============
  /**
   * Get platform settings
   * @returns {Promise} Settings data
   */
  async getSettings() {
    return apiClient.get('/admin/settings/');
  }

  /**
   * Update platform settings
   * @param {Object} settingsData - Settings to update
   * @returns {Promise} Updated settings
   */
  async updateSettings(settingsData) {
    return apiClient.patch('/admin/settings/', settingsData);
  }
}

export const adminService = new AdminService();
