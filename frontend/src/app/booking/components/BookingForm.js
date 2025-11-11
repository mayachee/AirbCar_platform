'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingForm({ onConfirm, onCancel, loading, error, user }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [specialRequest, setSpecialRequest] = useState('')
  const [licenseFile, setLicenseFile] = useState(null)
  const [licensePreview, setLicensePreview] = useState(null)
  const router = useRouter()

  const isAuthenticated = Boolean(user)
  const loginUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/auth/signin?redirect=/booking'
    }
    const currentPath = window.location.pathname + window.location.search
    return `/auth/signin?redirect=${encodeURIComponent(currentPath)}`
  }, [])

  const handleFileChange = (e) => {
    if (!isAuthenticated) {
      router.push(loginUrl)
      return
    }
    const file = e.target.files[0]
    if (file) {
      setLicenseFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLicensePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLicense = () => {
    setLicenseFile(null)
    setLicensePreview(null)
  }

  const handleConfirm = () => {
    if (!isAuthenticated) {
      router.push(loginUrl)
      return
    }
    if (!agreedToTerms || !licenseFile) {
      return
    }
    onConfirm(specialRequest, licenseFile)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Confirm Your Booking</h2>
            <p className="text-sm text-gray-600">Review and submit your rental request</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!isAuthenticated && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3 items-start">
            <svg className="w-6 h-6 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 9v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900">Sign in required</h3>
              <p className="text-sm text-orange-800">
                Please{' '}
                <button
                  type="button"
                  onClick={() => router.push(loginUrl)}
                  className="font-medium text-orange-700 underline hover:text-orange-800"
                >
                  log in
                </button>{' '}
                to continue with your booking.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-md p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Safety & Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Secure Booking</h3>
              <p className="text-sm text-blue-700">Your booking is secured and protected. All transactions are encrypted and your information is safe.</p>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label htmlFor="specialRequest" className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests or Notes (Optional)
          </label>
          <textarea
            id="specialRequest"
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            placeholder="Any special requests, delivery instructions, or additional information..."
            rows={3}
            disabled={loading || !isAuthenticated}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">This will be sent to the car owner along with your booking request</p>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-gray-200 pt-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={loading || !isAuthenticated}
              className="mt-1 h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline font-medium">
                  Terms and Conditions
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline font-medium">
                  Privacy Policy
                </a>
              </span>
              <p className="text-xs text-gray-500 mt-1">
                By confirming, you agree to pay the booking amount and follow our rental policies
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading || (isAuthenticated && (!agreedToTerms || !licenseFile))}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:shadow-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Booking
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>You can cancel this booking within 24 hours for a full refund</span>
        </div>
      </div>
    </div>
  )
}

