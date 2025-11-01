import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/features/auth/services/authService';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authService.getProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.updateProfile(profileData);
      setProfile(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateProfile };
};

export const useAuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleAuth = async (authFunction, ...args) => {
    try {
      setLoading(true);
      clearMessages();
      const result = await authFunction(...args);
      setSuccessMessage('Operation completed successfully');
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    successMessage,
    clearMessages,
    handleAuth
  };
};

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await authService.requestPasswordReset(email);
      setSuccessMessage('Password reset email sent');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await authService.resetPassword(token, newPassword);
      setSuccessMessage('Password reset successfully');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    successMessage,
    requestPasswordReset,
    resetPassword
  };
};
