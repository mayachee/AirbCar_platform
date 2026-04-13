'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { SelectField } from '@/components/ui/select-field'
import React from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
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

const getStepsConfig = (t) => [
  { id: 1, name: t('dates_step'), icon: Calendar, description: t('dates_step_desc') },
  { id: 2, name: t('documents_step'), icon: FileText, description: t('documents_step_desc') },
  { id: 3, name: t('payment_step'), icon: CreditCard, description: t('payment_step_desc') },
  { id: 4, name: t('review_step'), icon: CheckCircle2, description: t('review_step_desc') },
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
  const t = useTranslations('booking')
  const { formatPrice } = useCurrency()
  const STEPS = getStepsConfig(t)
  const [currentStep, setCurrentStep] = useState(1)
  const [pickupTime, setPickupTime] = useState(initialPickupTime)
  const [returnTime, setReturnTime] = useState(initialReturnTime)
  const [validationErrors, setValidationErrors] = useState({})
  const [formData, setFormData] = useState({
    phoneNumber: '',
    specialRequest: '',
    licenseFiles: null,
    paymentMethod: 'cash',
    agreedToTerms: false
  })
  const [formReady, setFormReady] = useState(false)

  // Prefill phone number from user profile if present
  useEffect(() => {
    const userPhone = String(user?.phone_number || user?.phoneNumber || user?.phone || '').trim()
    const currentPhone = String(formData.phoneNumber || '').trim()
    if (userPhone && !currentPhone) {
      setFormData((prev) => ({ ...prev, phoneNumber: userPhone }))
      setFormReady(true)
    }
  }, [user?.phone_number, user?.phoneNumber, user?.phone, formData.phoneNumber])

  // Style constants for glassmorphism
  const heroBlurFieldClass =
    'bg-white/10 hover:bg-white/15 ' +
    '/10 /15 ' +
    'border border-white/25 hover:border-white/35 ' +
    '/25 /35 ' +
    'text-white ' +
    'backdrop-blur-xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 ' +
    'focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-white/50';

  const glassCardClass = 
    'bg-white/5 border border-white/10 backdrop-blur-md shadow-xl rounded-none overflow-hidden';
    
  const glassContentClass = 
    'bg-white/5 border border-white/10 rounded-none';

  // Helper functions for dates (adapted from SearchForm)
  const pad2 = (n) => String(n).padStart(2, '0');
  const dateToYmd = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const ymdToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((p) => Number(p));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatDateLabel = (dateStr) => {
    const date = ymdToLocalDate(dateStr);
    if (!date || Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const buildDateOptions = (startDateStr, days) => {
    const start = ymdToLocalDate(startDateStr);
    if (!start || Number.isNaN(start.getTime())) return [];

    const options = [];
    const seen = new Set();
    for (let i = 0; i <= days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const value = dateToYmd(d);
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: formatDateLabel(value) });
    }
    return options;
  };

  const buildTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hour = pad2(i);
        const minute = pad2(j);
        const time = `${hour}:${minute}`;
        
        const period = i >= 12 ? 'PM' : 'AM';
        const displayHour = i % 12 || 12;
        const label = `${displayHour}:${minute} ${period}`;
        
        options.push({ value: time, label: label });
      }
    }
    return options;
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const timeOptions = buildTimeOptions();
  const today = new Date();
  const todayStr = dateToYmd(today);

  const heroBlurContentClass =
    'border border-white/20 bg-white/10 text-white ' +
    '/20 /10 ' +
    'backdrop-blur-2xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150';

  // Validate dates on step 1
  const validateStep1 = () => {
    const errors = {}
    if (!pickupDate) {
      errors.pickupDate = t('pickup_date_required')
    }
    if (!returnDate) {
      errors.returnDate = t('return_date_required')
    }
    
    // Simplified validation: removed date logic checks (past dates, return < pickup)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate documents on step 2
  const validateStep2 = () => {
    // Check if user has complete license documents
    if (!user) {
      setValidationErrors({ license: t('user_info_required') })
      return false
    }
    
    const frontUrl =
      user.license_front_document_url ||
      user.licenseFrontDocumentUrl ||
      user.license_front_document ||
      user.licenseFrontDocument ||
      null
    const backUrl =
      user.license_back_document_url ||
      user.licenseBackDocumentUrl ||
      user.license_back_document ||
      user.licenseBackDocument ||
      null
    const hasCompleteLicense = !!(frontUrl && backUrl)
    
    // Also check if files were uploaded in the form
    const hasUploadedFiles = !!(formData.licenseFiles?.front && formData.licenseFiles?.back)
    
    if (!hasCompleteLicense && !hasUploadedFiles) {
      setValidationErrors({
        license: t('license_upload_required')
      })
      return false
    }
    
    if (!formData.agreedToTerms) {
      setValidationErrors({
        terms: t('terms_agreement_required')
      })
      return false
    }

    const phoneValue = String(
      formData.phoneNumber || user?.phone_number || user?.phoneNumber || user?.phone || ''
    ).trim()
    if (!phoneValue) {
      setValidationErrors({
        phone: t('phone_required')
      })
      return false
    }
    
    setValidationErrors({})
    return true
  }
  
  // Handle form data update from BookingForm - memoized to prevent infinite loops
  const handleFormDataUpdate = useCallback((data) => {
    if (data) {
      setFormData(prev => {
        // Only update if data actually changed to prevent unnecessary re-renders
        const hasChanges = Object.keys(data).some(key => {
          if (key === 'licenseFiles') {
            // Deep compare for licenseFiles object
            const prevFiles = prev.licenseFiles || {}
            const newFiles = data.licenseFiles || {}
            return prevFiles.front !== newFiles.front || prevFiles.back !== newFiles.back
          }
          return prev[key] !== data[key]
        })
        
        if (!hasChanges) {
          return prev // Return same reference if no changes
        }
        
        return { ...prev, ...data }
      })
      setFormReady(true)
    }
  }, []) // Empty deps - function doesn't depend on any props/state

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      setCurrentStep(4)
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

  const parsedDays = Math.max(1, parseInt(duration, 10) || 1)
  const dailyRate = Number(vehicle?.price_per_day ?? vehicle?.pricePerDay ?? vehicle?.dailyRate ?? 0)
  const rentalSubtotal = Number.isFinite(dailyRate) ? dailyRate * parsedDays : 0
  const serviceFee = 25
  const safetyDeposit = Number(vehicle?.security_deposit ?? vehicle?.securityDeposit ?? 5000)
  const computedTotal = rentalSubtotal + serviceFee + safetyDeposit
  const totalNumeric = Number(totalPrice)
  const displayTotal = Number.isFinite(totalNumeric) ? totalNumeric : computedTotal

  return (
    <div className="w-full relative">

      {/* Abstract Background Pattern - Only visible if parent doesn't provide it */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-none" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-none bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Booking Flow */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
          {/* Progress Indicator */}
          <div className="mb-6 md:mb-8">
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
                          relative flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-none border-2 transition-all duration-300
                          ${status === 'completed' 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : status === 'active'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                            : 'bg-orange-500/10 border-white/10 text-white/40'
                          }
                        `}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" />
                        ) : (
                          <StepIcon className="w-4 h-4 md:w-6 md:h-6" />
                        )}
                        {status === 'active' && (
                          <div className="absolute inset-0 rounded-none bg-orange-500 animate-ping opacity-20" />
                        )}
                      </div>
                      <div className="mt-2 md:mt-3 text-center">
                        <p className={`text-xs md:text-sm font-semibold ${
                          status === 'active' ? 'text-orange-500' : 
                          status === 'completed' ? 'text-white' : 
                          'text-white/40'
                        }`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-white/40 mt-1 hidden md:block">{step.description}</p>
                      </div>
                    </div>
                    
                    {/* Connector Line */}
                    {!isLast && (
                      <div className={`
                        flex-1 h-0.5 mx-4 transition-all duration-300
                        ${currentStep > step.id ? 'bg-orange-500' : 'bg-white/10'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className={`${glassCardClass}`}>

            {/* Step Body */}
            <div className="p-6">
              {/* Step 1: Dates & Time */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('select_rental_dates')}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t('choose_pickup_return')}
                    </p>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pickup Date */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        {t('pickup_date')}
                      </label>
                      <SelectField
                        id="pickupDate"
                        value={pickupDate || ''}
                        onChange={(e) => onDatesChange?.('pickup', e.target.value)}
                        options={buildDateOptions(todayStr, 180)}
                        placeholder={t('select_pickup_date')}
                        contentProps={{ className: heroBlurContentClass }}
                        className={`${heroBlurFieldClass} ${validationErrors.pickupDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                        
                      />
                      {validationErrors.pickupDate && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.pickupDate}
                        </p>
                      )}
                      
                      {/* Pickup Time */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('pickup_time')}
                        </label>
                        <SelectField
                          id="pickupTime"
                          value={pickupTime || ''}
                          onChange={(e) => handleTimeChange('pickup', e.target.value)}
                          options={timeOptions}
                          placeholder={t('select_pickup_time')}
                          contentProps={{ className: heroBlurContentClass }}
                          className={`${heroBlurFieldClass}`}
                        />
                      </div>
                    </div>

                    {/* Return Date */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        {t('return_date')}
                      </label>
                      <SelectField
                        id="returnDate"
                        value={returnDate || ''}
                        onChange={(e) => onDatesChange?.('return', e.target.value)}
                        options={buildDateOptions(pickupDate || todayStr, 180)}
                        placeholder={t('select_return_date')}
                        contentProps={{ className: heroBlurContentClass }}
                        className={`${heroBlurFieldClass} ${validationErrors.returnDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                        
                      />
                      {validationErrors.returnDate && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.returnDate}
                        </p>
                      )}
                      
                      {/* Return Time */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('return_time')}
                        </label>
                        <SelectField
                          id="returnTime"
                          value={returnTime || ''}
                          onChange={(e) => handleTimeChange('return', e.target.value)}
                          options={timeOptions}
                          placeholder={t('select_return_time')}
                          contentProps={{ className: heroBlurContentClass }}
                          className={`${heroBlurFieldClass}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Documents - Render children (BookingForm) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('upload_documents')}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t('provide_drivers_license')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('phone_number_label')}
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.phoneNumber || user?.phone_number || user?.phoneNumber || user?.phone || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData((prev) => ({ ...prev, phoneNumber: value }))
                        setFormReady(true)
                        if (validationErrors.phone) {
                          setValidationErrors((prev) => ({ ...prev, phone: null }))
                        }
                      }}
                      placeholder={t('phone_placeholder')}
                      className={`w-full px-4 py-3 rounded-none ${heroBlurFieldClass} ${validationErrors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors.phone}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-white/50">
                      {t('phone_used_for_coordination')}
                    </p>
                  </div>

                  {validationErrors.license && (
                    <div className="bg-red-500/10 border-l-4 border-red-500 rounded-none p-4">
                      <p className="text-sm text-red-200">{validationErrors.license}</p>
                    </div>
                  )}
                  {validationErrors.terms && (
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-none p-4">
                      <p className="text-sm text-yellow-200">{validationErrors.terms}</p>
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

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('payment_method')}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t('select_payment_method')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div 
                      className={`p-4 rounded-none border transition-all opacity-50 cursor-not-allowed bg-white/5 border-white/10`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-none bg-white/10 text-white/60`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white/50">{t('pay_online')}</h4>
                          <p className="text-sm text-white/40">{t('pay_online_desc')}</p>
                          <p className="text-xs text-red-400 mt-1">Currently unavailable</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                      className={`p-4 rounded-none border cursor-pointer transition-all ${
                        formData.paymentMethod === 'cash' 
                          ? 'bg-orange-500/20 border-orange-500' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-none ${
                          formData.paymentMethod === 'cash' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60'
                        }`}>
                          <div className="w-6 h-6 font-bold flex items-center justify-center text-lg">$</div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{t('pay_at_pickup')}</h4>
                          <p className="text-sm text-white/60">{t('pay_at_pickup_desc')}</p>
                        </div>
                        {formData.paymentMethod === 'cash' && (
                          <div className="ml-auto text-orange-500">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('review_booking')}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t('review_before_confirm')}
                    </p>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`${glassContentClass} p-4`}>
                      <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Pickup</p>
                      <p className="font-semibold text-white">
                        {pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not selected'}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeDisplay(pickupTime)}
                      </p>
                    </div>
                    <div className={`${glassContentClass} p-4`}>
                      <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Return</p>
                      <p className="font-semibold text-white">
                        {returnDate ? new Date(returnDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not selected'}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeDisplay(returnTime)}
                      </p>
                    </div>
                  </div>

                  {/* User Info */}
                  {user && (
                    <div className={`${glassContentClass} p-4`}>
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-5 h-5 text-white/60" />
                        <h4 className="font-semibold text-white">{t('booking_for')}</h4>
                      </div>
                      <p className="text-sm text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-white/60">{user.email}</p>
                      {(user.phone_number || user.phone || formData.phoneNumber) && (
                        <p className="text-sm text-white/60">{formData.phoneNumber || user.phone_number || user.phone}</p>
                      )}
                    </div>
                  )}

                  {/* Payment Method Review */}
                  <div className={`${glassContentClass} p-4`}>
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="w-5 h-5 text-white/60" />
                      <h4 className="font-semibold text-white">{t('payment_method')}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">
                        {formData.paymentMethod === 'online' ? 'Pay Online (Credit Card)' : 'Pay at Pickup (Cash)'}
                      </span>
                      <span className="px-2 py-0.5 rounded-none bg-orange-500/20 text-orange-400 text-xs font-medium border border-orange-500/20">
                        {t('selected_label')}
                      </span>
                    </div>
                  </div>

                  {/* Driver's License Images */}
                  <div className={`${glassContentClass} p-4`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-white/60" />
                      <h4 className="font-semibold text-white">{t('drivers_license')}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Front Image */}
                      <div>
                        <p className="text-xs text-white/60 mb-2">{t('front')}</p>
                        <div className="relative aspect-video rounded-none overflow-hidden bg-black/20 border border-white/10">
                          {(formData.licenseFiles?.front || user?.license_front_document_url || user?.licenseFrontDocumentUrl) ? (
                            <img 
                              src={formData.licenseFiles?.front instanceof File ? URL.createObjectURL(formData.licenseFiles.front) : (user?.license_front_document_url || user?.licenseFrontDocumentUrl)} 
                              alt="License Front" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-white/40 text-xs">
                              {t('no_image')}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Back Image */}
                      <div>
                        <p className="text-xs text-white/60 mb-2">{t('back')}</p>
                        <div className="relative aspect-video rounded-none overflow-hidden bg-black/20 border border-white/10">
                          {(formData.licenseFiles?.back || user?.license_back_document_url || user?.licenseBackDocumentUrl) ? (
                            <img 
                              src={formData.licenseFiles?.back instanceof File ? URL.createObjectURL(formData.licenseFiles.back) : (user?.license_back_document_url || user?.licenseBackDocumentUrl)} 
                              alt="License Back" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-white/40 text-xs">
                              {t('no_image')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 bg-red-500/10 border-l-4 border-red-500 rounded-none p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-200">{t('error')}</h3>
                      <p className="mt-1 text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Footer - Navigation */}
            <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex items-center justify-between backdrop-blur-sm">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-white/70 font-medium rounded-none hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                {t('back_button')}
              </button>

              <div className="flex items-center gap-2">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-none transition-all ${
                      index + 1 === currentStep
                        ? 'bg-orange-500 w-8'
                        : index + 1 < currentStep
                        ? 'bg-orange-500/50'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2 text-sm md:text-base bg-orange-500 text-white font-semibold rounded-none hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next_button')}
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
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

                      const phoneValue = String(
                        formData.phoneNumber || user?.phone_number || user?.phoneNumber || user?.phone || ''
                      ).trim()
                      
                      onConfirm(
                        formData.specialRequest || '',
                        licenseFiles,
                        formData.paymentMethod || 'online',
                        phoneValue
                      )
                    }
                  }}
                  disabled={loading || !formData.agreedToTerms || !formReady}
                  className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2 text-sm md:text-base bg-green-500 text-white font-semibold rounded-none hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('processing')}
                    </>
                  ) : (
                    <>{t('confirm_booking')}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Vehicle Summary */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          {vehicle && (
            <div className={`${glassCardClass} p-4 md:p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto`}>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                {vehicle.make} {vehicle.model}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-none bg-white/10 border border-white/10 text-xs text-white/80">
                  {vehicle.year}
                </span>
                <span className="px-3 py-1 rounded-none bg-white/10 border border-white/10 text-xs text-white/80">
                  {vehicle.transmission}
                </span>
                <span className="px-3 py-1 rounded-none bg-white/10 border border-white/10 text-xs text-white/80">
                  {vehicle.fuel_type}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-white/60 mb-1">
                  {vehicle.location}
                </p>
              </div>

              <div className="pt-4 md:pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">{t('total_price')}</p>
                  {duration && duration !== '0' && (
                    <p className="text-xs text-white/40 mt-1">
                      {t('for_days_label')} {duration} {duration === '1' ? t('day') : t('days')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-2xl md:text-3xl font-bold text-orange-500">
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t('rental')} ({parsedDays} {parsedDays === 1 ? t('day') : t('days')})</span>
                  <span className="text-white/90 font-medium">{formatPrice(rentalSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t('service_fee')}</span>
                  <span className="text-white/90 font-medium">{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t('safety_deposit')}</span>
                  <span className="text-white/90 font-medium">{formatPrice(safetyDeposit)}</span>
                </div>
                <p className="text-xs text-white/40 pt-1">
                  {t('safety_deposit_refundable')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

