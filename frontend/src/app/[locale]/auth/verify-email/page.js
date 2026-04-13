'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailContent() {
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuth } = useAuth()

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL - handle both query param and direct token
      let token = searchParams.get('token')
      
      // If no token in query params, try to get from URL hash or path
      if (!token) {
        // Try to extract from current URL
        const urlParams = new URLSearchParams(window.location.search)
        token = urlParams.get('token')
      }
      
      if (!token) {
        setStatus('error')
        setError('Verification token is missing. Please check your email for the correct verification link.')
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'
        
        // Ensure token is properly encoded
        const encodedToken = encodeURIComponent(token)
        const verifyUrl = `${apiUrl}/api/verify-email/?token=${encodedToken}`
        
        console.log('Verifying email with token:', token.substring(0, 10) + '...')
        console.log('Verification URL:', verifyUrl.replace(token, '***'))
        
        const response = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()
        console.log('Verification response:', { status: response.status, verified: data.verified, error: data.error })

        if (response.ok && data.verified) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          
          // After email verification, user account is activated
          // Try to automatically log them in
          try {
            // If we have user data, try to get a token by logging in
            // But first, check if we can get token from localStorage (if they were already logged in)
            const existingToken = localStorage.getItem('access_token')
            
            if (!existingToken && data.user && data.user.email) {
              // User needs to log in after verification
              // We'll redirect them to sign in, but they'll be auto-redirected to partner dashboard
              console.log('User verified, redirecting to sign in...')
            }
          } catch (loginError) {
            console.log('Auto-login not available, user will need to sign in')
          }
          
          // Refresh auth state to get updated user info
          if (checkAuth) {
            await checkAuth()
          }
          
          // Determine redirect path based on user role
          const determineRedirectPath = () => {
            // First, check user data from verification response
            if (data.user) {
              const userRole = data.user.role || 'customer'
              // Check if user is a partner - check multiple fields
              const isPartner = data.user.role === 'partner' || 
                               userRole === 'partner' ||
                               data.user.is_partner === true
              const isStaff = data.user.is_staff || false
              const isSuperuser = data.user.is_superuser || false
              
              // Priority: Admin > Partner > Regular User
              if (isStaff || isSuperuser) {
                return '/admin/dashboard'
              } else if (isPartner) {
                // Partner should always go to partner dashboard
                return '/partner/dashboard'
              }
            }
            
            // Fallback: check token if available
            const token = localStorage.getItem('access_token')
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                const tokenRole = payload.role || 'user'
                const isPartner = payload.is_partner || false || tokenRole === 'partner'
                const isStaff = payload.is_staff || false
                const isSuperuser = payload.is_superuser || false
                
                if (isStaff || isSuperuser) {
                  return '/admin/dashboard'
                } else if (isPartner || tokenRole === 'partner') {
                  return '/partner/dashboard'
                }
              } catch (e) {
                console.error('Error parsing token:', e)
              }
            }
            
            return '/auth?mode=signin'
          }
          
          // Redirect to appropriate dashboard after 2 seconds
          setTimeout(() => {
            const redirectPath = determineRedirectPath()
            console.log('Redirecting to:', redirectPath)
            router.push(redirectPath)
          }, 2000)
        } else {
          setStatus('error')
          // Provide more helpful error messages
          let errorMessage = data.error || 'Email verification failed. Please try again.'
          
          if (errorMessage.includes('expired')) {
            errorMessage += ' You can request a new verification email from the sign-in page.'
          } else if (errorMessage.includes('Invalid')) {
            errorMessage += ' The link may have already been used or is invalid. Please try signing up again or request a new verification email.'
          }
          
          setError(errorMessage)
        }
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        setError('An error occurred during verification. Please check your connection and try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router, checkAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50/30 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Airbcar</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="bg-white rounded-none shadow-xl p-8 space-y-6"
        >
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mx-auto w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-none"
              />
              <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-none flex items-center justify-center"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-green-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you now...</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-red-100 rounded-none flex items-center justify-center"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-red-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
              <p className="text-red-600">{error}</p>
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => router.push('/auth?mode=signin')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-none transition-colors"
                >
                  Go to Sign In
                </button>
                <p className="text-sm text-gray-500">
                  Need a new verification email?{' '}
                  <button
                    onClick={() => router.push('/auth?mode=signin&resend=true')}
                    className="text-orange-500 hover:text-orange-600 font-semibold underline"
                  >
                    Request one here
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

