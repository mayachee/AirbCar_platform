'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useAccount, useFavorites, useBookings, useUserStats } from '@/features/user';

export const useAccountPage = () => {
  const router = useRouter();
  
  const {
    accountData,
    saving,
    saveMessage,
    emailVerified,
    calculateProfileCompletion,
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
      localStorage.setItem('accountForm', JSON.stringify(accountData));
    } catch (_) {}
  }, [accountData]);

  // Handle form field changes
  const handleAccountFieldChange = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      // Prepare profile data - map frontend camelCase to backend snake_case
      const profileData = {
        first_name: accountData.firstName,
        last_name: accountData.lastName,
        phone_number: accountData.phoneNumber,
        date_of_birth: accountData.dateOfBirth || null,
        address: accountData.address,
        city: accountData.city,
        country_of_residence: accountData.country, // Use country_of_residence as per backend model
        postal_code: accountData.postalCode || null,
        license_number: accountData.licenseNumber,
        license_origin_country: accountData.licenseCountry,
        issue_date: accountData.licenseIssueDate || null,
        expiry_date: accountData.licenseExpiryDate || null,
        nationality: accountData.placeOfBirth || null
      };

      // Remove null/undefined/empty string values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === null || profileData[key] === undefined || profileData[key] === '') {
          delete profileData[key];
        }
      });

      // Use authService to update profile
      const response = await authService.updateProfile(profileData);
      // Unwrap ApiResponse - the actual data is in response.data
      const updatedUserData = response?.data || response;

      setSaveMessage('Profile updated successfully!');
      localStorage.removeItem('accountForm');
      setHasLocalDraft(false);
      
      // Transform backend response (snake_case) to frontend format (camelCase)
      updateAccountData({
        firstName: updatedUserData.first_name || accountData.firstName,
        lastName: updatedUserData.last_name || accountData.lastName,
        email: updatedUserData.email || accountData.email,
        phoneNumber: updatedUserData.phone_number || accountData.phoneNumber,
        dateOfBirth: updatedUserData.date_of_birth || accountData.dateOfBirth,
        placeOfBirth: updatedUserData.nationality || accountData.placeOfBirth,
        address: updatedUserData.address || accountData.address,
        city: updatedUserData.city || accountData.city,
        country: updatedUserData.country_of_residence || accountData.country,
        postalCode: updatedUserData.postal_code || accountData.postalCode,
        licenseNumber: updatedUserData.license_number || accountData.licenseNumber,
        licenseCountry: updatedUserData.license_origin_country || accountData.licenseCountry,
        licenseIssueDate: updatedUserData.issue_date || accountData.licenseIssueDate,
        licenseExpiryDate: updatedUserData.expiry_date || accountData.licenseExpiryDate,
        profileImage: updatedUserData.profile_picture || accountData.profileImage
      });
      
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
      
      // Transform backend response (snake_case) to frontend format (camelCase)
      updateAccountData({
        firstName: updatedData.first_name || accountData.firstName,
        lastName: updatedData.last_name || accountData.lastName,
        email: updatedData.email || accountData.email,
        phoneNumber: updatedData.phone_number || accountData.phoneNumber,
        dateOfBirth: updatedData.date_of_birth || accountData.dateOfBirth,
        placeOfBirth: updatedData.nationality || accountData.placeOfBirth,
        address: updatedData.address || accountData.address,
        city: updatedData.city || accountData.city,
        country: updatedData.country_of_residence || accountData.country,
        postalCode: updatedData.postal_code || accountData.postalCode,
        licenseNumber: updatedData.license_number || accountData.licenseNumber,
        licenseCountry: updatedData.license_origin_country || accountData.licenseCountry,
        licenseIssueDate: updatedData.issue_date || accountData.licenseIssueDate,
        licenseExpiryDate: updatedData.expiry_date || accountData.licenseExpiryDate,
        profileImage: updatedData.profile_picture || updatedUserData.profile_picture || '/default-avatar.svg'
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
    const vehicleId = favorite.vehicle?.id || favorite.vehicle_id || favorite.id;
    await removeFavorite(vehicleId);
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

