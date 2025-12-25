'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, X, Search, AlertCircle } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function SearchForm({ onSearch, initialValues = {} }) {
  // Get today's date for min date attribute
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [location, setLocation] = useState(initialValues.location || '');
  const [pickupDate, setPickupDate] = useState(initialValues.pickupDate || tomorrowStr);
  const [returnDate, setReturnDate] = useState(initialValues.returnDate || dayAfterTomorrowStr);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when initialValues change
  useEffect(() => {
    if (initialValues.location !== undefined) setLocation(initialValues.location);
    if (initialValues.pickupDate !== undefined) setPickupDate(initialValues.pickupDate);
    else if (!initialValues.pickupDate && !pickupDate) setPickupDate(tomorrowStr);
    if (initialValues.returnDate !== undefined) setReturnDate(initialValues.returnDate);
    else if (!initialValues.returnDate && !returnDate) setReturnDate(dayAfterTomorrowStr);
  }, [initialValues]);
  
  // Calculate minimum return date (should be same or after pickup date)
  const minReturnDate = pickupDate || todayStr;

  // Calculate number of days
  const numberOfDays = useMemo(() => {
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      const diffTime = Math.abs(returnD - pickup);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }
    return null;
  }, [pickupDate, returnDate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!pickupDate) {
      newErrors.pickupDate = 'Pick-up date is required';
    } else {
      const pickup = new Date(pickupDate);
      const todayDate = new Date(todayStr);
      if (pickup < todayDate) {
        newErrors.pickupDate = 'Pick-up date cannot be in the past';
      }
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
    
    // If return date is before new pickup date, clear it
    if (returnDate && newPickupDate && returnDate < newPickupDate) {
      setReturnDate('');
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

  // Handle clear form
  const handleClear = () => {
    setLocation('');
    setPickupDate('');
    setReturnDate('');
    setErrors({});
    setTouched({});
  };

  // Check if form has values
  const hasValues = location || pickupDate || returnDate;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Perfect Car</h2>
        <p className="text-gray-600 text-sm">Search by location and dates to discover available vehicles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Location Select */}
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Pick-up Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <SelectField
              id="location"
              value={location}
              onChange={(e) => handleLocationChange(e)}
              placeholder="Select a location"
              options={[
                { value: 'Casablanca', label: 'Casablanca' },
                { value: 'Rabat', label: 'Rabat' },
                { value: 'Marrakech', label: 'Marrakech' },
                { value: 'Fes', label: 'Fes' },
                { value: 'Tangier', label: 'Tangier' },
                { value: 'Tetouan', label: 'Tetouan' },
                { value: 'Agadir', label: 'Agadir' },
                { value: 'Oujda', label: 'Oujda' },
                { value: 'Meknes', label: 'Meknes' },
                { value: 'Kenitra', label: 'Kenitra' },
                { value: 'El Jadida', label: 'El Jadida' },
                { value: 'Safi', label: 'Safi' },
                { value: 'Mohammedia', label: 'Mohammedia' },
                { value: 'Nador', label: 'Nador' },
                { value: 'Beni Mellal', label: 'Beni Mellal' },
                { value: 'Taza', label: 'Taza' },
                { value: 'Essaouira', label: 'Essaouira' },
                { value: 'Larache', label: 'Larache' },
                { value: 'Khouribga', label: 'Khouribga' },
                { value: 'Settat', label: 'Settat' },
                { value: 'Casablanca Airport', label: 'Casablanca Airport (CMN)' },
                { value: 'Marrakech Airport', label: 'Marrakech Airport (RAK)' },
                { value: 'Fes Airport', label: 'Fes Airport (FEZ)' },
                { value: 'Tangier Airport', label: 'Tangier Airport (TNG)' },
                { value: 'Agadir Airport', label: 'Agadir Airport (AGA)' },
              ]}
              className={`block w-full pl-12 pr-10 py-3.5 border rounded-xl transition-all text-gray-900 bg-white cursor-pointer ${
                errors.location && touched.location
                  ? 'border-red-300 bg-red-50 focus:ring-red-500/30 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400 focus:ring-orange-500/30 focus:border-orange-500'
              } ${!location ? 'text-gray-500' : 'text-gray-900'}`}
              triggerProps={{
                onBlur: () => handleBlur('location'),
                'aria-invalid': Boolean(errors.location && touched.location),
                'aria-describedby': errors.location && touched.location ? 'location-error' : undefined,
              }}
            />
            {location && (
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setErrors(prev => ({ ...prev, location: undefined }));
                }}
                className="absolute inset-y-0 right-8 pr-2 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-20"
                aria-label="Clear location"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {errors.location && touched.location && (
            <div id="location-error" className="mt-1.5 flex items-center text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.location}
            </div>
          )}
        </div>

        {/* Pick-up Date */}
        <div className="relative">
          <label htmlFor="pickupDate" className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Pick-up Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="pickupDate"
              value={pickupDate}
              onChange={handlePickupDateChange}
              onBlur={() => handleBlur('pickupDate')}
              min={todayStr}
              className={`block w-full pl-12 pr-3 py-3.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                errors.pickupDate && touched.pickupDate
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              aria-invalid={errors.pickupDate && touched.pickupDate}
              aria-describedby={errors.pickupDate && touched.pickupDate ? 'pickupDate-error' : undefined}
            />
            {pickupDate && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(pickupDate).split(',')[0]}
                </span>
              </div>
            )}
          </div>
          {errors.pickupDate && touched.pickupDate && (
            <div id="pickupDate-error" className="mt-1.5 flex items-center text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.pickupDate}
            </div>
          )}
          {pickupDate && !errors.pickupDate && (
            <div className="mt-1.5 text-xs text-gray-500">
              {formatDate(pickupDate)}
            </div>
          )}
        </div>

        {/* Return Date */}
        <div className="relative">
          <label htmlFor="returnDate" className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Return Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar className={`h-5 w-5 ${!pickupDate ? 'text-gray-300' : 'text-gray-400'}`} />
            </div>
            <input
              type="date"
              id="returnDate"
              value={returnDate}
              onChange={handleReturnDateChange}
              onBlur={() => handleBlur('returnDate')}
              min={minReturnDate}
              disabled={!pickupDate}
              className={`block w-full pl-12 pr-3 py-3.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                !pickupDate
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
                  : errors.returnDate && touched.returnDate
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              aria-invalid={errors.returnDate && touched.returnDate}
              aria-describedby={errors.returnDate && touched.returnDate ? 'returnDate-error' : undefined}
              aria-disabled={!pickupDate}
            />
            {returnDate && pickupDate && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(returnDate).split(',')[0]}
                </span>
              </div>
            )}
          </div>
          {errors.returnDate && touched.returnDate && (
            <div id="returnDate-error" className="mt-1.5 flex items-center text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.returnDate}
            </div>
          )}
          {returnDate && !errors.returnDate && (
            <div className="mt-1.5 text-xs text-gray-500">
              {formatDate(returnDate)}
            </div>
          )}
          {numberOfDays && numberOfDays > 0 && !errors.returnDate && (
            <div className="mt-1.5 text-xs font-medium text-orange-600">
              {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'} rental
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        {/* Clear Button */}
        {hasValues && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !location.trim() || !pickupDate || !returnDate}
          className={`inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-white transition-all shadow-lg ${
            isSubmitting || !location.trim() || !pickupDate || !returnDate
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search Cars
            </>
          )}
        </button>
      </div>
    </form>
  );
}
