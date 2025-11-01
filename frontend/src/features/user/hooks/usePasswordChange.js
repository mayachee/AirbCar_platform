'use client';

import { useState } from 'react';
import { userService } from '../services/userService';

export const usePasswordChange = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const changePassword = async (oldPassword, newPassword) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await userService.changePassword(oldPassword, newPassword);
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to change password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    changePassword,
    loading,
    error,
    success
  };
};
