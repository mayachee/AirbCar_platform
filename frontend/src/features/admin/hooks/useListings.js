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
      const listingsData = await adminService.getListings();
      const listingsList = listingsData.results || listingsData || [];
      setListings(listingsList);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError(err.message);
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

