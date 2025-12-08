'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingForm({ onConfirm, onCancel, loading, error, user, onFormDataUpdate, hideButtons = false }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [specialRequest, setSpecialRequest] = useState('')
  const [licenseFrontFile, setLicenseFrontFile] = useState(null)
  const [licenseFrontPreview, setLicenseFrontPreview] = useState(null)
  const [licenseBackFile, setLicenseBackFile] = useState(null)
  const [licenseBackPreview, setLicenseBackPreview] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('online') // 'online' or 'cash'
  const [showPaymentSelection, setShowPaymentSelection] = useState(false)
  const fileInputRef = useRef(null)
  const errorRef = useRef(null)
  const router = useRouter()

  // Use ref to store the latest callback to avoid dependency issues
  const onFormDataUpdateRef = useRef(onFormDataUpdate)
  
  // Update ref when callback changes
  useEffect(() => {
    onFormDataUpdateRef.current = onFormDataUpdate
  }, [onFormDataUpdate])

  // Expose form data to parent component (BookingFlow)
  useEffect(() => {
    if (onFormDataUpdateRef.current) {
      onFormDataUpdateRef.current({
        specialRequest,
        licenseFiles: {
          front: licenseFrontFile,
          back: licenseBackFile
        },
        paymentMethod,
        agreedToTerms
      })
    }
  }, [specialRequest, licenseFrontFile, licenseBackFile, paymentMethod, agreedToTerms])
  // Removed onFormDataUpdate from deps - using ref instead to prevent infinite loops

  const isAuthenticated = Boolean(user)
  
  // Check if user has complete license documents in database (both front and back)
  const hasCompleteLicenseInDatabase = useMemo(() => {
    if (!user) return false
    // Check multiple possible field names (backend might use different naming)
    const frontUrl = user.license_front_document_url || user.licenseFrontDocumentUrl || user.license_front_document || null
    const backUrl = user.license_back_document_url || user.licenseBackDocumentUrl || user.license_back_document || null
    // Must have both front and back documents
    const hasBoth = !!(frontUrl && backUrl)
    
    // Debug logging in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔍 License Check:', {
        hasUser: !!user,
        frontUrl: frontUrl ? 'exists' : 'missing',
        backUrl: backUrl ? 'exists' : 'missing',
        hasBoth,
        userKeys: user ? Object.keys(user).filter(k => k.includes('license')) : []
      })
    }
    
    return hasBoth
  }, [user])
  
  // Check if user has uploaded both documents in this booking form
  const hasCompleteUploadedDocuments = useMemo(() => {
    return !!(
      licenseFrontFile && 
      licenseBackFile
    )
  }, [licenseFrontFile, licenseBackFile])
  
  // Check if user has at least one document (for display purposes)
  const hasAnyLicenseDocuments = useMemo(() => {
    if (!user) return false
    return !!(
      user.license_front_document_url ||
      user.license_back_document_url ||
      user.license_number
    )
  }, [user])
  
  // Check if user has uploaded at least one document
  const hasAnyUploadedDocuments = useMemo(() => {
    return !!(
      licenseFrontFile || 
      licenseBackFile
    )
  }, [licenseFrontFile, licenseBackFile])
  
  // Final check: user must have complete license (both front and back) either in DB or uploaded
  const hasValidLicenseForBooking = hasCompleteLicenseInDatabase || hasCompleteUploadedDocuments

  const loginUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/auth/signin?redirect=/booking'
    }
    const currentPath = window.location.pathname + window.location.search
    return `/auth/signin?redirect=${encodeURIComponent(currentPath)}`
  }, [])

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const validateForm = () => {
    const errors = {}
    if (!agreedToTerms) {
      errors.terms = 'You must agree to the terms and conditions'
    }
    
    // Check if user has complete driver's license (both front and back)
    // Only show error if user doesn't have complete license AND hasn't uploaded both files
    if (!hasValidLicenseForBooking) {
      // Provide more specific error message
      if (hasCompleteLicenseInDatabase) {
        // This shouldn't happen, but just in case
        console.warn('⚠️ hasCompleteLicenseInDatabase is true but hasValidLicenseForBooking is false')
      } else if (hasAnyLicenseDocuments || hasAnyUploadedDocuments) {
        // User has some documents but not both
        const missing = []
        if (!user?.license_front_document_url && !licenseFrontFile) missing.push('front')
        if (!user?.license_back_document_url && !licenseBackFile) missing.push('back')
        errors.license = `Please upload the missing license document${missing.length > 1 ? 's' : ''}: ${missing.join(' and ')}.`
      } else {
        // User has no documents at all
        errors.license = 'You must provide both front and back of your driver\'s license. Please upload the missing documents.'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLicenseFrontChange = (e) => {
    if (!isAuthenticated) {
      router.push(loginUrl)
      return
    }
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        setValidationErrors({
          ...validationErrors,
          licenseFront: 'Please upload a valid image (JPG, PNG, WebP) or PDF file'
        })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors({
          ...validationErrors,
          licenseFront: 'File size must be less than 5MB'
        })
        return
      }
      setLicenseFrontFile(file)
      setValidationErrors({ ...validationErrors, licenseFront: null })
      const reader = new FileReader()
      reader.onloadend = () => {
        setLicenseFrontPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLicenseBackChange = (e) => {
    if (!isAuthenticated) {
      router.push(loginUrl)
      return
    }
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        setValidationErrors({
          ...validationErrors,
          licenseBack: 'Please upload a valid image (JPG, PNG, WebP) or PDF file'
        })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors({
          ...validationErrors,
          licenseBack: 'File size must be less than 5MB'
        })
        return
      }
      setLicenseBackFile(file)
      setValidationErrors({ ...validationErrors, licenseBack: null })
      const reader = new FileReader()
      reader.onloadend = () => {
        setLicenseBackPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLicenseFront = () => {
    setLicenseFrontFile(null)
    setLicenseFrontPreview(null)
  }

  const handleRemoveLicenseBack = () => {
    setLicenseBackFile(null)
    setLicenseBackPreview(null)
  }

  const handleConfirm = () => {
    if (!isAuthenticated) {
      router.push(loginUrl)
      return
    }
    if (!validateForm()) {
      return
    }
    // Show payment method selection first
    setShowPaymentSelection(true)
  }

  const handlePaymentMethodSelected = () => {
    setShowPaymentSelection(false)
    // Show confirmation dialog after payment method is selected
    setShowConfirmDialog(true)
  }

  const handleConfirmBooking = () => {
    setShowConfirmDialog(false)
    // Pass payment method along with other data
    // Pass both license files (front and back) as an object
    const licenseFiles = {
      front: licenseFrontFile || null,
      back: licenseBackFile || null
    }
    onConfirm(specialRequest, licenseFiles, paymentMethod, null)
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
          <div ref={errorRef} className="bg-red-50 border-l-4 border-red-400 rounded-md p-4 animate-shake">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.terms && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">{validationErrors.terms}</p>
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

        {/* Documents Status Check */}
        <div className="mb-6">
          <div className={`border rounded-lg p-4 ${
            hasValidLicenseForBooking 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {hasValidLicenseForBooking ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <h4 className={`text-sm font-semibold mb-1 ${
                  hasValidLicenseForBooking ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {hasValidLicenseForBooking ? 'Documents Status: Ready ✓' : 'Documents Status: Missing ⚠️'}
                </h4>
                {hasValidLicenseForBooking ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-800">
                      You have documents available for this booking.
                    </p>
                    {hasCompleteLicenseInDatabase && (
                      <div className="text-xs text-green-700 space-y-1">
                        <p className="font-medium">From your profile:</p>
                        <p>• License: Front + Back ✓</p>
                        {user.license_number && (
                          <p>• License Number: {user.license_number}</p>
                        )}
                      </div>
                    )}
                    {hasAnyLicenseDocuments && !hasCompleteLicenseInDatabase && (
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p className="font-medium">⚠️ Incomplete license in profile:</p>
                        <p>• Missing: {!user.license_front_document_url ? 'Front' : ''}{!user.license_front_document_url && !user.license_back_document_url ? ' + ' : ''}{!user.license_back_document_url ? 'Back' : ''}</p>
                        <p className="mt-1">Please upload the missing document(s) below.</p>
                      </div>
                    )}
                    {!hasAnyLicenseDocuments && (
                      <div className="text-xs text-orange-700 space-y-1">
                        <p className="font-medium">⚠️ No license documents in profile</p>
                        <p>Please upload both front and back of your driver's license below.</p>
                      </div>
                    )}
                    {hasCompleteUploadedDocuments && (
                      <div className="text-xs text-green-700 space-y-1 mt-2">
                        <p className="font-medium">Uploaded in this form:</p>
                        {licenseFrontFile && <p>• License Front: {licenseFrontFile.name}</p>}
                        {licenseBackFile && <p>• License Back: {licenseBackFile.name}</p>}
                      </div>
                    )}
                    {hasAnyUploadedDocuments && !hasCompleteUploadedDocuments && (
                      <div className="text-xs text-yellow-700 space-y-1 mt-2">
                        <p className="font-medium">⚠️ Incomplete upload:</p>
                        <p>• Missing: {!licenseFrontFile ? 'Front' : ''}{!licenseFrontFile && !licenseBackFile ? ' + ' : ''}{!licenseBackFile ? 'Back' : ''}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-yellow-800 mb-2">
                      No documents found. Please upload your documents below to complete your booking.
                    </p>
                    <p className="text-xs text-yellow-700">
                      Uploading documents helps speed up the approval process and is required for verification.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Driver's License Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver's License 
            {hasCompleteLicenseInDatabase ? (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600 font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete (from your profile)
              </span>
            ) : (
              <>
                <span className="text-red-500 font-normal">(Required)</span>
                {!hasValidLicenseForBooking && (
                  <span className="ml-2 text-xs text-red-600 font-semibold">⚠️ Both front and back required</span>
                )}
              </>
            )}
          </label>
          
          {/* Show success message if complete license exists in database */}
          {hasCompleteLicenseInDatabase && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    ✓ Driver's License Found in Your Profile
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    Both front and back documents are already saved in your profile and will be used for this booking.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {user.license_front_document_url && (
                      <a 
                        href={user.license_front_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-green-700 hover:text-green-800 underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Front
                      </a>
                    )}
                    {user.license_back_document_url && (
                      <a 
                        href={user.license_back_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-green-700 hover:text-green-800 underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Back
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {validationErrors.license && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {validationErrors.license}
              </p>
            </div>
          )}

          {/* License Front Upload - Only show if not complete in database or user wants to replace */}
          {(!hasCompleteLicenseInDatabase || licenseFrontFile) && (
            <div className="mt-4">
              <label htmlFor="licenseFrontFile" className="block text-sm font-medium text-gray-700 mb-2">
                License Front (Recto)
                {hasCompleteLicenseInDatabase && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Optional: replace existing)</span>
                )}
              </label>
              
              {/* Show existing document from profile if available */}
              {user?.license_front_document_url && !licenseFrontFile ? (
              <div className="mt-1">
                <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={user.license_front_document_url} 
                        alt="License front from profile" 
                        className="w-24 h-24 object-cover rounded border-2 border-green-400 shadow-sm"
                        onError={(e) => {
                          e.target.src = '/document-placeholder.svg'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-800">Using document from your profile</p>
                      </div>
                      <p className="text-xs text-green-700">This document will be used for this booking</p>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear the existing document to allow upload
                          const input = document.getElementById('licenseFrontFile')
                          if (input) input.value = ''
                        }}
                        className="mt-2 text-xs text-green-700 hover:text-green-800 underline"
                      >
                        Upload a different document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !licenseFrontFile ? (
              <div className="mt-1">
                <label
                  htmlFor="licenseFrontFile"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold text-orange-600 group-hover:text-orange-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, WebP or PDF (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    id="licenseFrontFile"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleLicenseFrontChange}
                    disabled={loading || !isAuthenticated}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  {licenseFrontPreview && licenseFrontFile.type.startsWith('image/') && (
                    <img src={licenseFrontPreview} alt="License front preview" className="w-20 h-20 object-cover rounded border border-gray-300" />
                  )}
                  {licenseFrontFile.type === 'application/pdf' && (
                    <div className="w-20 h-20 bg-red-100 rounded border border-red-300 flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{licenseFrontFile.name}</p>
                    <p className="text-xs text-gray-500">{(licenseFrontFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLicenseFront}
                    disabled={loading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {validationErrors.licenseFront && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.licenseFront}</p>
            )}
            </div>
          )}

          {/* License Back Upload - Only show if not complete in database or user wants to replace */}
          {(!hasCompleteLicenseInDatabase || licenseBackFile) && (
            <div className="mt-4">
              <label htmlFor="licenseBackFile" className="block text-sm font-medium text-gray-700 mb-2">
                License Back (Verso)
                {hasCompleteLicenseInDatabase && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Optional: replace existing)</span>
                )}
              </label>
            
            {/* Show existing document from profile if available */}
            {user?.license_back_document_url && !licenseBackFile ? (
              <div className="mt-1">
                <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={user.license_back_document_url} 
                        alt="License back from profile" 
                        className="w-24 h-24 object-cover rounded border-2 border-green-400 shadow-sm"
                        onError={(e) => {
                          e.target.src = '/document-placeholder.svg'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-800">Using document from your profile</p>
                      </div>
                      <p className="text-xs text-green-700">This document will be used for this booking</p>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear the existing document to allow upload
                          const input = document.getElementById('licenseBackFile')
                          if (input) input.value = ''
                        }}
                        className="mt-2 text-xs text-green-700 hover:text-green-800 underline"
                      >
                        Upload a different document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !licenseBackFile ? (
              <div className="mt-1">
                <label
                  htmlFor="licenseBackFile"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold text-orange-600 group-hover:text-orange-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, WebP or PDF (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    id="licenseBackFile"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleLicenseBackChange}
                    disabled={loading || !isAuthenticated}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  {licenseBackPreview && licenseBackFile.type.startsWith('image/') && (
                    <img src={licenseBackPreview} alt="License back preview" className="w-20 h-20 object-cover rounded border border-gray-300" />
                  )}
                  {licenseBackFile.type === 'application/pdf' && (
                    <div className="w-20 h-20 bg-red-100 rounded border border-red-300 flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{licenseBackFile.name}</p>
                    <p className="text-xs text-gray-500">{(licenseBackFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLicenseBack}
                    disabled={loading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {validationErrors.licenseBack && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.licenseBack}</p>
            )}
            </div>
          )}
          
          {!hasCompleteLicenseInDatabase && (
            <p className="mt-4 text-xs text-gray-500">Uploading your license helps speed up the approval process</p>
          )}
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
        <div className={`border-t border-gray-200 pt-4 ${validationErrors.terms ? 'border-yellow-400 bg-yellow-50 rounded-lg p-3 -mx-3' : ''}`}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked)
                if (validationErrors.terms) {
                  setValidationErrors({ ...validationErrors, terms: null })
                }
              }}
              disabled={loading || !isAuthenticated}
              className={`mt-1 h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed ${validationErrors.terms ? 'border-yellow-500' : ''}`}
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

        {/* Action Buttons - Hidden when in flow */}
        {!hideButtons && (
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
              disabled={loading || !isAuthenticated || !agreedToTerms}
              className="flex-1 px-6 py-3.5 bg-orange-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:shadow-none"
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
        )}

        {/* Help Text */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>You can cancel this booking within 24 hours for a full refund</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Booking</h3>
                <p className="text-sm text-gray-600">Are you ready to submit your booking request?</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  By confirming, you're submitting a booking request to the car owner. They will review and respond within 24 hours.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">
                    Payment Method: <span className="text-orange-600 capitalize">{paymentMethod}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Yes, Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Dialog */}
      {showPaymentSelection && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0, 0, 0, 0.5)'}}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
                <p className="text-sm text-gray-600">Choose how you'd like to pay for this booking</p>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3 mb-6">
              {/* Online Payment Option */}
              <label
                className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'online'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 h-5 w-5 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'online' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${paymentMethod === 'online' ? 'text-orange-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Online Payment</h4>
                      <p className="text-xs text-gray-500">Pay securely with credit/debit card</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure & Instant</span>
                  </div>
                </div>
              </label>

              {/* Cash Payment Option */}
              <label
                className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 h-5 w-5 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-orange-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Cash Payment</h4>
                      <p className="text-xs text-gray-500">Pay in cash when you pick up the vehicle</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Pay on pickup</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                {paymentMethod === 'online' 
                  ? 'You will be redirected to a secure payment page after booking confirmation.'
                  : 'You will pay the full amount in cash when you pick up the vehicle. The booking will be confirmed once the owner approves your request.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentSelection(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentMethodSelected}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

