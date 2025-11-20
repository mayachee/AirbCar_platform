'use client';

import { useState, useEffect, useRef } from 'react';
import { validateField } from '@/features/user/types/accountData';

export default function ProfileSection({ accountData, handleFieldChange, formatProfileCompletion, profileCompletion, onProfilePictureChange }) {
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());
  // Track blob URLs to clean them up on unmount
  const blobUrlsRef = useRef(new Set());

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (onProfilePictureChange) {
        setUploading(true);
        onProfilePictureChange(file).finally(() => setUploading(false));
      }
    }
  };

  // Validate field on change
  const handleFieldChangeWithValidation = (fieldName, value) => {
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]));
    
    // Update the field value
    handleFieldChange(fieldName, value);
    
    // Validate the field
    const validation = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.error
    }));
  };

  // Validate all fields on mount and when accountData changes
  useEffect(() => {
    const errors = {};
    Object.keys(accountData).forEach(key => {
      if (touchedFields.has(key)) {
        const validation = validateField(key, accountData[key]);
        if (!validation.isValid) {
          errors[key] = validation.error;
        }
      }
    });
    setFieldErrors(errors);
  }, [accountData, touchedFields]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all blob URLs when component unmounts
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors when revoking
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Helper to get field error class
  const getFieldErrorClass = (fieldName) => {
    const hasError = touchedFields.has(fieldName) && fieldErrors[fieldName];
    return hasError 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-orange-500 focus:border-transparent';
  };

  // Helper to render field error
  const renderFieldError = (fieldName) => {
    if (touchedFields.has(fieldName) && fieldErrors[fieldName]) {
      return (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {fieldErrors[fieldName]}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Upload */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <img
              src={accountData.profileImage || accountData.profileImageUrl || '/default-avatar.svg'}
              alt="Profile"
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                if (e.target.src !== '/default-avatar.svg') {
                  e.target.src = '/default-avatar.svg';
                }
              }}
            />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
                id="profile-picture-upload"
              />
              <span className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {uploading ? 'Uploading...' : 'Change Picture'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
          </div>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <span className="text-sm font-medium opacity-90">Profile Completion</span>
          <span className="text-2xl font-bold">{profileCompletion}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300" 
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-90">{formatProfileCompletion(profileCompletion)}</p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={accountData.firstName || ''}
            onChange={(e) => handleFieldChangeWithValidation('firstName', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'firstName']))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('firstName')}`}
            placeholder="Enter your first name"
          />
          {renderFieldError('firstName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={accountData.lastName || ''}
            onChange={(e) => handleFieldChangeWithValidation('lastName', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'lastName']))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('lastName')}`}
            placeholder="Enter your last name"
          />
          {renderFieldError('lastName')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={accountData.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={accountData.phoneNumber || ''}
            onChange={(e) => handleFieldChangeWithValidation('phoneNumber', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'phoneNumber']))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('phoneNumber')}`}
            placeholder="+1234567890"
          />
          {renderFieldError('phoneNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={accountData.dateOfBirth || ''}
            onChange={(e) => handleFieldChangeWithValidation('dateOfBirth', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'dateOfBirth']))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('dateOfBirth')}`}
            max={new Date().toISOString().split('T')[0]}
          />
          {renderFieldError('dateOfBirth')}
        </div>
      </div>

      {/* Nationality/Place of Birth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nationality / Place of Birth
        </label>
        <input
          type="text"
          name="placeOfBirth"
          value={accountData.placeOfBirth || ''}
          onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter your nationality or place of birth"
        />
        <p className="text-xs text-gray-500 mt-1">Optional: Your nationality or place of birth</p>
      </div>

      {/* Contact Information Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={accountData.address || ''}
              onChange={(e) => handleFieldChangeWithValidation('address', e.target.value)}
              onBlur={() => setTouchedFields(prev => new Set([...prev, 'address']))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('address')}`}
              placeholder="Street address"
            />
            {renderFieldError('address')}
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={accountData.city || ''}
                onChange={(e) => handleFieldChangeWithValidation('city', e.target.value)}
                onBlur={() => setTouchedFields(prev => new Set([...prev, 'city']))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('city')}`}
                placeholder="City"
              />
              {renderFieldError('city')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={accountData.country || ''}
                onChange={(e) => handleFieldChangeWithValidation('country', e.target.value)}
                onBlur={() => setTouchedFields(prev => new Set([...prev, 'country']))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('country')}`}
                placeholder="Country"
              />
              {renderFieldError('country')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={accountData.postalCode || ''}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Postal/ZIP code"
              />
            </div>
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver's License Information</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide your driver's license details for verification purposes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={accountData.licenseNumber || ''}
              onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter license number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Country
            </label>
            <input
              type="text"
              name="licenseCountry"
              value={accountData.licenseCountry || ''}
              onChange={(e) => handleFieldChange('licenseCountry', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Country that issued the license"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              name="licenseIssueDate"
              value={accountData.licenseIssueDate || ''}
              onChange={(e) => handleFieldChangeWithValidation('licenseIssueDate', e.target.value)}
              onBlur={() => setTouchedFields(prev => new Set([...prev, 'licenseIssueDate']))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('licenseIssueDate')}`}
            />
            {renderFieldError('licenseIssueDate')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="licenseExpiryDate"
              value={accountData.licenseExpiryDate || ''}
              onChange={(e) => handleFieldChangeWithValidation('licenseExpiryDate', e.target.value)}
              onBlur={() => setTouchedFields(prev => new Set([...prev, 'licenseExpiryDate']))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${getFieldErrorClass('licenseExpiryDate')}`}
            />
            {renderFieldError('licenseExpiryDate')}
          </div>
        </div>
        
        {/* Driver's License Documents */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Driver's License Documents</h4>
          <p className="text-sm text-gray-600 mb-4">
            Upload clear photos of the front and back of your driver's license. These are used to verify your license and will be reviewed by our team.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              // Use hosted URLs from backend (full URLs) or preview if uploading
              const frontPreview = accountData.licenseFrontDocumentUrl || accountData.licenseFrontDocumentPreview || '';
              const backPreview = accountData.licenseBackDocumentUrl || accountData.licenseBackDocumentPreview || '';

              // Helper to check if URL is a blob URL
              const isBlobUrl = (url) => url && url.startsWith('blob:');

              const renderDocumentCard = (label, preview, url, fileName, onSelect) => {
                const imageUrl = url || preview;
                const isBlob = isBlobUrl(imageUrl);
                
                return (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onSelect}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-orange-600"
                      />
                    </label>
                    {fileName && (
                      <p className="text-xs text-gray-500 truncate">
                        Selected file: <span className="font-medium">{fileName}</span>
                      </p>
                    )}
                    {imageUrl ? (
                      <a 
                        href={url || preview} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block group"
                        onClick={(e) => {
                          if (isBlob && !imageUrl) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                          <img
                            src={imageUrl}
                            alt={`${label}`}
                            className="h-40 w-full object-contain bg-gray-100 transition-transform duration-200 group-hover:scale-[1.02]"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              if (isBlobUrl(event.target.src)) {
                                try {
                                  URL.revokeObjectURL(event.target.src);
                                  blobUrlsRef.current.delete(event.target.src);
                                } catch (e) {
                                  // Ignore errors
                                }
                              }
                              event.currentTarget.src = '/document-placeholder.svg';
                            }}
                          />
                        </div>
                        <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-orange-600 group-hover:text-orange-700">
                          {url ? 'View current document' : 'View upload preview'}
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14" />
                          </svg>
                        </span>
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No document on file.</p>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {renderDocumentCard(
                    'License Front',
                    frontPreview,
                    accountData.licenseFrontDocumentUrl,
                    accountData.licenseFrontDocumentFile?.name,
                    (event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) {
                        if (accountData.licenseFrontDocumentPreview && accountData.licenseFrontDocumentPreview.startsWith('blob:')) {
                          try {
                            URL.revokeObjectURL(accountData.licenseFrontDocumentPreview);
                            blobUrlsRef.current.delete(accountData.licenseFrontDocumentPreview);
                          } catch (e) {
                            // Ignore errors
                          }
                        }
                        handleFieldChange({ name: 'licenseFrontDocumentFile', value: file });
                        const previewUrl = URL.createObjectURL(file);
                        blobUrlsRef.current.add(previewUrl);
                        handleFieldChange({ name: 'licenseFrontDocumentPreview', value: previewUrl });
                      } else {
                        if (accountData.licenseFrontDocumentPreview && accountData.licenseFrontDocumentPreview.startsWith('blob:')) {
                          try {
                            URL.revokeObjectURL(accountData.licenseFrontDocumentPreview);
                            blobUrlsRef.current.delete(accountData.licenseFrontDocumentPreview);
                          } catch (e) {
                            // Ignore errors
                          }
                        }
                        handleFieldChange({ name: 'licenseFrontDocumentFile', value: null });
                        handleFieldChange({ name: 'licenseFrontDocumentPreview', value: '' });
                      }
                    }
                  )}
                  {renderDocumentCard(
                    'License Back',
                    backPreview,
                    accountData.licenseBackDocumentUrl,
                    accountData.licenseBackDocumentFile?.name,
                    (event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) {
                        if (accountData.licenseBackDocumentPreview && accountData.licenseBackDocumentPreview.startsWith('blob:')) {
                          try {
                            URL.revokeObjectURL(accountData.licenseBackDocumentPreview);
                            blobUrlsRef.current.delete(accountData.licenseBackDocumentPreview);
                          } catch (e) {
                            // Ignore errors
                          }
                        }
                        handleFieldChange({ name: 'licenseBackDocumentFile', value: file });
                        const previewUrl = URL.createObjectURL(file);
                        blobUrlsRef.current.add(previewUrl);
                        handleFieldChange({ name: 'licenseBackDocumentPreview', value: previewUrl });
                      } else {
                        if (accountData.licenseBackDocumentPreview && accountData.licenseBackDocumentPreview.startsWith('blob:')) {
                          try {
                            URL.revokeObjectURL(accountData.licenseBackDocumentPreview);
                            blobUrlsRef.current.delete(accountData.licenseBackDocumentPreview);
                          } catch (e) {
                            // Ignore errors
                          }
                        }
                        handleFieldChange({ name: 'licenseBackDocumentFile', value: null });
                        handleFieldChange({ name: 'licenseBackDocumentPreview', value: '' });
                      }
                    }
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Identity Documents */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Documents</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload clear photos of the front and back of your ID. These are used to verify your identity and will be reviewed by our team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            // Use hosted URLs from backend (full URLs) or preview if uploading
            // Prioritize hosted URL over blob preview
            const frontPreview = accountData.idFrontDocumentUrl || accountData.idFrontDocumentPreview || '';
            const backPreview = accountData.idBackDocumentUrl || accountData.idBackDocumentPreview || '';

            // Helper to check if URL is a blob URL
            const isBlobUrl = (url) => url && url.startsWith('blob:');

            const renderDocumentCard = (label, preview, url, fileName, onSelect) => {
              // Determine which URL to use: prefer hosted URL, fallback to preview
              const imageUrl = url || preview;
              const isBlob = isBlobUrl(imageUrl);
              
              return (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSelect}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-orange-600"
                    />
                  </label>
                  {fileName && (
                    <p className="text-xs text-gray-500 truncate">
                      Selected file: <span className="font-medium">{fileName}</span>
                    </p>
                  )}
                  {imageUrl ? (
                    <a 
                      href={url || preview} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block group"
                      onClick={(e) => {
                        // Prevent navigation if blob URL is invalid
                        if (isBlob && !imageUrl) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <img
                          src={imageUrl}
                          alt={`${label}`}
                          className="h-40 w-full object-contain bg-gray-100 transition-transform duration-200 group-hover:scale-[1.02]"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            // If blob URL fails, try to revoke it and show placeholder
                            if (isBlobUrl(event.target.src)) {
                              try {
                                URL.revokeObjectURL(event.target.src);
                                blobUrlsRef.current.delete(event.target.src);
                              } catch (e) {
                                // Ignore errors when revoking
                              }
                            }
                            event.currentTarget.src = '/document-placeholder.svg';
                          }}
                        />
                      </div>
                      <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-orange-600 group-hover:text-orange-700">
                        {url ? 'View current document' : 'View upload preview'}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14" />
                        </svg>
                      </span>
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">No document on file.</p>
                  )}
                </div>
              );
            };

            return (
              <>
                {renderDocumentCard(
                  'Front Document',
                  frontPreview,
                  accountData.idFrontDocumentUrl, // Hosted URL from backend
                  accountData.idFrontDocumentFile?.name,
                  (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      // Revoke old blob URL if exists
                      if (accountData.idFrontDocumentPreview && accountData.idFrontDocumentPreview.startsWith('blob:')) {
                        try {
                          URL.revokeObjectURL(accountData.idFrontDocumentPreview);
                          blobUrlsRef.current.delete(accountData.idFrontDocumentPreview);
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                      handleFieldChange({ name: 'idFrontDocumentFile', value: file });
                      const previewUrl = URL.createObjectURL(file);
                      blobUrlsRef.current.add(previewUrl);
                      handleFieldChange({ name: 'idFrontDocumentPreview', value: previewUrl });
                    } else {
                      // Revoke blob URL if exists
                      if (accountData.idFrontDocumentPreview && accountData.idFrontDocumentPreview.startsWith('blob:')) {
                        try {
                          URL.revokeObjectURL(accountData.idFrontDocumentPreview);
                          blobUrlsRef.current.delete(accountData.idFrontDocumentPreview);
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                      handleFieldChange({ name: 'idFrontDocumentFile', value: null });
                      handleFieldChange({ name: 'idFrontDocumentPreview', value: '' });
                    }
                  }
                )}
                {renderDocumentCard(
                  'Back Document',
                  backPreview,
                  accountData.idBackDocumentUrl, // Hosted URL from backend
                  accountData.idBackDocumentFile?.name,
                  (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      // Revoke old blob URL if exists
                      if (accountData.idBackDocumentPreview && accountData.idBackDocumentPreview.startsWith('blob:')) {
                        try {
                          URL.revokeObjectURL(accountData.idBackDocumentPreview);
                          blobUrlsRef.current.delete(accountData.idBackDocumentPreview);
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                      handleFieldChange({ name: 'idBackDocumentFile', value: file });
                      const previewUrl = URL.createObjectURL(file);
                      blobUrlsRef.current.add(previewUrl);
                      handleFieldChange({ name: 'idBackDocumentPreview', value: previewUrl });
                    } else {
                      // Revoke blob URL if exists
                      if (accountData.idBackDocumentPreview && accountData.idBackDocumentPreview.startsWith('blob:')) {
                        try {
                          URL.revokeObjectURL(accountData.idBackDocumentPreview);
                          blobUrlsRef.current.delete(accountData.idBackDocumentPreview);
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                      handleFieldChange({ name: 'idBackDocumentFile', value: null });
                      handleFieldChange({ name: 'idBackDocumentPreview', value: '' });
                    }
                  }
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
