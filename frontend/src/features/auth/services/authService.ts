import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/constants'

/**
 * Authentication Service
 */
export class AuthService {
  async login(email: string, password: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password
    })
  }

  async register(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone_number?: string
    date_of_birth?: string
    address?: string
    city?: string
    country?: string
    postal_code?: string
    license_number?: string
    license_origin_country?: string
    issue_date?: string
    nationality?: string
    country_of_residence?: string
    default_currency?: string
  }) {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)
  }

  async logout() {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  }

  async getProfile() {
    return apiClient.get(API_ENDPOINTS.AUTH.PROFILE)
  }

  async getCurrentUser() {
    return this.getProfile()
  }

  async updateProfile(profileData: {
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
    date_of_birth?: string
    address?: string
    city?: string
    country?: string
    country_of_residence?: string
    postal_code?: string
    license_number?: string
    license_origin_country?: string
    issue_date?: string
    expiry_date?: string
    nationality?: string
    default_currency?: string
  }) {
    return apiClient.patch(API_ENDPOINTS.AUTH.PROFILE, profileData)
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData()
    formData.append('profile_picture', file)
    
    return apiClient.patch(API_ENDPOINTS.AUTH.PROFILE, formData)
  }

  async changePassword(passwordData: {
    current_password: string
    new_password: string
  }) {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData)
  }

  async forgotPassword(email: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
  }

  async refreshToken(refreshToken: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
      refresh: refreshToken
    })
  }

  async resetPasswordRequest(email: string) {
    return apiClient.post('/api/password-reset/', { email })
  }

  async resetPassword(uidb64: string, token: string, password: string) {
    return apiClient.post(`/api/reset-password/${uidb64}/${token}/`, {
      password
    })
  }

  async verifyEmailToken(token: string) {
    return apiClient.post('/api/verify-email/', { token })
  }

  async verifyEmail(token: string) {
    // Direct GET request to verify-email endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/verify-email/?token=${token}`)
    return response
  }

  async verifyToken() {
    return apiClient.get('/api/verify-token/')
  }

  async verifyAdmin() {
    return apiClient.get('/api/verify-admin/')
  }

  async resendVerification() {
    // Not implemented in backend yet, but keeping for future use
    return apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION)
  }

  async deleteAccount() {
    return apiClient.delete(API_ENDPOINTS.AUTH.PROFILE)
  }
}

// Create and export a singleton instance
export const authService = new AuthService()