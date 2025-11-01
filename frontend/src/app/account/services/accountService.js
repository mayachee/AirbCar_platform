import { authService } from '@/services/api';

/**
 * Account Service
 * Handles account-specific business logic
 */
class AccountService {
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Updated profile data
   */
  async updateProfile(profileData) {
    // Clean up null/undefined values
    const cleanedData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('Updating profile with data:', cleanedData);
    
    return await authService.updateProfile(cleanedData);
  }

  /**
   * Update profile picture
   * @param {File} file - Image file to upload
   * @returns {Promise} Uploaded image URL
   */
  async uploadProfilePicture(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB.');
    }

    return await authService.uploadProfilePicture(file);
  }

  /**
   * Delete user account
   * @returns {Promise}
   */
  async deleteAccount() {
    return await authService.deleteAccount();
  }

  /**
   * Get current user data
   * @returns {Promise} Current user data
   */
  async getCurrentUser() {
    return await authService.getCurrentUser();
  }

  /**
   * Validate profile data
   * @param {Object} profileData - Profile data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateProfileData(profileData) {
    const errors = {};
    
    // Required fields
    if (!profileData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!profileData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!profileData.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    
    if (!profileData.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!profileData.city?.trim()) {
      errors.city = 'City is required';
    }
    
    if (!profileData.country?.trim()) {
      errors.country = 'Country is required';
    }
    
    if (!profileData.licenseNumber?.trim()) {
      errors.licenseNumber = 'License number is required';
    }
    
    if (!profileData.licenseCountry?.trim()) {
      errors.licenseCountry = 'License country is required';
    }

    // Email validation
    if (profileData.email && !this.isValidEmail(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Calculate profile completion percentage
   * @param {Object} profileData - Profile data
   * @returns {number} Completion percentage (0-100)
   */
  calculateProfileCompletion(profileData) {
    const requiredFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'address',
      'city',
      'country',
      'licenseNumber',
      'licenseCountry'
    ];

    const completedFields = requiredFields.filter(field => 
      profileData[field] && profileData[field].trim() !== ''
    );

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Save profile data to localStorage
   * @param {Object} profileData - Profile data to save
   */
  saveToLocalStorage(profileData) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('accountForm', JSON.stringify(profileData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Load profile data from localStorage
   * @returns {Object|null} Saved profile data or null
   */
  loadFromLocalStorage() {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('accountForm');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }

  /**
   * Clear localStorage for account form
   */
  clearLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('accountForm');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

export const accountService = new AccountService();

