'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, Search, AlertCircle } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';
import { MOROCCAN_CITIES } from '@/constants';
import { motion } from 'framer-motion';

export default function SearchForm({ onSearch, initialValues = {} }) {
  // Get today's date for min date attribute
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const pad2 = (n) => String(n).padStart(2, '0');
  const dateToYmd = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const todayStr = dateToYmd(today);
  const tomorrowStr = dateToYmd(tomorrow);
  const dayAfterTomorrowStr = dateToYmd(dayAfterTomorrow);

  const [location, setLocation] = useState(initialValues.location || '');
  const [pickupDate, setPickupDate] = useState(initialValues.pickupDate || todayStr);
  const [returnDate, setReturnDate] = useState(initialValues.returnDate || tomorrowStr);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when initialValues change
  useEffect(() => {
    if (initialValues.location !== undefined) setLocation(initialValues.location);
    if (initialValues.pickupDate !== undefined) setPickupDate(initialValues.pickupDate);
    else if (!initialValues.pickupDate && !pickupDate) setPickupDate(todayStr);
    if (initialValues.returnDate !== undefined) setReturnDate(initialValues.returnDate);
    else if (!initialValues.returnDate && !returnDate) setReturnDate(tomorrowStr);
  }, [initialValues]);

  // Helper functions for dates
  const ymdToLocalDate = (dateStr) => {
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

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!pickupDate) {
      newErrors.pickupDate = 'Pick-up date is required';
    }

    if (!returnDate) {
      newErrors.returnDate = 'Return date is required';
    } else if (pickupDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      if (returnD < pickup) {
        newErrors.returnDate = 'Return date must be after pick-up date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  // Handle location change
  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    if (touched.location && errors.location) {
      validate();
    }
  };

  // Handle pickup date change
  const handlePickupDateChange = (e) => {
    const newPickupDate = e.target.value;
    setPickupDate(newPickupDate);
    
    // If return date is before new pickup date, update it to be at least same day or next day
    if (returnDate && newPickupDate && returnDate < newPickupDate) {
      setReturnDate(newPickupDate);
    }
    
    if (touched.pickupDate && errors.pickupDate) {
      validate();
    }
  };

  // Handle return date change
  const handleReturnDateChange = (e) => {
    setReturnDate(e.target.value);
    if (touched.returnDate && errors.returnDate) {
      validate();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ location: true, pickupDate: true, returnDate: true });
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSearch({
        location: location.trim(),
        pickupDate,
        returnDate
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroBlurFieldClass =
    'bg-white/10 hover:bg-white/15 ' +
    'dark:bg-white/10 dark:hover:bg-white/15 ' +
    'border border-white/25 hover:border-white/35 ' +
    'dark:border-white/25 dark:hover:border-white/35 ' +
    'text-white ' +
    'backdrop-blur-xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 ' +
    'focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-white/50';

  const heroBlurContentClass =
    'border border-white/20 bg-white/10 text-white ' +
    'dark:border-white/20 dark:bg-white/10 dark:text-white ' +
    'backdrop-blur-2xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150';

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08, duration: 0.5 }}
      className="rounded-2xl p-5 md:p-8 w-full border border-white/25 shadow-2xl bg-transparent supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-120"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Location Select */}
        <div className="md:col-span-1">
          <label htmlFor="location" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
            Pickup location
          </label>
          <SelectField
            id="location"
            value={location}
            onChange={handleLocationChange}
            placeholder="Select a city"
            options={MOROCCAN_CITIES.map((city) => ({ value: city, label: city }))}
            triggerProps={{ 
              'aria-label': 'Pickup location',
              onBlur: () => handleBlur('location')
            }}
            contentProps={{ className: heroBlurContentClass }}
            className={`${heroBlurFieldClass} ${errors.location && touched.location ? 'border-red-400 ring-1 ring-red-400' : ''}`}
          />
          {errors.location && touched.location && (
            <div className="mt-1.5 flex items-center text-xs text-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.location}
            </div>
          )}
        </div>

        {/* Pickup Date */}
        <div className="md:col-span-1">
          <label htmlFor="pickupDate" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
            Pickup date
          </label>
          <SelectField
            id="pickupDate"
            value={pickupDate}
            onChange={handlePickupDateChange}
            options={buildDateOptions(todayStr, 180)}
            triggerProps={{ 
              'aria-label': 'Pickup date',
              onBlur: () => handleBlur('pickupDate')
            }}
            contentProps={{ className: heroBlurContentClass }}
            className={`${heroBlurFieldClass} ${errors.pickupDate && touched.pickupDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
          />
          {errors.pickupDate && touched.pickupDate && (
            <div className="mt-1.5 flex items-center text-xs text-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.pickupDate}
            </div>
          )}
        </div>

        {/* Return Date */}
        <div className="md:col-span-1">
          <label htmlFor="returnDate" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
            Return date
          </label>
          <SelectField
            id="returnDate"
            value={returnDate}
            onChange={handleReturnDateChange}
            options={buildDateOptions(pickupDate || todayStr, 180)}
            triggerProps={{ 
              'aria-label': 'Return date',
              onBlur: () => handleBlur('returnDate')
            }}
            contentProps={{ className: heroBlurContentClass }}
            className={`${heroBlurFieldClass} ${errors.returnDate && touched.returnDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
          />
          {errors.returnDate && touched.returnDate && (
            <div className="mt-1.5 flex items-center text-xs text-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.returnDate}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="md:col-span-1 flex items-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-lg text-white border border-orange-500/20 bg-orange-500 shadow-lg hover:shadow-xl hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/40 backdrop-blur-2xl backdrop-saturate-150 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search Cars'
            )}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
