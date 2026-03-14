'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usePasswordReset } from '@/features/auth/hooks/useAuth'

/**
 * Email Verification Page for Password Reset
 * 
 * This page is shown after user requests password reset.
 * User enters the 6-digit verification code from their email.
 * After verification succeeds, they're redirected to password reset page with token.
 */
function VerifyPasswordResetEmail() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { loading, error, successMessage, verifyPasswordResetEmail } = usePasswordReset()
  
  // Get email from URL params (passed from forgot-password page)
  useState(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    
    if (!email) {
      setLocalError('Email is required')
      return
    }
    
    if (!code || code.length === 0) {
      setLocalError('Verification code is required')
      return
    }
    
    try {
      setIsSubmitting(true)
      const resetToken = await verifyPasswordResetEmail(email, code)
      
      // Redirect to password reset page with the reset token
      router.push(`/auth/reset-password?token=${resetToken}`)
    } catch (err) {
      setLocalError(err.message || 'Failed to verify email code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-orange-500">Airbcar</h1>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code we sent to <span className="font-semibold">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input (Hidden - just for reference) */}
            <input type="hidden" value={email} />

            {/* Verification Code Input */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
                disabled={loading || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-center text-2xl tracking-widest font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                The code expires in 15 minutes
              </p>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting || !code}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading || isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend Code Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <Link href="/auth/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                Request a new one
              </Link>
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center border-t border-gray-200 pt-6">
            <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image/Gradient */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <svg className="w-20 h-20 mx-auto mb-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-3xl font-bold mb-4">Secure Verification</h3>
            <p className="text-lg opacity-90">We've sent a verification code to your email.</p>
            <p className="text-lg opacity-90 mt-2">Enter it here to proceed with password reset.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyPasswordResetEmail
