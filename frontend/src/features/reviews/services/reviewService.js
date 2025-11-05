import { apiClient } from '@/lib/api/client';

/**
 * Review Service - API integration for reviews
 */
export class ReviewService {
  /**
   * Get all reviews for a listing
   * @param {number} listingId - Listing ID
   * @returns {Promise} Reviews list
   */
  async getReviewsByListing(listingId) {
    const response = await apiClient.get(`/reviews/?listing=${listingId}`);
    return response.data;
  }

  /**
   * Get all reviews by a user
   * @param {number} userId - User ID
   * @returns {Promise} Reviews list
   */
  async getReviewsByUser(userId) {
    const response = await apiClient.get(`/reviews/?user=${userId}`);
    return response.data;
  }

  /**
   * Get a single review by ID
   * @param {number} reviewId - Review ID
   * @returns {Promise} Review data
   */
  async getReview(reviewId) {
    const response = await apiClient.get(`/reviews/${reviewId}/`);
    return response.data;
  }

  /**
   * Create a new review
   * @param {Object} reviewData - Review data { listing, booking?, rating, comment }
   * @returns {Promise} Created review
   */
  async createReview(reviewData) {
    const response = await apiClient.post('/reviews/', reviewData);
    return response.data;
  }

  /**
   * Update an existing review
   * @param {number} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise} Updated review
   */
  async updateReview(reviewId, reviewData) {
    const response = await apiClient.patch(`/reviews/${reviewId}/`, reviewData);
    return response.data;
  }

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   * @returns {Promise}
   */
  async deleteReview(reviewId) {
    const response = await apiClient.delete(`/reviews/${reviewId}/`);
    return response.data;
  }

  /**
   * Check if user can review a listing
   * @param {number} listingId - Listing ID
   * @param {number} bookingId - Optional booking ID
   * @returns {Promise} { can_review, reason?, has_completed_booking }
   */
  async canReview(listingId, bookingId = null) {
    const params = new URLSearchParams({ listing: listingId });
    if (bookingId) {
      params.append('booking', bookingId);
    }
    const response = await apiClient.get(`/reviews/can_review/?${params.toString()}`);
    return response.data;
  }

  /**
   * Publish/unpublish a review (Partner only)
   * @param {number} reviewId - Review ID
   * @param {boolean} isPublished - Publish status
   * @returns {Promise} Updated review
   */
  async publishReview(reviewId, isPublished = true) {
    const response = await apiClient.patch(`/reviews/${reviewId}/publish/`, {
      is_published: isPublished
    });
    return response.data;
  }

  /**
   * Get reviews for partner's listings (includes unpublished)
   * @returns {Promise} Reviews list
   */
  async getMyListingsReviews() {
    const response = await apiClient.get('/reviews/?my_listings=true');
    return response.data;
  }

  /**
   * Vote helpful/not helpful on a review
   * @param {number} reviewId - Review ID
   * @param {boolean} isHelpful - Whether the review is helpful
   * @returns {Promise} Updated review
   */
  async voteReview(reviewId, isHelpful = true) {
    const response = await apiClient.post(`/reviews/${reviewId}/vote/`, {
      is_helpful: isHelpful
    });
    return response.data;
  }

  /**
   * Remove vote from a review
   * @param {number} reviewId - Review ID
   * @returns {Promise}
   */
  async removeVote(reviewId) {
    const response = await apiClient.delete(`/reviews/${reviewId}/vote/`);
    return response.data;
  }

  /**
   * Owner responds to a review
   * @param {number} reviewId - Review ID
   * @param {string} responseText - Response text
   * @returns {Promise} Updated review
   */
  async respondToReview(reviewId, responseText) {
    const response = await apiClient.post(`/reviews/${reviewId}/respond/`, {
      owner_response: responseText
    });
    return response.data;
  }

  /**
   * Delete owner response from a review
   * @param {number} reviewId - Review ID
   * @returns {Promise} Updated review
   */
  async deleteResponse(reviewId) {
    const response = await apiClient.patch(`/reviews/${reviewId}/respond/`, {
      owner_response: ''
    });
    return response.data;
  }

  /**
   * Get reviews with sorting and filtering
   * @param {number} listingId - Listing ID
   * @param {Object} options - { sort, rating, page, limit, search }
   * @returns {Promise} Reviews list
   */
  async getReviewsWithFilters(listingId, options = {}) {
    const params = new URLSearchParams();
    if (listingId) params.append('listing', listingId.toString());
    if (options.sort) params.append('sort', options.sort);
    if (options.rating) params.append('rating', options.rating.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);
    if (options.my_listings) params.append('my_listings', 'true');
    
    const queryString = params.toString();
    const url = queryString ? `/reviews/?${queryString}` : '/reviews/';
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get review analytics for partner
   * @returns {Promise} Analytics data
   */
  async getReviewAnalytics() {
    const response = await apiClient.get('/reviews/analytics/');
    return response.data;
  }

  /**
   * Report a review
   * @param {number} reviewId - Review ID
   * @param {string} reason - Report reason (spam, inappropriate, harassment, false_info, other)
   * @param {string} description - Optional description
   * @returns {Promise} Report result
   */
  async reportReview(reviewId, reason, description = '') {
    const response = await apiClient.post(`/reviews/${reviewId}/report/`, {
      reason,
      description
    });
    return response.data;
  }
}

// Export singleton instance
export const reviewService = new ReviewService();

