'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [tokenValid, setTokenValid] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Extract token from URL and validate it
  useEffect(() => {
    setIsClient(true)
    
    const tokenFromUrl = searchParams.get('token')
    
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please check your email for the correct link.')
      setTokenValid(false)
      return
    }
    
    setToken(tokenFromUrl)
    
    // Validate token with backend
    const validateToken = async () => {
      try {
        const response = await apiClient.get(
          `/api/password-reset/confirm/?token=${encodeURIComponent(tokenFromUrl)}`,
          undefined,
          { skipAuth: true }
        )
        
        if (response.data?.valid) {
          setTokenValid(true)
          setError('')
        } else {
          setTokenValid(false)
          setError(response.data?.error || 'Invalid or expired reset link.')
        }
      } catch (err) {
        console.error('Error validating token:', err)
        setTokenValid(false)
        setError(err.message || 'Invalid or expired reset link.')
      }
    }
    
    validateToken()
  }, [searchParams])

  const onSubmit = async (data) => {
    if (!token) {
      setError('Invalid reset token. Please check your email for the correct link.')
      return
    }

    if (!tokenValid) {
      setError('Invalid or expired reset link. Please request a new one.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.post(
        '/api/password-reset/confirm/',
        {
          token: token,
          password: data.password,
        },
        { skipAuth: true }
      )

      if (response.data?.reset) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(response.data?.error || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError(error.message || 'Failed to reset password. The link may have expired or is invalid.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state until client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-orange-500">Airbcar</h1>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-green-600 mb-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Password reset successfully!
              </h2>
              <p className="text-sm text-gray-700 mb-6">
                Your password has been updated. Redirecting to sign in...
              </p>
            </div>
          </div>
        </div>
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <h3 className="text-3xl font-bold mb-4">Success!</h3>
              <p className="text-lg opacity-90">Your password has been updated successfully</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && (!token || tokenValid === false)) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-orange-500">Airbcar</h1>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Invalid reset link
              </h2>
              <p className="text-sm text-gray-700 mb-6">
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex justify-center py-3 px-6 border border-transparent rounded-none shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <h3 className="text-3xl font-bold mb-4">Link Expired</h3>
              <p className="text-lg opacity-90">Request a new password reset link</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-orange-500">Airbcar</h1>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your new password below.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Enter your new password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Confirm your new password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || !token || tokenValid !== true}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-none shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Updating password...' : tokenValid === null ? 'Validating link...' : 'Update password'}
              </button>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-none shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h3 className="text-3xl font-bold mb-4">Set New Password</h3>
            <p className="text-lg opacity-90">Choose a strong password for your account security</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPassword />
    </Suspense>
  )
}
