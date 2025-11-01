'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const usePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const partnersData = await adminService.getPartners();
      const partnersList = partnersData.results || partnersData || [];
      setPartners(partnersList);
    } catch (err) {
      console.error('Error loading partners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const approvePartner = async (partnerId) => {
    try {
      await adminService.approvePartner(partnerId);
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error approving partner:', err);
      return false;
    }
  };

  const rejectPartner = async (partnerId) => {
    try {
      await adminService.rejectPartner(partnerId);
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error rejecting partner:', err);
      return false;
    }
  };

  const updatePartner = async (partnerId, partnerData) => {
    try {
      const updated = await adminService.updatePartner(partnerId, partnerData);
      await loadPartners();
      return updated;
    } catch (err) {
      console.error('Error updating partner:', err);
      throw err;
    }
  };

  const deletePartner = async (partnerId) => {
    try {
      await adminService.deletePartner(partnerId);
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error deleting partner:', err);
      return false;
    }
  };

  return {
    partners,
    loading,
    error,
    approvePartner,
    rejectPartner,
    updatePartner,
    deletePartner,
    refetch: loadPartners
  };
};

