'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { 
  Calendar, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  User,
  Shield,
  AlertCircle
} from 'lucide-react'

const STEPS = [
  { id: 1, name: 'Dates & Time', icon: Calendar, description: 'Select pickup and return dates' },
  { id: 2, name: 'Documents', icon: FileText, description: 'Upload driver\'s license' },
  { id: 3, name: 'Review', icon: CheckCircle2, description: 'Review and confirm booking' },
]

export default function BookingFlow({ 
  pickupDate, 
  returnDate,
  pickupTime: initialPickupTime = '10:00',
  returnTime: initialReturnTime = '18:00',
  onDatesChange,
  onTimeChange,
  user,
  vehicle,
  totalPrice,
  duration,
  onConfirm,
  loading,
  error,
  children
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [pickupTime, setPickupTime] = useState(initialPickupTime)
  const [returnTime, setReturnTime] = useState(initialReturnTime)
  const [validationErrors, setValidationErrors] = useState({})
  const [formData, setFormData] = useState({
    specialRequest: '',
    licenseFiles: null,
    paymentMethod: 'online',
    agreedToTerms: false
  })
  const [formReady, setFormReady] = useState(false)

  // Validate dates on step 1
  const validateStep1 = () => {
    const errors = {}
    if (!pickupDate) {
      errors.pickupDate = 'Pickup date is required'
    }
    if (!returnDate) {
      errors.returnDate = 'Return date is required'
    }
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate)
      const returnD = new Date(returnDate)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      if (pickup < now) {
        errors.pickupDate = 'Pickup date cannot be in the past'
      }
      if (returnD <= pickup) {
        errors.returnDate = 'Return date must be after pickup date'
      }
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate documents on step 2
  const validateStep2 = () => {
    // Check if user has complete license documents
    if (!user) {
      setValidationErrors({ license: 'User information is required' })
      return false
    }
    
    const frontUrl = user.license_front_document_url || user.licenseFrontDocumentUrl || null
    const backUrl = user.license_back_document_url || user.licenseBackDocumentUrl || null
    const hasCompleteLicense = !!(frontUrl && backUrl)
    
    // Also check if files were uploaded in the form
    const hasUploadedFiles = !!(formData.licenseFiles?.front && formData.licenseFiles?.back)
    
    if (!hasCompleteLicense && !hasUploadedFiles) {
      setValidationErrors({
        license: 'Please upload both front and back of your driver\'s license'
      })
      return false
    }
    
    if (!formData.agreedToTerms) {
      setValidationErrors({
        terms: 'You must agree to the terms and conditions'
      })
      return false
    }
    
    setValidationErrors({})
    return true
  }
  
  // Handle form data update from BookingForm
  const handleFormDataUpdate = (data) => {
    if (data) {
      setFormData(prev => ({ ...prev, ...data }))
      setFormReady(true)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleTimeChange = (type, time) => {
    if (type === 'pickup') {
      setPickupTime(time)
      onTimeChange?.('pickup', time)
    } else {
      setReturnTime(time)
      onTimeChange?.('return', time)
    }
  }

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id)
            const StepIcon = step.icon
            const isLast = index === STEPS.length - 1
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                      ${status === 'completed' 
                        ? 'bg-orange-500 border-orange-500 text-white' 
                        : status === 'active'
                        ? 'bg-orange-100 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                    {status === 'active' && (
                      <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${
                      status === 'active' ? 'text-orange-600' : 
                      status === 'completed' ? 'text-gray-900' : 
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className={`
                    flex-1 h-0.5 mx-4 transition-all duration-300
                    ${currentStep > step.id ? 'bg-orange-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Step Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon
                return <StepIcon className="w-6 h-6 text-white" />
              })()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {STEPS[currentStep - 1].name}
              </h2>
              <p className="text-sm text-orange-100">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6">
          {/* Step 1: Dates & Time */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Your Rental Dates
                </h3>
                <p className="text-sm text-gray-600">
                  Choose when you'd like to pick up and return the vehicle
                </p>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate || ''}
                    onChange={(e) => onDatesChange?.('pickup', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all
                      ${validationErrors.pickupDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                  />
                  {validationErrors.pickupDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.pickupDate}
                    </p>
                  )}
                  
                  {/* Pickup Time */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => handleTimeChange('pickup', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                {/* Return Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate || ''}
                    onChange={(e) => onDatesChange?.('return', e.target.value)}
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all
                      ${validationErrors.returnDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                  />
                  {validationErrors.returnDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.returnDate}
                    </p>
                  )}
                  
                  {/* Return Time */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Return Time
                    </label>
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => handleTimeChange('return', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Summary */}
              {pickupDate && returnDate && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rental Duration</p>
                      <p className="text-lg font-bold text-gray-900">
                        {duration} {duration === '1' ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {totalPrice} MAD
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Documents - Render children (BookingForm) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Your Documents
                </h3>
                <p className="text-sm text-gray-600">
                  Please provide your driver's license for verification
                </p>
              </div>
              {validationErrors.license && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-md p-4">
                  <p className="text-sm text-red-700">{validationErrors.license}</p>
                </div>
              )}
              {validationErrors.terms && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4">
                  <p className="text-sm text-yellow-800">{validationErrors.terms}</p>
                </div>
              )}
              {/* Render children with form data callback */}
              {React.isValidElement(children)
                ? React.cloneElement(children, { 
                    onFormDataUpdate: handleFormDataUpdate,
                    hideButtons: true 
                  })
                : children
              }
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review Your Booking
                </h3>
                <p className="text-sm text-gray-600">
                  Please review all details before confirming
                </p>
              </div>

              {/* Vehicle Summary */}
              {vehicle && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-4">
                    {vehicle.pictures && vehicle.pictures.length > 0 && (
                      <img
                        src={vehicle.pictures[0]}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {vehicle.year} • {vehicle.transmission} • {vehicle.fuel_type}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {vehicle.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Pickup</p>
                  <p className="font-semibold text-gray-900">
                    {pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not selected'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {pickupTime}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Return</p>
                  <p className="font-semibold text-gray-900">
                    {returnDate ? new Date(returnDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not selected'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {returnTime}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Total Amount</h4>
                  <p className="text-3xl font-bold text-orange-600">
                    {totalPrice} MAD
                  </p>
                </div>
                <div className="pt-4 border-t border-orange-200">
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Free cancellation up to 24 hours before pickup
                  </p>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Booking For</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone_number && (
                    <p className="text-sm text-gray-600">{user.phone_number}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step Footer - Navigation */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index + 1 === currentStep
                    ? 'bg-orange-500 w-8'
                    : index + 1 < currentStep
                    ? 'bg-orange-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                // In step 3, trigger the actual booking with collected form data
                if (typeof onConfirm === 'function') {
                  // Ensure we have the latest form data
                  const licenseFiles = formData.licenseFiles || {
                    front: null,
                    back: null
                  }
                  
                  onConfirm(
                    formData.specialRequest || '',
                    licenseFiles,
                    formData.paymentMethod || 'online'
                  )
                }
              }}
              disabled={loading || !formData.agreedToTerms || !formReady}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

