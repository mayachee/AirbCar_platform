'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const useListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading listings from API...');
      
      const response = await adminService.getListings().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('⚠️ Listings API timeout/network error, using empty list');
          setError('Unable to connect to the backend server. Please ensure it is running.');
          return { data: { results: [], data: [] } };
        }
        throw err; // Re-throw other errors
      });
      
      console.log('📦 Listings API response:', {
        responseType: typeof response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataType: typeof response?.data,
        dataIsArray: Array.isArray(response?.data),
        dataKeys: response?.data && typeof response?.data === 'object' ? Object.keys(response?.data) : []
      });
      
      // Extract data from API client response structure: { data: {...}, success: true }
      // Handle different response structures:
      // 1. Direct array: response.data = [...]
      // 2. Paginated: response.data = { results: [...], count: N }
      // 3. Nested: response.data = { data: [...] }
      // 4. Already extracted array
      let listingsList = [];
      
      if (Array.isArray(response)) {
        // Response is already an array
        listingsList = response;
      } else if (response?.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          // Direct array in data property
          listingsList = data;
        } else if (data?.results && Array.isArray(data.results)) {
          // Paginated response: { results: [...], count: N }
          listingsList = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          // Nested data structure: { data: { data: [...] } }
          listingsList = data.data;
        } else if (typeof data === 'object') {
          // Try to find any array property
          const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
          if (arrayKeys.length > 0) {
            listingsList = data[arrayKeys[0]];
            console.log(`📋 Using array from key: ${arrayKeys[0]}`);
          }
        }
      } else if (response?.results && Array.isArray(response.results)) {
        listingsList = response.results;
      }
      
      console.log(`✅ Extracted ${listingsList.length} listings`);
      setListings(Array.isArray(listingsList) ? listingsList : []);
      
      if (listingsList.length === 0 && !error) {
        console.info('ℹ️ No listings found in database');
      }
    } catch (err) {
      console.error('❌ Error loading listings:', err);
      const errorMessage = err?.message || 'Failed to load listings';
      setError(errorMessage);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const updateListing = async (listingId, listingData) => {
    try {
      const updated = await adminService.updateListing(listingId, listingData);
      await loadListings();
      return updated;
    } catch (err) {
      console.error('Error updating listing:', err);
      throw err;
    }
  };

  const deleteListing = async (listingId) => {
    try {
      await adminService.deleteListing(listingId);
      await loadListings();
      return true;
    } catch (err) {
      console.error('Error deleting listing:', err);
      return false;
    }
  };

  return {
    listings,
    loading,
    error,
    updateListing,
    deleteListing,
    refetch: loadListings
  };
};

