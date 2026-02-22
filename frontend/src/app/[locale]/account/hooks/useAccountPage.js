'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useAccount, useFavorites, useBookings, useUserStats } from '@/features/user';
import { mapFrontendToBackend, mapBackendToFrontend, validateAccountData } from '@/features/user/types/accountData';

export const useAccountPage = () => {
  const router = useRouter();
  
  const {
    accountData,
    saving,
    saveMessage,
    emailVerified,
    calculateProfileCompletion,
    validateData,
    updateAccountData,
    handleFieldChange,
    refreshVerificationStatus,
    setSaving,
    setSaveMessage
  } = useAccount();

  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const { bookings, loading: bookingsLoading, upcomingBookings, pastBookings } = useBookings();
  const { stats } = useUserStats();

  const [activeTab, setActiveTab] = useState('profile');
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('accountForm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        updateAccountData(parsed);
        setHasLocalDraft(true);
      } catch (_) {}
    }
  }, [updateAccountData]);

  // Auto-save form to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const {
        idFrontDocumentFile,
        idBackDocumentFile,
        ...rest
      } = accountData;
      localStorage.setItem('accountForm', JSON.stringify(rest));
    } catch (_) {}
  }, [accountData]);

  // Handle form field changes
  const handleAccountFieldChange = (input, valueArg) => {
    let name;
    let value;

    if (input && typeof input === 'object' && 'target' in input) {
      name = input.target?.name;
      if (input.target?.files && input.target.files.length > 0) {
        value = input.target.files[0];
      } else {
        value = input.target?.value;
      }
    } else if (input && typeof input === 'object' && 'name' in input) {
      name = input.name;
      value = 'value' in input ? input.value : valueArg;
    } else {
      name = input;
      value = valueArg;
    }

    if (name === undefined || name === null) return;
    handleFieldChange(name, value);
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      // Validate data before saving
      const validation = validateData();
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        setSaveMessage(`Validation error: ${firstError}`);
        setSaving(false);
        return;
      }

      // Map frontend camelCase to backend snake_case
      const profileData = mapFrontendToBackend(accountData);

      const hasDocumentUploads = Boolean(
        accountData.idFrontDocumentFile || 
        accountData.idBackDocumentFile ||
        accountData.licenseFrontDocumentFile ||
        accountData.licenseBackDocumentFile
      );

      let response;
      if (hasDocumentUploads) {
        const formData = new FormData();
        Object.entries(profileData).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            formData.append(key, String(val));
          }
        });

        if (accountData.idFrontDocumentFile) {
          formData.append('id_front_document', accountData.idFrontDocumentFile);
        }
        if (accountData.idBackDocumentFile) {
          formData.append('id_back_document', accountData.idBackDocumentFile);
        }
        if (accountData.licenseFrontDocumentFile) {
          formData.append('license_front_document', accountData.licenseFrontDocumentFile);
        }
        if (accountData.licenseBackDocumentFile) {
          formData.append('license_back_document', accountData.licenseBackDocumentFile);
        }

        response = await authService.updateProfile(formData, 'PUT');
      } else {
        response = await authService.updateProfile(profileData, 'PUT');
      }
      // Unwrap ApiResponse - the actual data is in response.data
      const updatedUserData = response?.data || response;

      setSaveMessage('Profile updated successfully!');
      localStorage.removeItem('accountForm');
      setHasLocalDraft(false);
      
      // Refresh user data from backend to get updated URLs
      const userResponse = await authService.getCurrentUser();
      const updatedData = userResponse?.data || userResponse;
      
      // Map backend response to frontend format
      const mappedData = mapBackendToFrontend(updatedData);

      // Filter out empty values from mappedData so we don't overwrite
      // existing frontend state with empty strings coming from backend.
      const cleanedMappedData = Object.fromEntries(
        Object.entries(mappedData || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      // IMPORTANT: Preserve existing data and merge with new data
      // Only overlay fields that have meaningful values in the backend response
      updateAccountData({
        ...accountData,  // Keep existing data first
        ...cleanedMappedData,   // Then overlay with new/updated (non-empty) fields
        // Always preserve file uploads and previews
        idFrontDocumentFile: accountData.idFrontDocumentFile,
        idBackDocumentFile: accountData.idBackDocumentFile,
        idFrontDocumentPreview: accountData.idFrontDocumentPreview,
        idBackDocumentPreview: accountData.idBackDocumentPreview,
        licenseFrontDocumentFile: accountData.licenseFrontDocumentFile,
        licenseBackDocumentFile: accountData.licenseBackDocumentFile,
        licenseFrontDocumentPreview: accountData.licenseFrontDocumentPreview,
        licenseBackDocumentPreview: accountData.licenseBackDocumentPreview
      });

      if (accountData.idFrontDocumentPreview) {
        URL.revokeObjectURL(accountData.idFrontDocumentPreview);
      }
      if (accountData.idBackDocumentPreview) {
        URL.revokeObjectURL(accountData.idBackDocumentPreview);
      }
      if (accountData.licenseFrontDocumentPreview) {
        URL.revokeObjectURL(accountData.licenseFrontDocumentPreview);
      }
      if (accountData.licenseBackDocumentPreview) {
        URL.revokeObjectURL(accountData.licenseBackDocumentPreview);
      }
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      // Try to get specific error message from backend response
      const backendError = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || (error.response?.data && typeof error.response.data === 'string' ? error.response.data : null);

      if (backendError) {
        // Use the specific backend error message
        errorMessage = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
      } else if (error.message) {
        if (error.message.includes('400')) {
          errorMessage = 'Invalid profile data. Please check all required fields are filled correctly.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Could not connect to server. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSaveMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    try {
      console.log('📤 Uploading profile picture...');
      const response = await authService.uploadProfilePicture(file);
      console.log('📥 Upload response:', response);
      
      // Unwrap ApiResponse - the actual data is in response.data
      const updatedUserData = response?.data || response;
      console.log('📦 Updated user data from upload:', updatedUserData);
      
      // Also refresh full user data to sync everything
      const userResponse = await authService.getCurrentUser();
      console.log('📥 Fresh user data from backend:', userResponse);
      const updatedData = userResponse?.data || userResponse;
      
      // Map backend response to frontend format (this handles URL filtering properly)
      const mappedData = mapBackendToFrontend(updatedData);
      console.log('🔄 Mapped profile data:', mappedData);

      const cleanedMapped = Object.fromEntries(
        Object.entries(mappedData || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      updateAccountData({
        ...cleanedMapped,
        idFrontDocumentFile: accountData.idFrontDocumentFile,
        idBackDocumentFile: accountData.idBackDocumentFile,
        idFrontDocumentPreview: accountData.idFrontDocumentPreview,
        idBackDocumentPreview: accountData.idBackDocumentPreview,
        licenseFrontDocumentFile: accountData.licenseFrontDocumentFile,
        licenseBackDocumentFile: accountData.licenseBackDocumentFile,
        licenseFrontDocumentPreview: accountData.licenseFrontDocumentPreview,
        licenseBackDocumentPreview: accountData.licenseBackDocumentPreview
      });
      
      console.log('✅ Profile picture uploaded successfully');
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      throw error;
    }
  };

  // Handler for favorites
  const handleRemoveFavorite = async (favorite) => {
    if (!confirm('Are you sure you want to remove this car from your favorites?')) {
      return;
    }
    // Use favorite.id (the Favorite entry ID) if available, otherwise fall back to listing/vehicle ID
    // The backend expects the Favorite entry ID for DELETE /favorites/<id>/
    const favoriteId = favorite.id; // This is the Favorite entry ID from the database
    const vehicleId = favorite.vehicle?.id || favorite.vehicle_id || favorite.listing?.id || favorite.id;
    // Prefer favorite.id (Favorite entry ID) over vehicle/listing ID
    const idToUse = favoriteId || vehicleId;
    await removeFavorite(idToUse);
  };

  const handleBookNow = (car) => {
    router.push(`/car/${car.id}`);
  };

  const handleViewDetails = (car) => {
    router.push(`/car/${car.id}`);
  };

  // Handler for bookings
  const handleViewBookingDetails = (booking) => {
    router.push(`/booking/${booking.id}`);
  };

  const handleCancelBooking = async (booking) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    alert('Booking cancellation is not implemented yet.');
  };

  const handleDeleteAccount = async (logout) => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await authService.deleteAccount();
        logout();
        router.push('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again or contact support.');
      }
    }
  };

  const profileCompletion = calculateProfileCompletion();

  return {
    // State
    accountData,
    activeTab,
    hasLocalDraft,
    saving,
    saveMessage,
    emailVerified,
    stats,
    profileCompletion,
    
    // User data
    favorites,
    favoritesLoading,
    bookingsLoading,
    
    // Computed
    upcomingBookings: upcomingBookings(),
    pastBookings: pastBookings(),
    
    // Handlers
    setActiveTab,
    handleAccountFieldChange,
    handleSaveProfile,
    handleProfilePictureUpload,
    handleRemoveFavorite,
    handleBookNow,
    handleViewDetails,
    handleViewBookingDetails,
    handleCancelBooking,
    handleDeleteAccount,
    refreshVerificationStatus
  };
};

