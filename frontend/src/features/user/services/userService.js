import { apiClient } from '@/lib/api/client'

/**
 * User Service - Complete API integration with all CRUD operations
 */
export class UserService {
  // ============ LIST OPERATIONS ============
  /**
   * Get all users (admin only)
   * @returns {Promise} Users list
   */
  async getUsers() {
    const response = await apiClient.get('/users/')
    return response.data
  }

  /**
   * Get user by ID
   * @param {string|number} userId - User ID
   * @returns {Promise} User data
   */
  async getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}/`)
    return response.data
  }

  // ============ CREATE OPERATIONS ============
  /**
   * Create/Register new user
   * @param {Object} userData - User registration data
   * @param {File} profilePicture - Optional profile picture file
   * @param {File} idFrontDocument - Optional ID front document
   * @param {File} idBackDocument - Optional ID back document
   * @returns {Promise} Created user data
   */
  async createUser(userData, profilePicture = null, idFrontDocument = null, idBackDocument = null) {
    const formData = new FormData()
    
    // Append all user data fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })

    // Append files if provided
    if (profilePicture) formData.append('profile_picture', profilePicture)
    if (idFrontDocument) formData.append('id_front_document_url', idFrontDocument)
    if (idBackDocument) formData.append('id_back_document_url', idBackDocument)

    const response = await apiClient.post('/api/register/', formData)
    return response.data
  }

  // ============ UPDATE OPERATIONS ============
  /**
   * Update user (full update - PUT)
   * @param {string|number} userId - User ID
   * @param {Object} userData - Updated user data
   * @param {File} profilePicture - Optional profile picture file
   * @param {File} idFrontDocument - Optional ID front document
   * @param {File} idBackDocument - Optional ID back document
   * @returns {Promise} Updated user data
   */
  async updateUser(userId, userData, profilePicture = null, idFrontDocument = null, idBackDocument = null) {
    const formData = new FormData()
    
    // Append all user data fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })

    // Append files if provided
    if (profilePicture) formData.append('profile_picture', profilePicture)
    if (idFrontDocument) formData.append('id_front_document_url', idFrontDocument)
    if (idBackDocument) formData.append('id_back_document_url', idBackDocument)

    const response = await apiClient.put(`/users/${userId}/`, formData)
    return response.data
  }

  /**
   * Update user (partial update - PATCH)
   * @param {string|number} userId - User ID
   * @param {Object} userData - Partial user data
   * @param {File} profilePicture - Optional profile picture file
   * @param {File} idFrontDocument - Optional ID front document
   * @param {File} idBackDocument - Optional ID back document
   * @returns {Promise} Updated user data
   */
  async patchUser(userId, userData, profilePicture = null, idFrontDocument = null, idBackDocument = null) {
    const formData = new FormData()
    
    // Append all user data fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })

    // Append files if provided
    if (profilePicture) formData.append('profile_picture', profilePicture)
    if (idFrontDocument) formData.append('id_front_document_url', idFrontDocument)
    if (idBackDocument) formData.append('id_back_document_url', idBackDocument)

    const response = await apiClient.patch(`/users/${userId}/`, formData)
    return response.data
  }

  /**
   * Update current user profile (GET/PATCH /users/me/)
   * @param {Object} userData - Partial user data
   * @param {File} profilePicture - Optional profile picture file
   * @param {File} idFrontDocument - Optional ID front document
   * @param {File} idBackDocument - Optional ID back document
   * @returns {Promise} Updated user data
   */
  async updateProfile(userData, profilePicture = null, idFrontDocument = null, idBackDocument = null) {
    const formData = new FormData()
    
    // Append all user data fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })

    // Append files if provided
    if (profilePicture) formData.append('profile_picture', profilePicture)
    if (idFrontDocument) formData.append('id_front_document_url', idFrontDocument)
    if (idBackDocument) formData.append('id_back_document_url', idBackDocument)

    const response = await apiClient.patch('/users/me/', formData)
    return response.data
  }

  /**
   * Get current user profile
   * @returns {Promise} Current user data
   */
  async getProfile() {
    const response = await apiClient.get('/users/me/')
    return response.data
  }

  /**
   * Change user password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Success message
   */
  async changePassword(oldPassword, newPassword) {
    const response = await apiClient.post('/users/me/change-password/', {
      old_password: oldPassword,
      new_password: newPassword
    })
    return response.data || response
  }

  // ============ DELETE OPERATIONS ============
  /**
   * Delete user
   * @param {string|number} userId - User ID
   * @returns {Promise}
   */
  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}/`)
    return response.data
  }

  /**
   * Delete current user account
   * @returns {Promise}
   */
  async deleteAccount() {
    const response = await apiClient.delete('/users/me/')
    return response.data
  }

  // ============ FAVORITES OPERATIONS ============
  /**
   * Get user's favorites
   * @returns {Promise} List of favorite listings
   */
  async getFavorites() {
    console.log('🔍 userService.getFavorites() - Starting...');
    try {
      console.log('📡 Trying /favorites/my-favorites/ endpoint...');
      // Try my-favorites endpoint first (returns full details)
      // Increase timeout for favorites (60 seconds - may include full listing details)
      const response = await apiClient.get('/favorites/my-favorites/', undefined, { timeout: 60000 })
      console.log('✅ userService.getFavorites() - Raw response:', response);
      
      const data = response?.data || response
      console.log('📦 userService.getFavorites() - Extracted data:', data);
      
      // Backend returns: { favorites: [{ id, listing, user, created_at }], listings: [...] }
      // Handle different response structures from backend
      if (data.favorites && Array.isArray(data.favorites)) {
        console.log(`✅ Found favorites array: ${data.favorites.length} items`);
        // Backend returns { favorites: [...], listings: [...] }
        return { data: data.favorites }
      } else if (data.listings && Array.isArray(data.listings)) {
        console.log(`✅ Found listings array: ${data.listings.length} items, wrapping...`);
        // Backend returns listings directly - wrap them in favorite structure
        return { 
          data: data.listings.map((listing, idx) => ({
            id: data.favorites?.[idx]?.id || listing.id,
            listing: listing,
            created_at: data.favorites?.[idx]?.created_at || new Date().toISOString()
          }))
        }
      } else if (Array.isArray(data)) {
        console.log(`✅ Found direct array: ${data.length} items`);
        // Backend returns array directly
        return { data }
      }
      
      console.warn('⚠️ Unexpected response structure:', data);
      return { data: data.favorites || [] }
    } catch (err) {
      console.warn('⚠️ /favorites/my-favorites/ failed, trying fallback:', err.message);
      // Fallback to general favorites endpoint
      try {
        console.log('📡 Trying /favorites/ endpoint...');
        // Increase timeout for favorites (60 seconds - may include full listing details)
        const response = await apiClient.get('/favorites/', undefined, { timeout: 60000 })
        console.log('✅ userService.getFavorites() - Fallback response:', response);
        
        const data = response?.data || response
        console.log('📦 userService.getFavorites() - Fallback data:', data);
        
        // Handle different response structures
        if (data.results && Array.isArray(data.results)) {
          console.log(`✅ Found results array: ${data.results.length} items`);
          return { data: data.results }
        } else if (Array.isArray(data)) {
          console.log(`✅ Found direct array in fallback: ${data.length} items`);
          return { data }
        } else if (data.favorites && Array.isArray(data.favorites)) {
          console.log(`✅ Found favorites in fallback: ${data.favorites.length} items`);
          return { data: data.favorites }
        }
        
        console.warn('⚠️ Unexpected fallback structure:', data);
        return response
      } catch (fallbackErr) {
        console.error('❌ Both endpoints failed:', fallbackErr);
        throw fallbackErr
      }
    }
  }

  /**
   * Add a listing to favorites
   * @param {string|number} listingId - Listing ID to favorite
   * @returns {Promise} Created favorite
   */
  async addFavorite(listingId) {
    const response = await apiClient.post('/favorites/', { listing: listingId })
    return response.data || response
  }

  /**
   * Remove a listing from favorites
   * @param {string|number} listingId - Listing ID to remove from favorites
   * @returns {Promise}
   */
  async removeFavorite(listingId) {
    try {
      // First, try to delete directly by listingId if it looks like a favorite ID
      // This handles cases where listingId is actually the favorite ID
      try {
        const directResponse = await apiClient.delete(`/favorites/${listingId}/`)
        return directResponse.data || directResponse
      } catch (directError) {
        // If direct delete fails with 404, the favorite might already be removed
        // Check for various 404 error message formats
        const errorMessage = directError.message || '';
        const isNotFound = directError.status === 404 || 
                          errorMessage.toLowerCase().includes('404') || 
                          errorMessage.toLowerCase().includes('not found') ||
                          errorMessage.toLowerCase().includes('endpoint not found');
        
        if (isNotFound) {
          // Favorite not found or already removed - return success (idempotent operation)
          console.log('Favorite not found (may already be removed), treating as success');
          return { success: true, message: 'Favorite removed' };
        }
        
        // For other errors, throw them
        throw directError;
      }

      // Get user's favorites to find the matching favorite entry
      // listingId could be either a Favorite entry ID or a listing/vehicle ID
      const favoritesResponse = await this.getFavorites()
      const favorites = favoritesResponse.data || []
      
      // First, check if listingId is already a Favorite entry ID
      let favorite = favorites.find(fav => fav.id === listingId)
      
      // If not found, search by listing/vehicle ID
      if (!favorite) {
        favorite = favorites.find(fav => {
          const favListing = fav.listing || fav.vehicle || fav
          const favListingId = favListing?.id || favListing
          return (
            favListingId === listingId || 
            favListing === listingId || 
            fav.listing?.id === listingId ||
            fav.vehicle?.id === listingId
          )
        })
      }
      
      if (favorite && favorite.id) {
        // Use the Favorite entry ID (favorite.id) for deletion
        const response = await apiClient.delete(`/favorites/${favorite.id}/`)
        return response.data || response
      } else {
        // Favorite might already be removed or never existed - return success to avoid errors
        console.log('Favorite not found in list, might already be removed')
        return { success: true, message: 'Favorite already removed' }
      }
    } catch (error) {
      // If it's a 404, the favorite might already be removed - treat as success
      const errorMessage = (error.message || '').toLowerCase();
      const isNotFound = error.status === 404 || 
                        errorMessage.includes('404') || 
                        errorMessage.includes('not found') || 
                        errorMessage.includes('endpoint not found') ||
                        errorMessage.includes('favorite not found');
      
      if (isNotFound) {
        console.log('Favorite not found, assuming already removed')
        return { success: true, message: 'Favorite already removed' }
      }
      throw error
    }
  }

  // ============ STATISTICS OPERATIONS ============
  /**
   * Get user statistics (bookings count, favorites count, etc.)
   * @returns {Promise} User statistics
   */
  async getUserStats() {
    try {
      // Try to get stats from a dedicated endpoint if it exists
      try {
        const response = await apiClient.get('/users/me/stats/')
        return response.data || response
      } catch (statsError) {
        // If stats endpoint doesn't exist, calculate stats from other endpoints
        console.log('Stats endpoint not available, calculating from other data')
        
        const stats = {
          total_bookings: 0,
          upcoming_bookings: 0,
          past_bookings: 0,
          total_favorites: 0,
          pending_bookings: 0,
          completed_bookings: 0
        }

        try {
          // Get bookings using apiClient directly
          const bookingsResponse = await apiClient.get('/bookings/')
          const bookings = Array.isArray(bookingsResponse.data) 
            ? bookingsResponse.data 
            : (Array.isArray(bookingsResponse) ? bookingsResponse : [])
          
          stats.total_bookings = bookings.length
          
          // Calculate upcoming and past bookings
          const now = new Date()
          bookings.forEach(booking => {
            const pickupDate = new Date(booking.pickup_date || booking.start_date || booking.start_time)
            if (pickupDate >= now) {
              stats.upcoming_bookings++
            } else {
              stats.past_bookings++
            }
            
            if (booking.status === 'pending') {
              stats.pending_bookings++
            } else if (booking.status === 'completed') {
              stats.completed_bookings++
            }
          })
        } catch (bookingsError) {
          console.warn('Could not load bookings for stats:', bookingsError.message)
        }

        try {
          // Get favorites
          const favoritesResponse = await this.getFavorites()
          const favorites = Array.isArray(favoritesResponse.data) 
            ? favoritesResponse.data 
            : (Array.isArray(favoritesResponse) ? favoritesResponse : [])
          
          stats.total_favorites = favorites.length
        } catch (favoritesError) {
          console.warn('Could not load favorites for stats:', favoritesError.message)
        }

        return stats
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      // Return default stats on error
      return {
        total_bookings: 0,
        upcoming_bookings: 0,
        past_bookings: 0,
        total_favorites: 0,
        pending_bookings: 0,
        completed_bookings: 0
      }
    }
  }
}

// Create and export a singleton instance
export const userService = new UserService()
