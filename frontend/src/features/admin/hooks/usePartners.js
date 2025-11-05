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
      const partnersData = await adminService.getPartners().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Partners API timeout/network error, using empty list');
          return { results: [], data: [] };
        }
        throw err; // Re-throw other errors
      });
      // Handle different response structures and ensure we always have an array
      let partnersList = [];
      
      if (Array.isArray(partnersData)) {
        partnersList = partnersData;
      } else if (partnersData?.data) {
        partnersList = Array.isArray(partnersData.data) ? partnersData.data : 
                       (partnersData.data.results || []);
      } else if (partnersData?.results) {
        partnersList = Array.isArray(partnersData.results) ? partnersData.results : [];
      } else if (partnersData) {
        // Try to extract data from response object
        const responseData = partnersData?.data || partnersData?.result || partnersData;
        partnersList = Array.isArray(responseData) ? responseData : [];
      }
      
      // Ensure we always set an array
      setPartners(Array.isArray(partnersList) ? partnersList : []);
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
      // Optimistically update local state
      setPartners(prev => {
        const partnersArray = Array.isArray(prev) ? prev : [];
        return partnersArray.map(partner => 
          partner.id === partnerId 
            ? { ...partner, verification_status: 'approved', is_verified: true }
            : partner
        );
      });
      // Then reload to get fresh data
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error approving partner:', err);
      // Show user-friendly error message
      if (err?.message) {
        console.error('Error details:', err.message);
      }
      return false;
    }
  };

  const rejectPartner = async (partnerId) => {
    try {
      await adminService.rejectPartner(partnerId);
      // Optimistically update local state
      setPartners(prev => {
        const partnersArray = Array.isArray(prev) ? prev : [];
        return partnersArray.map(partner => 
          partner.id === partnerId 
            ? { ...partner, verification_status: 'rejected', is_verified: false }
            : partner
        );
      });
      // Then reload to get fresh data
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error rejecting partner:', err);
      // Show user-friendly error message
      if (err?.message) {
        console.error('Error details:', err.message);
      }
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

