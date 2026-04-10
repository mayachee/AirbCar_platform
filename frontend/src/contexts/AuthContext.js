'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if user is logged in on app start
  useEffect(() => {
    if (isClient) {
      checkAuth()
    }
  }, [isClient])

  const checkAuth = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }

      // Always verify the token with the backend — never trust client-side JWT decoding
      // for authorization decisions (role, is_partner, is_staff, etc.)
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        const res = await fetch(`${apiUrl}/users/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
          const profileData = await res.json()
          const userData = profileData?.data || profileData
          if (userData && userData.id) {
            setUser(userData)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        } else if (res.status === 401) {
          // Token rejected by backend — clear it
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        // Any other status (500, network error) — keep token, show as loading failed
      } catch {
        // Network error — don't clear the token, user may be offline
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, options = {}) => {
    const { redirect = true, redirectTo = '/' } = options
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const loginUrl = `${apiUrl}/api/login/`
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Store tokens
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        
        // Set user data from backend response — this is the authoritative source
        if (data.user) {
          setUser(data.user)
        } else {
          await checkAuth()
        }

        // Role-based redirect using backend-provided user data only
        if (redirect && isClient && window?.location) {
          const userData = data.user || {}
          const role = userData.role || ''
          const isAdmin = userData.is_staff === true || userData.is_superuser === true
                          || role === 'admin' || role === 'ceo'
          const isPartner = userData.is_partner === true || role === 'partner'

          let redirectPath = redirectTo === '/' ? '/' : redirectTo
          if (isAdmin) {
            redirectPath = '/admin/dashboard'
          } else if (isPartner) {
            redirectPath = '/partner/dashboard'
          }

          window.location.href = redirectPath
        }
        
        return { success: true, user: data.user }
      } else {
        // Handle non-OK responses (400, 401, 403, etc.)
        let errorMessage = 'Login failed. Please check your credentials.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.'
          } else if (response.status === 400) {
            errorMessage = errorData.detail || errorData.message || 'Invalid request. Please check your input.'
          } else if (response.status === 403) {
            errorMessage = errorData.detail || errorData.message || 'Account is inactive or suspended.'
          } else if (response.status === 404) {
            errorMessage = 'Login endpoint not found. Please contact support.'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Network error. Please check your connection and try again.' }
    }
  }

  const register = async (registrationData) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'
      
      // Extract registration data (handles both camelCase and snake_case)
      const firstName = registrationData.firstName || registrationData.first_name
      const lastName = registrationData.lastName || registrationData.last_name
      const email = registrationData.email
      const password = registrationData.password
      const role = registrationData.role || 'customer'
      const businessName = registrationData.businessName || registrationData.business_name
      const taxId = registrationData.taxId || registrationData.tax_id
      const businessType = registrationData.businessType || registrationData.business_type || 'individual'
      const phoneNumber = registrationData.phoneNumber || registrationData.phone_number
      
      const requestBody = { 
        first_name: firstName,
        last_name: lastName,
        email, 
        password,
        role,
        ...(phoneNumber && { phone_number: phoneNumber }),
        ...(role === 'partner' && businessName && taxId && {
          business_name: businessName,
          tax_id: taxId,
          business_type: businessType,
        }),
      }
      
      const response = await fetch(`${apiUrl}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (response.ok) {
        // After successful registration, automatically log the user in without redirect
        const loginResult = await login(email, password, { redirect: false })
        return loginResult
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          // If response is not JSON, try to get text
          const text = await response.text()
          return { 
            success: false, 
            error: text || `Server error (${response.status})` 
          }
        }
        
        // Handle Django validation errors - show all errors, not just the first
        let errorMessage = 'Something went wrong'
        
        // Check for common error fields
        if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
        } else if (errorData.username) {
          errorMessage = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
        } else if (errorData.first_name) {
          errorMessage = Array.isArray(errorData.first_name) ? errorData.first_name[0] : errorData.first_name
        } else if (errorData.last_name) {
          errorMessage = Array.isArray(errorData.last_name) ? errorData.last_name[0] : errorData.last_name
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors
        } else {
          // Show all errors if we can't identify a specific one
          const allErrors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
            .join(', ')
          errorMessage = allErrors || JSON.stringify(errorData)
        }
        
        return {
          success: false, 
          error: errorMessage 
        }
      }
    } catch {
      return { 
        success: false, 
        error: 'Something went wrong' 
      }
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      // Remove all possible auth keys
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      // Clear cached user data used by fallbacks
      localStorage.removeItem('userProfile')
      localStorage.removeItem('favorites')
      localStorage.removeItem('bookings')
      localStorage.removeItem('accountForm')
      localStorage.removeItem('isPartnerUser')
    }
    setUser(null)
    // Use replace to prevent going back to an authed page
    router.replace('/')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
