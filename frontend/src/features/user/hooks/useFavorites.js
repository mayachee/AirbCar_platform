'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '../services/userService';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useFavorites - Loading favorites for user:', user?.email);
      
      const response = await userService.getFavorites();
      console.log('📦 useFavorites - Raw API response:', response);
      
      const data = response.data || response;
      console.log('📊 useFavorites - Extracted data:', data);
      
      // Transform favorites data to ensure consistent structure
      let favoritesList = Array.isArray(data) ? data : [];
      console.log('📋 useFavorites - Initial favorites list:', favoritesList.length, favoritesList);
      
      // Process favorites - normalize the structure
      favoritesList = favoritesList.map(fav => {
        // Handle different structures from backend
        if (fav.listing) {
          // Standard Favorite object with listing from backend
          // Backend structure: { id: favoriteId, listing: {...listing data...}, user: {...}, created_at: ... }
          return {
            id: fav.id, // Favorite entry ID from backend
            listing: fav.listing, // Full listing object
            vehicle: fav.listing, // Alias for compatibility
            vehicle_id: fav.listing.id,
            listing_id: fav.listing.id,
            created_at: fav.created_at
          };
        } else if (fav.vehicle) {
          // Favorite with vehicle field (alternative structure)
          return {
            id: fav.id,
            listing: fav.vehicle,
            vehicle: fav.vehicle,
            vehicle_id: fav.vehicle.id,
            listing_id: fav.vehicle.id,
            created_at: fav.created_at
          };
        } else if (fav.id && (fav.make || fav.model)) {
          // Direct listing object - wrap it in favorite structure
          return {
            id: fav.id, // This might be listing ID
            listing: fav,
            vehicle: fav,
            vehicle_id: fav.id,
            listing_id: fav.id
          };
        } else {
          // Already normalized or unknown structure
          return fav;
        }
      });
      
      console.log('✅ useFavorites - Normalized favorites:', favoritesList.length, 'items', favoritesList);
      setFavorites(favoritesList);
    } catch (err) {
      console.error('❌ useFavorites - Error loading favorites:', err);
      // Handle 404 errors - favorites endpoint might not be implemented yet
      if (err.message?.includes('404') || err.status === 404) {
        console.warn('⚠️ Favorites endpoint returned 404 - endpoint may not be available');
      } else {
        console.warn('❌ Could not load favorites:', err.message);
        setError(err.message);
      }
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add to favorites
  const addFavorite = useCallback(async (vehicleId) => {
    try {
      setLoading(true);
      
      // For add, we need to load full data from API first
      const result = await userService.addFavorite(vehicleId);
      
      // Reload favorites to get the complete list
      await loadFavorites();
      return true;
    } catch (err) {
      console.error('Error adding favorite:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadFavorites]);

  // Remove from favorites
  const removeFavorite = useCallback(async (vehicleId) => {
    try {
      setLoading(true);
      
      // OPTIMISTIC UPDATE: Remove from local state immediately for better UX
      const previousFavorites = favorites;
      setFavorites(prev => prev.filter(fav => {
        const favVehicleId = fav.vehicle?.id || fav.vehicle_id || fav.id;
        const favListingId = fav.listing?.id || fav.listing;
        return favVehicleId !== vehicleId && favListingId !== vehicleId;
      }));
      
      // Then make the API call in the background
      try {
        const result = await userService.removeFavorite(vehicleId);
        console.log('✅ Successfully removed from favorites:', vehicleId);
        return true;
      } catch (err) {
        // If favorite not found, it might already be removed - treat as success
        const errorMessage = (err.message || '').toLowerCase();
        const isNotFound = err.status === 404 || 
                          errorMessage.includes('404') || 
                          errorMessage.includes('not found') || 
                          errorMessage.includes('endpoint not found') ||
                          errorMessage.includes('favorite not found');
        
        if (isNotFound) {
          console.log('Favorite not found on backend, already removed from UI');
          return true;
        }
        
        // For other errors, revert the optimistic update
        console.error('Error removing favorite, reverting UI:', err);
        setFavorites(previousFavorites);
        setError(err.message);
        return false;
      }
    } catch (err) {
      console.error('Error in removeFavorite:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (vehicleId) => {
    const isFavorite = favorites.some(fav => 
      (fav.vehicle?.id || fav.vehicle_id || fav.id) === vehicleId
    );

    if (isFavorite) {
      return await removeFavorite(vehicleId);
    } else {
      return await addFavorite(vehicleId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Check if vehicle is favorited
  const isFavorite = useCallback((vehicleId) => {
    return favorites.some(fav => 
      (fav.vehicle?.id || fav.vehicle_id || fav.id) === vehicleId
    );
  }, [favorites]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: loadFavorites
  };
};
