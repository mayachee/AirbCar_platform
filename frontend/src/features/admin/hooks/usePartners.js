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
      setError(null); // Clear any previous errors
      console.log('🔄 Loading partners...');
      const response = await adminService.getPartners().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Partners API timeout/network error:', err.message);
          setError(`Network error: ${err.message || 'Unable to connect to server. Please check if the backend is running.'}`);
          return null;
        }
        throw err; // Re-throw other errors
      });
      console.log('📦 Partners response received:', response);
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
      console.log('📦 Full response JSON:', JSON.stringify(response, null, 2));
      
      // Extract data from API response
      // Backend PartnerListView returns: { data: [...] }
      // apiClient wraps it to: { data: { data: [...] }, success: true }
      let partnersList = [];
      
      if (!response) {
        console.warn('⚠️ No response received (likely network error)');
        // Error already set in catch block above
        setPartners([]);
        return;
      } else if (Array.isArray(response)) {
        // Direct array response (unlikely but handle it)
        console.log('✅ Response is direct array');
        partnersList = response;
      } else if (response.data !== undefined) {
        // apiClient wrapped response - extract inner data
        const innerData = response.data;
        console.log('📦 Inner data:', innerData);
        console.log('📦 Inner data type:', typeof innerData);
        console.log('📦 Inner data isArray:', Array.isArray(innerData));
        
        // Check if innerData is the array directly (backend returned array)
        if (Array.isArray(innerData)) {
          console.log('✅ Found array directly in response.data');
          partnersList = innerData;
        } 
        // Check if innerData has a data property (backend returned { data: [...] })
        else if (innerData && typeof innerData === 'object' && innerData.data !== undefined) {
          console.log('📦 Found innerData.data:', innerData.data);
          console.log('📦 innerData.data type:', typeof innerData.data);
          console.log('📦 innerData.data isArray:', Array.isArray(innerData.data));
          if (Array.isArray(innerData.data)) {
            console.log('✅ Found array in response.data.data');
            partnersList = innerData.data;
          } else {
            console.warn('⚠️ response.data.data exists but is not an array:', innerData.data);
          }
        }
        // Check for paginated results
        else if (innerData && typeof innerData === 'object' && innerData.results !== undefined) {
          console.log('📦 Found innerData.results:', innerData.results);
          if (Array.isArray(innerData.results)) {
            console.log('✅ Found paginated results in response.data.results');
            partnersList = innerData.results;
          }
        }
        // Check if innerData is null or empty
        else if (innerData === null || innerData === undefined) {
          console.warn('⚠️ Inner data is null or undefined');
          partnersList = [];
        }
        // If innerData is an object but no array found, log it
        else if (innerData && typeof innerData === 'object') {
          console.warn('⚠️ Could not find partners array in response.data');
          console.warn('⚠️ Inner data keys:', Object.keys(innerData));
          console.warn('⚠️ Inner data:', JSON.stringify(innerData, null, 2));
          // Try to find any array-like structure
          for (const key in innerData) {
            if (Array.isArray(innerData[key])) {
              console.warn(`⚠️ Found array in innerData.${key}:`, innerData[key]);
            }
          }
        }
      } else {
        console.warn('⚠️ Unexpected response structure - no data property');
        console.warn('⚠️ Response:', JSON.stringify(response, null, 2));
        partnersList = [];
      }
      
      console.log('✅ Processed partners list:', partnersList);
      console.log('✅ Partners count:', partnersList.length);
      console.log('✅ Partner IDs:', partnersList.map(p => p?.id || p?.pk || 'no-id'));
      console.log('✅ Partner details:', partnersList.map(p => ({
        id: p?.id || p?.pk,
        name: p?.name || p?.company_name || p?.business_name,
        email: p?.email || p?.user?.email,
        is_verified: p?.is_verified,
        verification_status: p?.verification_status
      })));
      setPartners(partnersList);
    } catch (error) {
      console.error('❌ Error loading partners:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        isNetworkError: error.isNetworkError,
        isTimeoutError: error.isTimeoutError
      });
      setError(error.message || 'Failed to load partners');
      setPartners([]);
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

  const unverifyPartner = async (partnerId) => {
    try {
      await adminService.unverifyPartner(partnerId);
      // Optimistically update local state
      setPartners(prev => {
        const partnersArray = Array.isArray(prev) ? prev : [];
        return partnersArray.map(partner => 
          partner.id === partnerId 
            ? { ...partner, verification_status: 'pending', is_verified: false }
            : partner
        );
      });
      // Then reload to get fresh data
      await loadPartners();
      return true;
    } catch (err) {
      console.error('Error unverifying partner:', err);
      if (err?.message) {
        console.error('Error details:', err.message);
      }
      return false;
    }
  };

  const handleView = async (partner) => {
    try {
      // Fetch fresh partner data
      const response = await adminService.getPartnerById(partner.id);
      console.log('Partner details response:', response);
      // Extract data from response
      const partnerData = response?.data || response;
      console.log('Partner details:', partnerData);
      return partnerData;
    } catch (error) {
      console.error('Error fetching partner details:', error);
      throw error;
    }
  };

  const handleEdit = async (partner, updatedData) => {
    try {
      const response = await adminService.updatePartner(partner.id, updatedData);
      // Extract data from response
      const updatedPartner = response?.data || response;
      await loadPartners(); // Reload partners after update
      return updatedPartner;
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  };

  const handleDelete = async (partner) => {
    if (!confirm(`Are you sure you want to delete ${partner.name || partner.email || partner.company_name || `Partner #${partner.id}`}?`)) {
      return;
    }
    
    try {
      await adminService.deletePartner(partner.id);
      await loadPartners(); // Reload partners after deletion
      alert('Partner deleted successfully');
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Failed to delete partner');
    }
  };

  const handleCreate = async (partnerData) => {
    try {
      // Note: You may need to add createPartner method to adminService
      // For now, this is a placeholder
      const response = await adminService.createPartner?.(partnerData);
      // Extract data from response
      const newPartner = response?.data || response;
      await loadPartners(); // Reload partners after creation
      return newPartner;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
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
    unverifyPartner,
    updatePartner,
    deletePartner,
    handleView,
    handleEdit,
    handleDelete,
    handleCreate,
    refetch: loadPartners
  };
};

