'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, Building2, FileText, CheckCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MOROCCAN_CITIES } from '@/constants';

export default function PartnerProfileSettings({ partnerData, hasPartnerProfile = true, onUpdate, loading }) {
  const { user } = useAuth();
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate phone number format
      const phoneValidation = validatePhoneNumber(formData.phone_number);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.error);
        setSaving(false);
        return;
      }
      
      // Validate required fields
      if (!formData.city || formData.city.trim() === '') {
        alert('City is required. Please select a city.');
        setSaving(false);
        return;
      }
      
      // Prepare form data
      const dataToSave = { ...formData };
      delete dataToSave.logo; // Remove logo from dataToSave, handle separately
      
      // Ensure phone_number and city are included (already validated above)
      // Backend will also validate these fields are not empty
      
      // If logo file is uploaded, use FormData for multipart upload
      if (logoFile) {
        const formDataToSend = new FormData();
        
        // Append all form fields as strings
        // Always include phone_number and city (required fields)
        Object.keys(dataToSave).forEach(key => {
          const value = dataToSave[key];
          // Always include required fields (phone_number, city) even if empty
          if (key === 'phone_number' || key === 'city') {
            formDataToSend.append(key, value || '');
          } else if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, String(value));
          }
        });
        
        // Ensure phone_number and city are always present
        if (!dataToSave.phone_number) {
          formDataToSend.append('phone_number', '');
        }
        if (!dataToSave.city) {
          formDataToSend.append('city', '');
        }
        
        // Append logo file
        formDataToSend.append('logo', logoFile);
        
        // Call onUpdate with FormData (backend will handle multipart)
        await onUpdate(formDataToSend);
      } else {
        // No logo file - send regular JSON data
        // If logo was explicitly removed, we need to send it via FormData with empty string
        // because the serializer ignores read-only fields, but perform_update checks request.data
        if (logoRemoved && partnerData?.logo) {
          // Send as FormData with empty logo to signal removal
          const formDataToSend = new FormData();
          Object.keys(dataToSave).forEach(key => {
            const value = dataToSave[key];
            // Always include required fields (phone_number, city) even if empty
            if (key === 'phone_number' || key === 'city') {
              formDataToSend.append(key, value || '');
            } else if (value !== null && value !== undefined && value !== '') {
              formDataToSend.append(key, String(value));
            }
          });
          // Ensure phone_number and city are always present
          if (!dataToSave.phone_number) {
            formDataToSend.append('phone_number', '');
          }
          if (!dataToSave.city) {
            formDataToSend.append('city', '');
          }
          formDataToSend.append('logo', ''); // Empty string signals removal
          await onUpdate(formDataToSend);
        } else {
          // Send JSON data - phone_number and city are already validated and included
          await onUpdate(dataToSave);
        }
      }
      
      setIsEditing(false);
      setLogoFile(null); // Clear file after successful save
      setLogoRemoved(false); // Reset removal flag
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business Profile</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${verificationStatus.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{verificationStatus.status}</span>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Reset logo preview and file when canceling
                  if (partnerData?.logo) {
                    setLogoPreview(partnerData.logo);
                  } else {
                    setLogoPreview('');
                  }
                  setLogoFile(null);
                  setLogoRemoved(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Basic Information</h4>
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              {isEditing && (
                <div>
                  <label className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={formData.company_name ? formData.company_name : "Enter company name"}
            />
            {!isEditing && !formData.company_name && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">Not set</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tax ID / License Number *
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={formData.tax_id ? formData.tax_id : "Enter tax ID or license number"}
            />
            {!isEditing && !formData.tax_id && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">Not set</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business Type
            </label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select business type</option>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="fleet">Fleet Operator</option>
              <option value="dealership">Dealership</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Contact Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-red-500 dark:text-red-400">*</span>
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
              placeholder="+212 6XX-XXXXXX or 0X-XXXXXXX"
            />
            {phoneError && isEditing && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{phoneError}</p>
            )}
            {!phoneError && formData.phone_number && isEditing && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Valid phone number</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-xs text-gray-500 dark:text-gray-400">(from account)</span>
            </label>
            <input
              type="email"
              name="email"
              value={email}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              placeholder="Loading email..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed here. Contact support to update your email address.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter business address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a city</option>
                {MOROCCAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="State"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Business Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={!isEditing}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Describe your business and services..."
        />
      </div>
    </div>
  );
}
