'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';

export const useAccount = () => {
  const { user } = useAuth();
  
  const [accountData, setAccountData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '',
    dateOfBirth: user?.date_of_birth || '',
    placeOfBirth: user?.place_of_birth || '',
    profileImage: user?.profile_picture || '/default-avatar.svg',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    postalCode: user?.postal_code || '',
    licenseNumber: user?.license_number || '',
    licenseCountry: user?.license_country || '',
    licenseIssueDate: user?.license_issue_date || '',
    licenseExpiryDate: user?.license_expiry_date || ''
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [emailVerified, setEmailVerified] = useState(!!(user?.is_verified || user?.email_verified));

  // Load user data from backend
  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await authService.getCurrentUser();
      // Unwrap ApiResponse - the actual data is in response.data
      const userData = response?.data || response;
      
      setAccountData(prev => ({
        ...prev,
        firstName: userData.first_name || prev.firstName,
        lastName: userData.last_name || prev.lastName,
        email: userData.email || prev.email,
        phoneNumber: userData.phone_number || prev.phoneNumber,
        dateOfBirth: userData.date_of_birth || prev.dateOfBirth,
        placeOfBirth: userData.nationality || prev.placeOfBirth,
        address: userData.address || prev.address,
        city: userData.city || prev.city,
        country: userData.country_of_residence || prev.country,
        postalCode: userData.postal_code || prev.postalCode,
        licenseNumber: userData.license_number || prev.licenseNumber,
        licenseCountry: userData.license_origin_country || prev.licenseCountry,
        licenseIssueDate: userData.issue_date || prev.licenseIssueDate,
        profileImage: userData.profile_picture || prev.profileImage || '/default-avatar.svg'
      }));
      setEmailVerified(!!(userData?.email_verified || userData?.is_verified));
    } catch (error) {
      // Silently handle backend errors - user can still use the form with cached data
      if (error.message?.includes('Failed to fetch')) {
        console.log('Backend is not available, using cached user data');
      } else {
        console.warn('Could not load user data from backend:', error.message);
      }
    }
  }, [user]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback(() => {
    const fields = [
      accountData.firstName,
      accountData.lastName,
      accountData.dateOfBirth,
      accountData.phoneNumber,
      accountData.address,
      accountData.city,
      accountData.country,
      accountData.licenseNumber,
      accountData.licenseCountry,
      accountData.licenseIssueDate
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  }, [accountData]);

  // Update account data
  const updateAccountData = useCallback((updates) => {
    setAccountData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle field changes
  const handleFieldChange = useCallback((name, value) => {
    setAccountData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Refresh verification status
  const refreshVerificationStatus = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      // Unwrap ApiResponse - the actual data is in response.data
      const userData = response?.data || response;
      setEmailVerified(!!(userData?.email_verified || userData?.is_verified));
    } catch (error) {
      // Silently handle backend errors
      if (error.message?.includes('Failed to fetch')) {
        console.log('Backend is not available for verification check');
      } else {
        console.warn('Could not refresh verification status:', error.message);
      }
    }
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  return {
    accountData,
    setAccountData,
    saving,
    setSaving,
    saveMessage,
    setSaveMessage,
    emailVerified,
    calculateProfileCompletion,
    updateAccountData,
    handleFieldChange,
    refreshVerificationStatus,
    loadUserData
  };
};
