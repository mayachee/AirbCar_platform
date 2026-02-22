import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { listingsService } from '@/services/api';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const normalizeId = (value) => {
    if (value === null || value === undefined) return null;
    return String(value);
  };

  // Load favorites when user logs in
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites(new Set());
        return;
      }

      try {
        setLoading(true);
        const response = await listingsService.getFavorites();
        const favoriteList = response.data || response;
        const ids = Array.isArray(favoriteList)
          ? favoriteList
              .map(item => normalizeId(item?.id ?? item?.vehicle_id ?? item?.car_id))
              .filter(Boolean)
          : [];
        setFavorites(new Set(ids));
      } catch (error) {
        // Silently handle 404 or other errors - favorites endpoint might not be available
        if (error.message?.includes('404')) {
          console.log('Favorites endpoint not available');
        } else {
          console.warn('Could not load favorites:', error.message);
        }
        setFavorites(new Set());
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = async (carId) => {
    const normalizedCarId = normalizeId(carId);
    if (!normalizedCarId) return;

    const isCurrentlyFavorited = favorites.has(normalizedCarId);
    
    try {
      setLoading(true);
      
      // OPTIMISTIC UPDATE: Update UI immediately for better UX
      if (isCurrentlyFavorited) {
        // Remove from favorites - update state immediately
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(normalizedCarId);
          return newFavorites;
        });
        
        // Then make the API call in the background
        try {
          await listingsService.removeFavorite(normalizedCarId);
          console.log('✅ Successfully removed from favorites:', normalizedCarId);
        } catch (error) {
          console.warn('⚠️ Failed to remove from favorites API call, but UI already updated:', error.message);
          // If API call fails, revert the state
          if (!error.message?.includes('404') && !error.message?.includes('already') && !error.message?.includes('not found')) {
            setFavorites(prev => new Set([...prev, normalizedCarId]));
            throw error;
          }
          // For 404 or "not found" errors, keep the state as-is (already removed from UI)
        }
      } else {
        // Add to favorites - update state immediately
        setFavorites(prev => new Set([...prev, normalizedCarId]));
        
        // Then make the API call in the background
        try {
          await listingsService.toggleFavorite(normalizedCarId);
          console.log('✅ Successfully added to favorites:', normalizedCarId);
        } catch (error) {
          console.warn('⚠️ Failed to add to favorites API call, but UI already updated:', error.message);
          
          if (error.message?.includes('401') || error.message?.includes('403')) {
            // Authentication error - revert state and re-throw
            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(normalizedCarId);
              return newFavorites;
            });
            throw error;
          }
          
          // For 404 or other errors, keep the state as-is (already added to UI)
          if (!error.message?.includes('404')) {
            console.warn('Could not add favorite, but UI updated. Error:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error; // Re-throw so UI can handle authentication errors
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (carId) => {
    const normalizedCarId = normalizeId(carId);
    if (!normalizedCarId) return false;
    return favorites.has(normalizedCarId);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    loading
  };
};
