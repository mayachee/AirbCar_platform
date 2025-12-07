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

  // Debug: Log profile image data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ ProfileSection - accountData.profileImage:', accountData.profileImage);
      console.log('🖼️ ProfileSection - accountData.profileImageUrl:', accountData.profileImageUrl);
    }
  }, [accountData.profileImage, accountData.profileImageUrl]);

  return (
    <div className="space-y-8">
      {/* Profile Picture Upload */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <img
              src={accountData.profileImage || accountData.profileImageUrl || '/default-avatar.svg'}
              alt="Profile"
              className="h-32 w-32 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                console.warn('⚠️ Profile image failed to load, using default');
                if (e.target.src !== '/default-avatar.svg') {
                  e.target.src = '/default-avatar.svg';
                }
              }}
              onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ Profile image loaded successfully');
                }
              }}
            />
          </div>
          <div className="text-center sm:text-left flex-1">
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

      {/* Basic Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
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
        </div>
        
        {/* Driver's License Documents */}
      <div className="border-t-2 border-gray-300 pt-8 mt-8 bg-white rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Driver's License Documents
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Upload both sides of your driver's license for verification purposes. These documents are required to complete your profile and enable bookings.
          </p>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            {(accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete
              </span>
            )}
          </div>
          
          {/* Show success message if documents exist */}
          {(accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl) && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    ✓ Driver's License Documents Saved
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    Both front and back documents are saved in your profile and will be used for bookings.
                  </p>
                  <div className="flex items-center gap-4">
                    {accountData.licenseFrontDocumentUrl && (
                      <a 
                        href={accountData.licenseFrontDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Front
                      </a>
                    )}
                    {accountData.licenseBackDocumentUrl && (
                      <a 
                        href={accountData.licenseBackDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 underline font-medium"
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
          
          {accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl && (
          <p className="text-sm text-gray-600 mb-4">
              You can replace your documents below if needed.
          </p>
          )}
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
    </div>
  );
}
