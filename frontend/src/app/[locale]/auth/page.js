'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { isValidMoroccanPhone } from '@/lib/utils'

const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isPartner: z.boolean().optional().default(false),
  businessName: z.string().optional(),
  taxId: z.string().optional(),
  businessType: z.enum(['individual', 'company']).optional(),
}).refine((data) => {
  // If signing up as partner, business name and tax ID are required
  if (data.isPartner) {
    return data.businessName && data.businessName.trim().length > 0 && 
           data.taxId && data.taxId.trim().length > 0;
  }
  return true;
}, {
  message: "Business name and Tax ID are required for partner registration",
  path: ["businessName"],
}).refine((data) => {
  // Validate phone number if provided
  if (data.phoneNumber && data.phoneNumber.trim()) {
    return isValidMoroccanPhone(data.phoneNumber);
  }
  return true;
}, {
  message: "Please enter a valid Moroccan phone number",
  path: ["phoneNumber"],
})

function AuthForm() {
  const [activeTab, setActiveTab] = useState('signin') // 'signin' or 'signup'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState('')
  const [user, setUser] = useState(null)
  const [googleReady, setGoogleReady] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register: registerUser } = useAuth()

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/'
  
  // Check if mode is set in query params
  const mode = searchParams.get('mode')
  
  // Use useEffect to handle mode changes
  // Always allow users to switch between Sign In and Sign Up
  useEffect(() => {
    if (mode && (mode === 'signin' || mode === 'signup')) {
      setActiveTab(mode)
    } else {
      // Default to signin if no mode specified, but tabs remain visible
      setActiveTab('signin')
    }
  }, [mode])

  // Load and initialize Google Identity Services
  // NOTE: To fix "The given origin is not allowed" error:
  // 1. Go to https://console.cloud.google.com/apis/credentials
  // 2. Select your OAuth 2.0 Client ID (712108051146-g9ksbf313hhl7n3nt69ot8np7gtvvd8o)
  // 3. Add authorized JavaScript origins:
  //    - http://localhost:3001
  //    - http://127.0.0.1:3001
  //    - https://www.airbcar.com (production)
  //    - https://airbcar.com (production)
  // 4. Add authorized redirect URIs:
  //    - http://localhost:3001
  //    - http://127.0.0.1:3001
  //    - https://www.airbcar.com (production)
  //    - https://airbcar.com (production)
  useEffect(() => {
    const initGoogleSignIn = async () => {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!googleClientId || typeof window === 'undefined') {
        return
      }

      // Listen for Google Sign-In errors
      const handleGoogleError = (event) => {
        if (event.detail && typeof event.detail === 'object') {
          const errorMessage = event.detail.message || String(event.detail)
          if (errorMessage.includes('origin is not allowed') || errorMessage.includes('The given origin is not allowed')) {
            const currentOrigin = window.location.origin
            setError(
              `Google Sign-In configuration error: The origin "${currentOrigin}" is not authorized. ` +
              `Please add it to your Google Cloud Console OAuth client settings. ` +
              `Go to: https://console.cloud.google.com/apis/credentials`
            )
            setGoogleReady(false)
            return
          }
        }
      }

      // Add event listener for Google Sign-In errors
      window.addEventListener('gsi_error', handleGoogleError)

      try {
        // Load Google Identity Services script if not already loaded
        if (!window.google || !window.google.accounts) {
          await new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
            if (existingScript && window.google && window.google.accounts) {
              resolve()
              return
            }

            // Create and load script
            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.onload = () => {
              if (window.google && window.google.accounts) {
                resolve()
              } else {
                reject(new Error('Google Identity Services failed to load'))
              }
            }
            script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
            document.head.appendChild(script)
            setTimeout(() => reject(new Error('Timeout loading Google Identity Services')), 10000)
          })
        }

        // Initialize Google Identity Services
        const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setIsLoading(true)
              setError('')

              // Send the credential to backend
              const backendResponse = await fetch(`${apiUrl}/api/auth/google/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: response.credential }),
              })

              if (backendResponse.ok) {
                const data = await backendResponse.json()

                // Store tokens
                localStorage.setItem('access_token', data.access)
                localStorage.setItem('refresh_token', data.refresh)

                // Update auth context
                if (data.user) {
                  setUser(data.user)
                }

                // Handle redirection
                const token = data.access
                if (token && typeof window !== 'undefined') {
                  try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    const userRole = payload.role || 'user'
                    const isPartner = payload.is_partner || false
                    const isStaff = payload.is_staff || false
                    const isSuperuser = payload.is_superuser || false

                    let redirectPath = '/'
                    if (isStaff || isSuperuser) {
                      redirectPath = '/admin/dashboard'
                    } else if (isPartner || userRole === 'partner') {
                      redirectPath = '/partner/dashboard'
                    } else {
                      redirectPath = redirectTo === '/' ? '/' : redirectTo
                    }

                    window.location.href = redirectPath
                  } catch (tokenError) {
                    console.error('Error parsing token:', tokenError)
                    window.location.href = redirectTo || '/'
                  }
                }
              } else {
                const errorData = await backendResponse.json().catch(() => ({}))
                setError(errorData.error || 'Google sign-in failed. Please try again.')
                setIsLoading(false)
              }
            } catch (error) {
              // Suppress COOP and other non-critical Google Sign-In errors
              const errorMessage = error?.message || String(error)
              if (
                !errorMessage.includes('Cross-Origin-Opener-Policy') &&
                !errorMessage.includes('ERR_BLOCKED_BY_CLIENT') &&
                !errorMessage.includes('play.google.com/log')
              ) {
              console.error('Google sign-in error:', error)
              setError('Failed to sign in with Google. Please try again.')
              }
              setIsLoading(false)
            }
          },
        })

        setGoogleReady(true)
      } catch (error) {
        // Suppress COOP and other non-critical Google Sign-In errors
        const errorMessage = error?.message || String(error)
        
        // Check for origin not allowed error
        if (errorMessage.includes('origin is not allowed') || errorMessage.includes('The given origin is not allowed')) {
          const currentOrigin = window.location.origin
          setError(
            `Google Sign-In configuration error: The origin "${currentOrigin}" is not authorized in Google Cloud Console. ` +
            `Please add it to your OAuth 2.0 Client ID settings at: ` +
            `https://console.cloud.google.com/apis/credentials`
          )
          setGoogleReady(false)
          return
        }
        
        if (
          !errorMessage.includes('Cross-Origin-Opener-Policy') &&
          !errorMessage.includes('ERR_BLOCKED_BY_CLIENT') &&
          !errorMessage.includes('play.google.com/log')
        ) {
        console.error('Failed to initialize Google Sign-In:', error)
        }
        // Still set ready to false if it's a critical error
        if (errorMessage.includes('Google Identity Services failed to load') || 
            errorMessage.includes('Failed to load Google Identity Services')) {
        setGoogleReady(false)
        } else {
          // For non-critical errors, still try to proceed
          setGoogleReady(true)
        }
      }

      // Cleanup event listener on unmount
      return () => {
        window.removeEventListener('gsi_error', handleGoogleError)
      }
    }

    initGoogleSignIn()
  }, [redirectTo])

  // Sign In Form
  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  })

  // Sign Up Form
  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    watch: watchSignUp,
    setValue: setSignUpValue,
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      isPartner: false,
      businessType: 'individual',
    },
  })
  
  // Watch isPartner field to show/hide partner fields
  const isPartnerSignup = watchSignUp('isPartner') || false

  // Check if role is partner in query params to auto-check the checkbox
  useEffect(() => {
    const role = searchParams.get('role')
    if (role === 'partner') {
      setSignUpValue('isPartner', true)
    }
  }, [searchParams, setSignUpValue])

  const onSignInSubmit = async (data) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await login(data.email, data.password, { 
        redirect: true, 
        redirectTo: redirectTo 
      })
      
      if (result.success) {
        // Redirection is handled automatically by AuthContext
      } else {
        // Show the actual error message from the API
        const errorMsg = result.error || 'Login failed. Please check your email and password.'
        setError(errorMsg)
        console.error('Login failed:', result)
      }
    } catch (error) {
      // Show detailed error message
      const errorMsg = error.message || error.toString() || 'Network error. Please check your connection and try again.'
      setError(errorMsg)
      console.error('Login exception:', error)
    }

    setIsLoading(false)
  }

  const onSignUpSubmit = async (data) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Prepare registration data
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        role: data.isPartner ? 'partner' : 'customer',
        // Partner-specific fields
        ...(data.isPartner && {
          businessName: data.businessName,
          taxId: data.taxId,
          businessType: data.businessType || 'individual',
        }),
      }
      
      const result = await registerUser(registrationData)
      
      if (result.success) {
        setSuccess(true)
        
        // Determine redirect path based on registration data
        let redirectPath = '/'
        let redirectMessage = "You're now signed in. Redirecting to home page..."
        
        // PRIORITY 1: If user signed up as partner, ALWAYS redirect to partner dashboard
        if (data.isPartner) {
          redirectPath = '/partner/dashboard'
          redirectMessage = "Partner account created! Redirecting to your dashboard..."
        } else {
          // For regular users, check token to determine redirection
          const token = localStorage.getItem('access_token')
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]))
              const userRole = payload.role || 'user'
              const isPartner = payload.is_partner || false
              const isStaff = payload.is_staff || false
              const isSuperuser = payload.is_superuser || false
              
              // Smart redirection based on user role
              if (isStaff || isSuperuser || userRole === 'admin') {
                redirectPath = '/admin/dashboard'
                redirectMessage = "Redirecting to admin dashboard..."
              } else if (isPartner || userRole === 'partner') {
                // Double-check: if token shows partner role, redirect to partner dashboard
                redirectPath = '/partner/dashboard'
                redirectMessage = "Redirecting to partner dashboard..."
              } else {
                redirectPath = '/'
                redirectMessage = "You're now signed in. Redirecting to home page..."
              }
            } catch (tokenError) {
              console.error('Error parsing token:', tokenError)
              redirectPath = '/'
            }
          }
        }
        
        // Store redirect message for display
        setRedirectMessage(redirectMessage)
        setSuccess(true)
        
        // Redirect immediately for partners, slight delay for others
        const redirectDelay = data.isPartner ? 500 : 1500
        setTimeout(() => {
          router.push(redirectPath)
        }, redirectDelay)
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Registration error:', error)
    }

    setIsLoading(false)
  }

  // Render Google button in container
  useEffect(() => {
    if (googleReady && typeof window !== 'undefined' && window.google && window.google.accounts) {
      // Monitor for origin errors via a one-time check after button render attempt
      const checkForOriginError = () => {
        // Check if button failed to render due to origin error
        const signInContainer = document.getElementById('google-signin-button-container')
        const signUpContainer = document.getElementById('google-signin-button-container-signup')
        
        // If containers are empty after a delay, it might be an origin error
        setTimeout(() => {
          if (signInContainer && signInContainer.children.length === 0 && googleReady) {
            const currentOrigin = window.location.origin
            // Only show error if we're sure it's an origin issue (check console for GSI_LOGGER messages)
            const hasOriginError = window.gsiOriginError || false
            if (hasOriginError) {
              setError(
                `Google Sign-In Error: The origin "${currentOrigin}" is not authorized. ` +
                `Please add "${currentOrigin}" to your Google Cloud Console OAuth client settings. ` +
                `Visit: https://console.cloud.google.com/apis/credentials and edit your OAuth 2.0 Client ID (${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20)}...). ` +
                `Add "${currentOrigin}" to "Authorized JavaScript origins" and "Authorized redirect URIs".`
              )
              setGoogleReady(false)
            }
          }
        }, 2000)
      }

      // Render button for sign-in form
      const signInContainer = document.getElementById('google-signin-button-container')
      if (signInContainer && signInContainer.children.length === 0) {
        try {
          window.google.accounts.id.renderButton(signInContainer, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: signInContainer.offsetWidth || 300,
            type: 'standard',
          })
        } catch (error) {
          // Suppress COOP and other non-critical Google Sign-In errors
          const errorMessage = error?.message || String(error)
          if (
            !errorMessage.includes('Cross-Origin-Opener-Policy') &&
            !errorMessage.includes('ERR_BLOCKED_BY_CLIENT') &&
            !errorMessage.includes('play.google.com/log')
          ) {
          console.error('Error rendering Google button (sign-in):', error)
          }
        }
      }

      // Render button for sign-up form
      const signUpContainer = document.getElementById('google-signin-button-container-signup')
      if (signUpContainer && signUpContainer.children.length === 0) {
        try {
          window.google.accounts.id.renderButton(signUpContainer, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            width: signUpContainer.offsetWidth || 300,
            type: 'standard',
          })
        } catch (error) {
          // Suppress COOP and other non-critical Google Sign-In errors
          const errorMessage = error?.message || String(error)
          if (
            !errorMessage.includes('Cross-Origin-Opener-Policy') &&
            !errorMessage.includes('ERR_BLOCKED_BY_CLIENT') &&
            !errorMessage.includes('play.google.com/log')
          ) {
          console.error('Error rendering Google button (sign-up):', error)
        }
      }
      }

      checkForOriginError()
    }
  }, [googleReady, activeTab])

  if (success && activeTab === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/sven-d-a4S6KUuLeoM-unsplash.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        <div className="w-full max-w-md mx-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10 text-center"
              >
                <Link href="/">
                  <h1 className="text-3xl font-bold text-white hover:text-orange-500 transition-colors cursor-pointer">
                    Airbcar
                  </h1>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-green-400"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-4"
                >
                  Account created successfully!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-base text-white/80"
                >
                  {redirectMessage || "You're now signed in. Redirecting..."}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center lg:justify-start relative overflow-hidden bg-slate-900 lg:px-32">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/sven-d-a4S6KUuLeoM-unsplash.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 lg:mx-0">
        <div className="bg-white/10 backdrop-blur-xl backdrop-saturate-150 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="py-10 px-6 sm:px-10">
          {/* Logo with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <Link href="/">
              <h1 className="text-3xl font-bold text-white hover:text-orange-500 transition-colors cursor-pointer">
                Airbcar
              </h1>
            </Link>
          </motion.div>

          {/* Enhanced Tab Navigation */}
          <div className="mb-10">
            <div className="relative flex space-x-1 bg-white/10 p-1.5 rounded-xl border border-white/10">
              <motion.button
                type="button"
                onClick={() => {
                  setActiveTab('signin')
                  setError('')
                }}
                className={`relative flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 z-10 ${
                  activeTab === 'signin'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === 'signin' && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setActiveTab('signup')
                  setError('')
                }}
                className={`relative flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 z-10 ${
                  activeTab === 'signup'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === 'signup' && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Sign Up</span>
              </motion.button>
            </div>
          </div>

          {/* Header with enhanced styling */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white">
              {activeTab === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </h2>
          </motion.div>

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form className="space-y-6" onSubmit={handleSignInSubmit(onSignInSubmit)}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-semibold text-white/90 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  <input
                    {...registerSignIn('email')}
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                    placeholder="Enter your email"
                  />
                  </div>
                  {signInErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{signInErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signin-password" className="block text-sm font-semibold text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...registerSignIn('password')}
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                      placeholder="Enter your password"
                    />
                  </div>
                  {signInErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{signInErrors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <motion.a
                  href="/auth/forgot-password"
                  whileHover={{ x: 2 }}
                  className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Forgot your password?
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>
              </div>

              <div className="space-y-4">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: -2 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden group"
                >
                  {/* Shine effect */}
                  {!isLoading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: 'linear',
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </span>
                </motion.button>

                <div className="relative py-2 flex items-center gap-4">
                  <div className="flex-1 border-t border-white/20" />
                  <span className="text-sm text-white/60 font-medium">Or continue with</span>
                  <div className="flex-1 border-t border-white/20" />
                </div>

                <div 
                  id="google-signin-button-container" 
                  className="w-full flex justify-center"
                  style={{ minHeight: '44px' }}
                >
                  {!googleReady && (
                    <div className="w-full flex justify-center items-center py-3.5 px-4 border border-white/20 rounded-xl bg-white/10">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      <span className="text-sm text-white/80">Loading Google sign-in...</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <form className="space-y-6" onSubmit={handleSignUpSubmit(onSignUpSubmit)}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50 border-2 border-red-200 p-4 shadow-sm"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-800">Registration Error</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-firstName" className="block text-sm font-semibold text-white/90 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        {...registerSignUp('firstName')}
                        id="signup-firstName"
                        type="text"
                        autoComplete="given-name"
                        className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                        placeholder="First name"
                      />
                    </div>
                    {signUpErrors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{signUpErrors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-lastName" className="block text-sm font-semibold text-white/90 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        {...registerSignUp('lastName')}
                        id="signup-lastName"
                        type="text"
                        autoComplete="family-name"
                        className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                        placeholder="Last name"
                      />
                    </div>
                    {signUpErrors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{signUpErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-semibold text-white/90 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      {...registerSignUp('email')}
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                      placeholder="Enter your email"
                    />
                  </div>
                  {signUpErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-phoneNumber" className="block text-sm font-semibold text-white/90 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      {...registerSignUp('phoneNumber')}
                      id="signup-phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                      placeholder="+212 6XX-XXXXXX"
                    />
                  </div>
                  {signUpErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...registerSignUp('password')}
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                      placeholder="Create a password"
                    />
                  </div>
                  {signUpErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.password.message}</p>
                  )}
                </div>

                <div>
                  {signUpErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Partner Signup Toggle */}
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center">
                    <input
                      {...registerSignUp('isPartner')}
                      id="signup-isPartner"
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-white/30 bg-white/10 rounded"
                    />
                    <label htmlFor="signup-isPartner" className="ml-2 block text-sm font-semibold text-white/90">
                      Sign up as a partner (rent out your car)
                    </label>
                  </div>
                  <p className="mt-1 ml-6 text-xs text-white/60">
                    Partners can list and rent out their vehicles on Airbcar
                  </p>
                </div>

                {/* Partner-specific fields */}
                {isPartnerSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-4 border-t border-white/20"
                  >
                    <div>
                      <label htmlFor="signup-businessName" className="block text-sm font-semibold text-white/90 mb-2">
                        Business Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          {...registerSignUp('businessName')}
                          id="signup-businessName"
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                          placeholder="Enter your business name"
                        />
                      </div>
                      {signUpErrors.businessName && (
                        <p className="mt-1 text-sm text-red-400">{signUpErrors.businessName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-taxId" className="block text-sm font-semibold text-white/90 mb-2">
                        Tax ID / Registration Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <input
                          {...registerSignUp('taxId')}
                          id="signup-taxId"
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                          placeholder="Enter your tax ID or registration number"
                        />
                      </div>
                      {signUpErrors.taxId && (
                        <p className="mt-1 text-sm text-red-400">{signUpErrors.taxId.message}</p>
                      )}
                    </div>

                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: -2 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden group"
                >
                  {/* Shine effect */}
                  {!isLoading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: 'linear',
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </span>
                </motion.button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/sven-d-a4S6KUuLeoM-unsplash.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
      
      <div className="relative z-10 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-orange-500 mx-auto mb-4"></div>
        <p className="text-white/80 font-medium">Loading...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function Auth() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthForm />
    </Suspense>
  )
}

