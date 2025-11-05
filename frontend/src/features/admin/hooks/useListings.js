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
      const listingsData = await adminService.getListings().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Listings API timeout/network error, using empty list');
          return { results: [], data: [] };
        }
        throw err; // Re-throw other errors
      });
      const listingsList = listingsData?.results || listingsData?.data || listingsData || [];
      setListings(Array.isArray(listingsList) ? listingsList : []);
    } catch (err) {
      console.error('Error loading listings:', err);
      // Don't set error for timeout/network errors - just use empty array
      if (!err?.isTimeoutError && !err?.isNetworkError) {
        setError(err.message);
      }
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

