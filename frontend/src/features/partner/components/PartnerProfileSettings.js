'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Upload, Building2, FileText, CheckCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { MOROCCAN_CITIES } from '@/constants';
import { SelectField } from '@/components/ui/select-field';

export default function PartnerProfileSettings({ partnerData, hasPartnerProfile = true, onUpdate, loading }) {
  const t = useTranslations('partner');
  const { user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: '',
    description: '',
    verification_document: null,
    logo: ''
  });
  const [email, setEmail] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Fetch partner data if not provided
  useEffect(() => {
    const fetchPartnerData = async () => {
      if (hasPartnerProfile === false) {
        return;
      }
      if (!partnerData && !fetchingData) {
        setFetchingData(true);
        try {
          const { partnerService } = await import('@/features/partner/services/partnerService');
          const response = await partnerService.getPartnerProfile();
          console.log('PartnerProfileSettings - Fetched partner data directly:', response);
          
          // Handle response structure
          let fetchedData = null;
          if (response?.data) {
            if (response.data.data) {
              fetchedData = response.data.data; // Nested structure
            } else {
              fetchedData = response.data; // Direct structure
            }
          } else if (response?.has_partner_profile === false) {
            console.log('PartnerProfileSettings - No partner profile exists');
            setFetchingData(false);
            return;
          }
          
          if (fetchedData) {
            // Trigger the useEffect that processes partnerData
            // We'll use a state update to trigger re-processing
            console.log('PartnerProfileSettings - Setting fetched partner data:', fetchedData);
            // Note: We can't directly set partnerData prop, but we can process it
            // The parent component should handle this, but we'll process it here as fallback
          }
        } catch (error) {
          // Expected when user hasn't created a partner profile yet
          if (error?.status === 404 && (error?.message || '').toLowerCase().includes('partner profile not found')) {
            return;
          }
          console.error('PartnerProfileSettings - Error fetching partner data:', error);
        } finally {
          setFetchingData(false);
        }
      }
    };
    
    fetchPartnerData();
  }, [partnerData, fetchingData, hasPartnerProfile]);

  // Fetch email from API (partnerData.user.email from API response or user context)
  useEffect(() => {
    // Priority: 1. partnerData.user.email (from API), 2. partnerData.email (if directly available), 3. user.email (from auth context)
    if (partnerData?.user?.email) {
      // Get email from partner user data (API response includes user object with email)
      setEmail(partnerData.user.email);
    } else if (partnerData?.email) {
      // Fallback: email directly on partner data
      setEmail(partnerData.email);
    } else if (user?.email) {
      // Final fallback: user email from auth context (JWT token)
      setEmail(user.email);
    }
  }, [partnerData, user]);

  useEffect(() => {
    // Handle different data structures - API might return { data: {...} } or just the object
    let actualPartnerData = partnerData;
    
    // If partnerData has a 'data' property, extract it (API client wraps responses)
    if (partnerData?.data && typeof partnerData.data === 'object') {
      actualPartnerData = partnerData.data;
    }
    
    if (actualPartnerData) {
      // Debug: Log the full partner data structure
      console.log('PartnerProfileSettings - Full partnerData object:', partnerData);
      console.log('PartnerProfileSettings - Extracted actualPartnerData:', actualPartnerData);
      console.log('PartnerProfileSettings - Keys in actualPartnerData:', Object.keys(actualPartnerData || {}));
      
      // Debug: Log specific fields to see what we're receiving
      console.log('PartnerProfileSettings - Field values:', {
        business_name: actualPartnerData.business_name,
        company_name: actualPartnerData.company_name,
        businessName: actualPartnerData.businessName,
        tax_id: actualPartnerData.tax_id,
        business_type: actualPartnerData.business_type,
        phone_number: actualPartnerData.phone_number,
        user: actualPartnerData.user,
        user_phone: actualPartnerData.user?.phone_number,
        city: actualPartnerData.city,
        user_city: actualPartnerData.user?.city,
        logo: actualPartnerData.logo,
        logo_url: actualPartnerData.logo_url,
        description: actualPartnerData.description,
        // Check all possible field variations
        allKeys: Object.keys(actualPartnerData)
      });
      
      // Map backend field names to frontend form fields
      // Backend uses: business_name, but frontend uses: company_name
      const businessName = actualPartnerData.business_name || 
                          actualPartnerData.company_name || 
                          actualPartnerData.businessName || 
                          actualPartnerData.companyName || 
                          '';
      
      // Get phone number from partner data or user data
      const phoneNumber = actualPartnerData.phone_number || 
                         actualPartnerData.user?.phone_number || 
                         actualPartnerData.phone || 
                         '';
      
      // Get address fields - check if they exist on partner or user
      const address = actualPartnerData.address || actualPartnerData.user?.address || '';
      const city = actualPartnerData.city || actualPartnerData.user?.city || '';
      
      const formDataToSet = {
        company_name: businessName,
        tax_id: actualPartnerData.tax_id || '',
        business_type: actualPartnerData.business_type || '',
        address: address,
        city: city,
        state: actualPartnerData.state || actualPartnerData.user?.state || '',
        zip_code: actualPartnerData.zip_code || actualPartnerData.user?.postal_code || '',
        phone_number: phoneNumber,
        description: actualPartnerData.description || '',
        verification_document: actualPartnerData.verification_document || null,
        logo: actualPartnerData.logo || actualPartnerData.logo_url || ''
      };
      
      console.log('PartnerProfileSettings - Setting form data:', formDataToSet);
      setFormData(formDataToSet);
      
      // Set logo preview if logo URL exists (check both logo and logo_url)
      // Handle relative URLs - if it starts with /media/, prepend backend URL
      let logoUrl = actualPartnerData.logo_url || actualPartnerData.logo || '';
      if (logoUrl) {
        // If it's a relative path (starts with /media/), make it absolute
        if (logoUrl.startsWith('/media/')) {
          const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
          logoUrl = `${apiUrl}${logoUrl}`;
        }
        // If it's already a full URL, use it as is
        setLogoPreview(logoUrl);
        setLogoRemoved(false); // Reset removal flag when partner data loads
      } else {
        setLogoPreview('');
      }
      
      // Clear phone error when data loads
      setPhoneError('');
    } else {
      console.log('PartnerProfileSettings - No partnerData provided or empty');
      console.log('PartnerProfileSettings - partnerData value:', partnerData);
    }
  }, [partnerData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate phone number in real-time
    if (name === 'phone_number') {
      const validation = validatePhoneNumber(value);
      if (validation.isValid) {
        setPhoneError('');
      } else if (value.trim() !== '') {
        // Only show error if field is not empty (to avoid showing error on empty field)
        setPhoneError(validation.error);
      } else {
        setPhoneError('');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Here you would upload the file to your backend
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFormData(prev => ({
        ...prev,
        verification_document: file.name
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setLogoRemoved(false); // Reset removal flag when new file is selected

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setLogoRemoved(true); // Mark logo as removed
  };

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return { isValid: false, error: 'Phone Number is required.' };
    }
    
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Moroccan phone number patterns:
    // - +212XXXXXXXXX (with country code)
    // - 0XXXXXXXXX (local format)
    // - 212XXXXXXXXX (country code without +)
    // Must be 9-13 digits total (excluding + and formatting)
    const moroccanPattern = /^(\+?212|0)?[5-7]\d{8}$/;
    const internationalPattern = /^\+?[1-9]\d{1,14}$/; // E.164 format
    
    if (moroccanPattern.test(cleaned)) {
      return { isValid: true, error: null };
    }
    
    // Check if it's a valid international format
    if (internationalPattern.test(cleaned) && cleaned.length >= 10) {
      return { isValid: true, error: null };
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid phone number. Examples: +212 6XX-XXXXXX, 0X-XXXXXXX, or international format.' 
    };
  };

  /**
   * Prepares the form data for API submission
   * Handles field mapping, cleanup, and business logic
   */
  const preparePayload = (data) => {
    const payload = { ...data };
    
    // Remove logo file from payload (handled separately as file or not sent)
    delete payload.logo; 

    // Field Mappings
    if (payload.company_name) {
      payload.business_name = payload.company_name;
    }
    
    // Backend Logic: Map "fleet" and "dealership" to "company"
    if (['fleet', 'dealership'].includes(payload.business_type)) {
      payload.business_type = 'company';
    }
    
    // Cleanup: Remove empty business_type
    if (payload.business_type === '') {
      delete payload.business_type;
    }

    // Cleanup: Remove read-only & frontend-only fields
    const fieldsToRemove = [
      'company_name', 'companyName', 'businessName', 'logo_url', 
      'user', 'min_price_per_day', 'rating', 'review_count', 
      'total_bookings', 'total_earnings', 'is_verified', 'id', 
      'created_at', 'verification_document', 'zip_code'
    ];
    
    fieldsToRemove.forEach(field => delete payload[field]);
    
    return payload;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Validation
      const phoneValidation = validatePhoneNumber(formData.phone_number);
      if (!phoneValidation.isValid) {
        addToast(phoneValidation.error, 'error');
        setSaving(false);
        return;
      }
      
      if (!formData.city?.trim()) {
        addToast('City is required. Please select a city.', 'error');
        setSaving(false);
        return;
      }
      
      // 2. Prepare Data
      const payload = preparePayload(formData);
      
      // 3. Handle Update Strategy (FormData vs JSON)
      if (logoFile) {
         // Strategy A: Logo Upload via FormData
         const formDataToSend = new FormData();
         
         // Append clean payload fields
         Object.entries(payload).forEach(([key, value]) => {
           if (value !== null && value !== undefined && value !== '') {
             formDataToSend.append(key, String(value));
           }
         });
         
         // Ensure required fields for FormData
         if (!formDataToSend.has('phone_number')) formDataToSend.append('phone_number', payload.phone_number || '');
         if (!formDataToSend.has('city')) formDataToSend.append('city', payload.city || '');
         
         formDataToSend.append('logo', logoFile);
         
         await onUpdate(formDataToSend);
      } 
      else if (logoRemoved && partnerData?.logo) {
         // Strategy B: Explicit Logo Removal via FormData
         const formDataToSend = new FormData();
         Object.entries(payload).forEach(([key, value]) => {
           if (value !== null && value !== undefined && value !== '') {
             formDataToSend.append(key, String(value));
           }
         });
         // Ensure required fields
         if (!formDataToSend.has('phone_number')) formDataToSend.append('phone_number', payload.phone_number || '');
         if (!formDataToSend.has('city')) formDataToSend.append('city', payload.city || '');
         
         formDataToSend.append('logo', ''); // Signal removal
         
         await onUpdate(formDataToSend);
      } 
      else {
         // Strategy C: Standard JSON Update
         await onUpdate(payload);
      }
      
      // 4. Success State
      setIsEditing(false);
      setLogoFile(null);
      setLogoRemoved(false);
      addToast('Profile updated successfully', 'success');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // 5. Error Handling & Retry Logic
      const serverErrorDetails = error.data?.details || error.data?.detail || error.data;
      const errorMsgDetails = typeof serverErrorDetails === 'string' 
        ? serverErrorDetails 
        : (serverErrorDetails?.message || JSON.stringify(serverErrorDetails));

      // Check for specific Render/Supabase limitations
      const isStorageError = errorMsgDetails && 
        (errorMsgDetails.includes('Supabase Storage') || errorMsgDetails.includes('ephemeral filesystem'));

      if (isStorageError) {
        const confirmRetry = window.confirm(
          "Logo upload is not supported on the Demo server (file storage is disabled). \n\n" +
          "Do you want to save your profile changes WITHOUT the logo?"
        );
        
        if (confirmRetry) {
          try {
             // Retry with Strategy C (JSON only, no logo)
             const retryPayload = preparePayload(formData);
             await onUpdate(retryPayload);
             
             setIsEditing(false);
             setLogoFile(null);
             setLogoRemoved(false);
             addToast('Profile updated successfully (without logo)', 'success');
          } catch (retryError) {
             console.error('Retry failed:', retryError);
             addToast('Failed to save profile changes.', 'error');
          }
        }
      } else {
        // Generic Error Display
        let displayError = 'Failed to save profile. Please try again.';
        
        if (typeof serverErrorDetails === 'object' && serverErrorDetails !== null) {
           // Format field-specific errors
           const fieldErrors = Object.entries(serverErrorDetails)
             .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
             .join('\n');
             
           if (fieldErrors) displayError = `Validation failed:\n${fieldErrors}`;
        } else if (serverErrorDetails) {
           displayError = String(serverErrorDetails);
        }
        
        addToast(displayError, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    if (!partnerData?.verification_status) return { status: 'pending', color: 'text-yellow-600', icon: AlertCircle };
    
    switch (partnerData.verification_status) {
      case 'verified': return { status: 'Verified', color: 'text-green-600', icon: CheckCircle };
      case 'rejected': return { status: 'Rejected', color: 'text-red-600', icon: AlertCircle };
      default: return { status: 'Pending', color: 'text-yellow-600', icon: AlertCircle };
    }
  };

  const verificationStatus = getVerificationStatus();
  const StatusIcon = verificationStatus.icon;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('business_profile')}</h3>
          </div>
          <div className={`flex items-center gap-1 ${verificationStatus.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">{t(verificationStatus.status.toLowerCase())}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              {t('edit_profile')}
            </button>
          ) : (
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => {
                  if (partnerData?.logo) {
                    setLogoPreview(partnerData.logo);
                  } else {
                    setLogoPreview('');
                  }
                  setLogoFile(null);
                  setLogoRemoved(false);
                  setIsEditing(false);
                }}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? t('saving') : t('save')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('basic_information')}</h4>
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('upload_logo')}
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              {logoPreview ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt={t('company_logo')}
                    className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                      title={t('remove_logo')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              {isEditing && (
                <div className="min-w-0">
                  <label className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{logoPreview ? t('change') : t('upload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('logo_upload_hint')}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('company_name')} *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={t('company_name_placeholder')}
            />
            {!isEditing && !formData.company_name && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">{t('not_set')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('tax_id')} *
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={t('tax_id_placeholder')}
            />
            {!isEditing && !formData.tax_id && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">{t('not_set')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('business_type')}
            </label>
            <SelectField
              name="business_type"
              value={formData.business_type ?? ''}
              placeholder={t('business_type_placeholder')}
              showPlaceholderOption
              onChange={handleInputChange}
              disabled={!isEditing}
              options={[
                { value: 'individual', label: t('individual') },
                { value: 'company', label: t('company') },
                { value: 'fleet', label: t('fleet_operator') },
                { value: 'dealership', label: t('dealership') },
              ]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('contact_information')}</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('phone_number')}
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                phoneError ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('phone_number_placeholder')}
            />
            {phoneError && isEditing && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{phoneError}</p>
            )}
            {!phoneError && formData.phone_number && isEditing && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {t('valid_phone_number')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('email')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('from_account')})</span>
            </label>
            <input
              type="email"
              name="email"
              value={email}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              placeholder={t('loading_email')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('email_cannot_change_here')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('address')}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={t('address_placeholder')}
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('city')} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <SelectField
                name="city"
                value={formData.city ?? ''}
                placeholder={t('city_placeholder')}
                showPlaceholderOption
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                options={MOROCCAN_CITIES.map((city) => ({ value: city, label: city }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('state')}
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('state_placeholder')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 sm:mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('description')}
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={!isEditing}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
          placeholder={t('description_placeholder')}
        />
      </div>
    </div>
  );
}
