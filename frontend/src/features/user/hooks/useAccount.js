'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';
import {
  DEFAULT_ACCOUNT_DATA,
  mapBackendToFrontend,
  calculateProfileCompletion as calcCompletion,
  validateAccountData
} from '@/features/user/types/accountData';

export const useAccount = () => {
  const { user } = useAuth();
  
  // Initialize with default values, then merge with user data
  const initialData = useMemo(() => {
    if (!user) return DEFAULT_ACCOUNT_DATA;
    return mapBackendToFrontend(user);
  }, [user]);
  
  const [accountData, setAccountData] = useState(initialData);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [emailVerified, setEmailVerified] = useState(!!(user?.is_verified || user?.email_verified));

  // Load user data from backend
  const loadUserData = useCallback(async () => {
    if (!user) {
      console.log('⚠️ loadUserData: No user found');
      return;
    }

    try {
      console.log('🔄 Loading user data from backend...');
      const response = await authService.getCurrentUser();
      console.log('📥 Raw response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', Object.keys(response || {}));
      
      // Handle different response structures
      let userData = null;
      
      // Check if response has a data property
      if (response && typeof response === 'object') {
        if ('data' in response) {
          // Response is { data: { data: {...} } } or { data: {...} }
          const innerData = response.data;
          if (innerData && typeof innerData === 'object' && 'data' in innerData) {
            // Double nested: { data: { data: {...} } }
            userData = innerData.data;
          } else {
            // Single nested: { data: {...} }
            userData = innerData;
          }
        } else {
          // Response is the data directly
          userData = response;
        }
      }
      
      console.log('📦 Extracted userData:', userData);
      console.log('📦 userData type:', typeof userData);
      console.log('📦 userData keys:', userData ? Object.keys(userData) : 'null');
      // Debug: Check profile picture fields
      if (userData) {
        console.log('🖼️ profile_picture_url:', userData.profile_picture_url);
        console.log('🖼️ profile_picture_base64:', userData.profile_picture_base64);
        console.log('🖼️ profile_picture_url type:', typeof userData.profile_picture_url);
        if (userData.profile_picture_url) {
          console.log('🖼️ profile_picture_url starts with data:image/:', userData.profile_picture_url.startsWith('data:image/'));
        }
      }
      
      if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
        console.error('❌ No user data received from backend or data is empty');
        return;
      }
      
      // Map backend data to frontend format
      const mappedData = mapBackendToFrontend(userData);
      console.log('🔄 Mapped data:', mappedData);
      
      // Preserve file uploads and previews
      setAccountData(prev => {
        const newData = {
          ...mappedData,
          idFrontDocumentFile: prev.idFrontDocumentFile,
          idBackDocumentFile: prev.idBackDocumentFile,
          idFrontDocumentPreview: prev.idFrontDocumentPreview,
          idBackDocumentPreview: prev.idBackDocumentPreview
        };
        console.log('✅ Updated accountData:', newData);
        return newData;
      });
      
      setEmailVerified(!!(userData?.email_verified || userData?.is_verified));
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // Show error to user instead of silently failing
      if (error.message?.includes('Failed to fetch')) {
        console.error('🔴 Backend is not available');
      } else {
        console.error('🔴 Could not load user data from backend:', error.message);
      }
    }
  }, [user]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback(() => {
    return calcCompletion(accountData);
  }, [accountData]);

  // Validate account data
  const validateData = useCallback(() => {
    return validateAccountData(accountData);
  }, [accountData]);

  // Update account data
  const updateAccountData = useCallback((updates) => {
    setAccountData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle field changes
  const handleFieldChange = useCallback((arg1, arg2) => {
    if (typeof arg1 === 'string') {
      setAccountData(prev => ({ ...prev, [arg1]: arg2 }));
      return;
    }

    if (arg1 && typeof arg1 === 'object') {
      if ('target' in arg1 && arg1.target) {
        const { name, value, files } = arg1.target;
        if (!name) return;
        if (files && files.length) {
          setAccountData(prev => ({ ...prev, [name]: files[0] }));
        } else {
          setAccountData(prev => ({ ...prev, [name]: value }));
        }
        return;
      }

      if ('name' in arg1) {
        setAccountData(prev => ({ ...prev, [arg1.name]: arg1.value }));
      }
    }
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
    console.log('🔄 useAccount useEffect triggered', { user: user?.username, hasUser: !!user });
    if (user) {
      console.log('✅ User found, loading data...');
      loadUserData();
    } else {
      console.log('⚠️ No user found, skipping data load');
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
    validateData,
    updateAccountData,
    handleFieldChange,
    refreshVerificationStatus,
    loadUserData
  };
};
