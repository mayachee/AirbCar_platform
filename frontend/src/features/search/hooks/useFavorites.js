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

    try {
      setLoading(true);
      
      if (favorites.has(normalizedCarId)) {
        // Remove from favorites
        try {
          await listingsService.removeFavorite(normalizedCarId);
          setFavorites(prev => {
            const newFavorites = new Set(prev);
            newFavorites.delete(normalizedCarId);
            return newFavorites;
          });
        } catch (error) {
          // If endpoint doesn't exist, just update local state
          if (error.message?.includes('404')) {
            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(normalizedCarId);
              return newFavorites;
            });
          } else {
            throw error;
          }
        }
      } else {
        // Add to favorites
        try {
          await listingsService.toggleFavorite(normalizedCarId);
          setFavorites(prev => new Set([...prev, normalizedCarId]));
        } catch (error) {
          // If endpoint doesn't exist, just update local state
          if (error.message?.includes('404')) {
            setFavorites(prev => new Set([...prev, normalizedCarId]));
          } else if (error.message?.includes('401') || error.message?.includes('403')) {
            // Authentication error - re-throw so UI can handle it
            throw error;
          } else {
            console.warn('Could not toggle favorite:', error.message);
            // Still update local state for better UX
            setFavorites(prev => new Set([...prev, normalizedCarId]));
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
