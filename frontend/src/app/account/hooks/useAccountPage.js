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

        response = await authService.updateProfile(formData);
      } else {
        response = await authService.updateProfile(profileData);
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
      
      // Preserve file uploads and previews if they exist
      updateAccountData({
        ...mappedData,
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
      
      if (error.message) {
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
      const response = await authService.uploadProfilePicture(file);
      // Unwrap ApiResponse - the actual data is in response.data
      const updatedUserData = response?.data || response;
      
      // Also refresh full user data to sync everything
      const userResponse = await authService.getCurrentUser();
      const updatedData = userResponse?.data || userResponse;
      
      // Map backend response to frontend format
      const mappedData = mapBackendToFrontend(updatedData);
      
      // Priority: base64 data URL > profile_picture_url (Supabase/external URLs) > default
      // Base64 data URLs are stored directly in database and are always valid
      // Note: Backend returns base64 through profile_picture_url field (starts with data:image/)
      let profileImage = updatedUserData.profile_picture_url || 
                        updatedUserData.profile_picture_base64 || 
                        mappedData.profileImage;
      
      // If profile_picture_url is a base64 data URL, use it directly
      if (profileImage && profileImage.startsWith('data:image/')) {
        // Base64 data URL - always valid, use as is
      } else if (profileImage) {
        // Not base64 - validate that the URL is not a local file path
        if (
          profileImage.startsWith('/media/') ||
          profileImage.startsWith('/profiles/') ||
          profileImage.includes('/media/') ||
          profileImage.includes('/profiles/') ||
          (profileImage.startsWith('http') && (
            profileImage.includes('/media/') ||
            profileImage.includes('/profiles/') ||
            profileImage.includes('airbcar-backend.onrender.com/media/') ||
            profileImage.includes('localhost/media/')
          ))
        ) {
          // This is a local file path, don't use it
          profileImage = null;
        }
      }
      
      // Fallback to default avatar if no valid URL
      profileImage = profileImage || '/default-avatar.svg';
      
      updateAccountData({
        ...mappedData,
        profileImage,
        idFrontDocumentFile: null,
        idBackDocumentFile: null,
        idFrontDocumentPreview: '',
        idBackDocumentPreview: ''
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
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

