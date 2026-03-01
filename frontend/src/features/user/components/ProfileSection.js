'use client';

import { useState, useEffect, useRef } from 'react';
import { validateField } from '@/features/user/types/accountData';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { MOROCCAN_CITIES } from '@/constants';
import { User, Mail, Phone, Calendar, Camera,  FileText, CheckCircle, AlertCircle, Eye, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProfileSection({ accountData, handleFieldChange, formatProfileCompletion, profileCompletion, onProfilePictureChange }) {
  const t = useTranslations('account');
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

  // Debug: Log profile image data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ ProfileSection - accountData.profileImage:', accountData.profileImage);
      console.log('🖼️ ProfileSection - accountData.profileImageUrl:', accountData.profileImageUrl);
    }
  }, [accountData.profileImage, accountData.profileImageUrl]);

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="pt-8 border-t border-gray-100">
        <h3 className="text-lg font-bold text-white-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            {t('ps_basic_info')}
        </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('ps_first_name')} <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="firstName"
            icon={User}
            value={accountData.firstName || ''}
            disabled
            className="bg-gray-50/50 text-gray-500 border-gray-200 cursor-not-allowed"
            placeholder={t('ps_enter_first_name')}
          />
          <p className="text-xs text-gray-400 pl-1">{t('ps_first_name_locked')}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('ps_last_name')} <span className="text-red-500">*</span>
          </label>
           <Input
            type="text"
            name="lastName"
            icon={User}
            value={accountData.lastName || ''}
            disabled
            className="bg-gray-50/50 text-gray-500 border-gray-200 cursor-not-allowed"
            placeholder={t('ps_enter_last_name')}
          />
          <p className="text-xs text-gray-400 pl-1">{t('ps_last_name_locked')}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <label className="text-sm font-semibold text-gray-700 block">
          {t('ps_email_address')} <span className="text-red-500">*</span>
        </label>
         <Input
          type="email"
          name="email"
          icon={Mail}
          value={accountData.email}
          disabled
          className="bg-gray-50/50 text-gray-500 border-gray-200"
        />
        <p className="text-xs text-gray-400 pl-1">{t('ps_email_locked')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('ps_phone_number')} <span className="text-red-500">*</span>
          </label>
           <Input
            type="tel"
            name="phoneNumber"
            icon={Phone}
            value={accountData.phoneNumber || ''}
            onChange={(e) => handleFieldChangeWithValidation('phoneNumber', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'phoneNumber']))}
            placeholder="+212 6..."
            error={touchedFields.has('phoneNumber') ? fieldErrors['phoneNumber'] : null}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('ps_date_of_birth')} <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            name="dateOfBirth"
            value={accountData.dateOfBirth || ''}
            onChange={(e) => handleFieldChangeWithValidation('dateOfBirth', e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set([...prev, 'dateOfBirth']))}
            max={new Date().toISOString().split('T')[0]}
            error={touchedFields.has('dateOfBirth') ? fieldErrors['dateOfBirth'] : null}
          />
        </div>
      </div>
    </div>
        
        {/* Driver's License Documents */}
      <div className="border-t border-gray-100 pt-8 mt-4">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white-400 mb-2 flex items-center gap-2">
             <FileText className="w-5 h-5 text-orange-500" />
            {t('ps_license_documents')}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t('ps_license_description')}
          </p>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            {(accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" />
                {t('ps_documents_verified')}
              </span>
            )}
          </div>
          
          {/* Show success message if documents exist */}
          {(accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl) && (
            <div className="mb-6 p-4 bg-green-50/50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    {t('ps_documents_uploaded')}
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    {t('ps_documents_saved')}
                  </p>
                  <div className="flex items-center gap-4">
                    {accountData.licenseFrontDocumentUrl && (
                      <a 
                        href={accountData.licenseFrontDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 underline font-medium transition-colors"
                      >
                       <Eye className="w-3.5 h-3.5" />
                        {t('ps_view_front')}
                      </a>
                    )}
                    {accountData.licenseBackDocumentUrl && (
                      <a 
                        href={accountData.licenseBackDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 underline font-medium transition-colors"
                      >
                         <Eye className="w-3.5 h-3.5" />
                        {t('ps_view_back')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {accountData.licenseFrontDocumentUrl && accountData.licenseBackDocumentUrl && (
          <p className="text-sm text-gray-600 mb-4 font-medium pl-1">
              {t('ps_update_documents')}
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
                  <div className="group rounded-xl border border-orange-500 bg-orange-500/30 p-4 space-y-4 transition-all duration-200 hover:shadow-md hover:border-orange-200">
                    <p className="text-sm font-semibold text-white-300 flex items-center gap-2">
                        {label}
                        {imageUrl && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                    </p>
                    <label className="block w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onSelect}
                         className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-orange-50 file:text-orange-700
                        hover:file:bg-orange-100
                        cursor-pointer file:cursor-pointer
                        transition-all"
                      />
                    </label>
                    {fileName && (
                      <p className="text-xs text-gray-500 truncate bg-orange-600/40 px-2 py-1 rounded border border-gray-100">
                        {t('ps_selected', { name: fileName })}
                      </p>
                    )}
                    {imageUrl ? (
                      <a 
                        href={url || preview} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block group/image relative"
                        onClick={(e) => {
                          if (isBlob && !imageUrl) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white aspect-video relative">
                          <img
                            src={imageUrl}
                            alt={`${label}`}
                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/image:scale-105"
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
                           <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors rounded-lg" />
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video rounded-lg border-2 border-dashed border-orange-500 bg-orange-500/40 flex flex-col items-center justify-center text-gray-400 gap-2">
                         <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Camera className="w-5 h-5 opacity-40" />
                        </div>
                        <span className="text-xs font-medium">{t('ps_no_document')}</span>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {renderDocumentCard(
                    t('ps_license_front'),
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
                    t('ps_license_back'),
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
