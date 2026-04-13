'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export default function ForgotPassword() {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError('')

    try {
      // First, wake up the backend (Render free tier sleeps after inactivity)
      try {
        const healthCheck = await apiClient.get('/api/health/', undefined, { 
          skipAuth: true,
          timeout: 60000 // 60 seconds - Render cold start can take up to 50s
        })
        if (!healthCheck.data || (healthCheck.data.status !== 'ok' && healthCheck.data.status !== 'error')) {
          setError(
            'The server is not responding correctly. Please wait a moment and try again.'
          )
          setIsLoading(false)
          return
        }
      } catch (healthError) {
        if (healthError.status === 500 || healthError.isTimeoutError || healthError.isNetworkError || healthError.isConnectionError) {
          setError(
            'The server is waking up or temporarily unavailable.\n\n' +
            'Please wait 30-60 seconds and try again.'
          )
          setIsLoading(false)
          return
        }
        console.warn('Health check returned non-critical error, proceeding anyway:', healthError)
      }

      // Backend is awake, proceed with password reset
      await apiClient.post(
        '/api/password-reset/', 
        { email: data.email }, 
        { 
          skipAuth: true,
          timeout: 60000 // 60 seconds - SMTP can be slow
        }
      )
      setSuccess(true)
    } catch (error) {
      console.error('Password reset error:', error)
      
      // Handle timeout errors specifically
      if (error.isTimeoutError || error.message?.includes('timeout') || error.message?.includes('did not respond')) {
        setError(
          'The request timed out. The server may still be processing your request.\n\n' +
          'Please check your email inbox in a few minutes. If you don\'t receive an email, try again.'
        )
        return
      }
      
      // Handle different error types
      if (error.message) {
        setError(error.message)
      } else if (error.status === 404) {
        setError('Password reset endpoint not found. Please contact support.')
      } else if (error.status === 400) {
        setError('Invalid email address. Please check and try again.')
      } else if (error.isNetworkError || error.isConnectionError) {
        setError(
          'Unable to connect to the server. Please check your internet connection and try again. ' +
          'If the problem persists, the server might be temporarily unavailable.'
        )
      } else {
        setError('Failed to send password reset email. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
          <div className="bg-white/10 backdrop-blur-xl backdrop-saturate-150 rounded-none shadow-2xl overflow-hidden border border-white/20">
            <div className="py-10 px-6 sm:px-10">
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

              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-green-400 mb-6">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('check_email')}
                </h2>
                <p className="text-sm text-white/80 mb-6">
                  {t('reset_link_sent')}
                </p>
                <p className="text-xs text-white/60 mb-8">
                  {t('check_email_instructions')}
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex justify-center w-full py-3.5 px-4 border border-transparent rounded-none shadow-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
                >
                  {t('back_to_signin')}
                </Link>
              </div>
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
        <div className="bg-white/10 backdrop-blur-xl backdrop-saturate-150 rounded-none shadow-2xl overflow-hidden border border-white/20">
          <div className="py-10 px-6 sm:px-10">
            {/* Logo */}
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

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-white">
                {t('forgot_password_title')}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {t('forgot_password_description')}
              </p>
            </motion.div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-none text-sm shadow-sm whitespace-pre-line"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm text-white placeholder-white/50 transition-all bg-white/10 hover:border-white/30"
                    placeholder={t('enter_email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: -2 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-none shadow-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden group"
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
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-none"
                        />
                        {t('sending')}
                      </>
                    ) : (
                      t('send_reset_link')
                    )}
                  </span>
                </motion.button>

                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-3.5 px-4 border border-white/20 rounded-none shadow-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
                >
                  {t('back_to_signin')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
