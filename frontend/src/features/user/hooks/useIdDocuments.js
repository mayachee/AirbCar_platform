'use client';

import { useState } from 'react';
import { userService } from '../services/userService';

export const useIdDocuments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const uploadDocuments = async (idFrontDocument, idBackDocument) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await userService.uploadIdDocuments(idFrontDocument, idBackDocument);
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to upload documents');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadDocuments,
    loading,
    error,
    success
  };
};
