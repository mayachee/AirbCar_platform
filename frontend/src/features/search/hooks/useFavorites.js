import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { listingsService } from '@/services/api';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const operatingOnRef = useRef(new Set());

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
        setError(null);
        const response = await listingsService.getFavorites();
        const favoriteList = response.data || response;
        const ids = Array.isArray(favoriteList)
          ? favoriteList
              .map(item => normalizeId(item?.id ?? item?.vehicle_id ?? item?.car_id))
              .filter(Boolean)
          : [];
        setFavorites(new Set(ids));
        console.log('✅ Loaded favorites:', ids.length);
      } catch (error) {
        if (error.message?.includes('404')) {
          console.log('Favorites endpoint not available');
        } else {
          console.warn('Could not load favorites:', error.message);
          setError(error.message);
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

    // Prevent duplicate operations
    if (operatingOnRef.current.has(normalizedCarId)) {
      console.warn('⚠️ Operation already in progress for:', normalizedCarId);
      return;
    }

    const isCurrentlyFavorited = favorites.has(normalizedCarId);
    operatingOnRef.current.add(normalizedCarId);
    
    try {
      setLoading(true);
      setError(null);
      
      // OPTIMISTIC UPDATE: Update UI immediately
      if (isCurrentlyFavorited) {
        // Remove from favorites
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(normalizedCarId);
          return newFavorites;
        });
        
        // API call with retry logic
        let retries = 0;
        while (retries <= 2) {
          try {
            await listingsService.removeFavorite(normalizedCarId);
            console.log('✅ Removed from favorites:', normalizedCarId);
            setError(null);
            return;
          } catch (error) {
            const errorMsg = (error.message || '').toLowerCase();
            const isRetryable = error.status >= 500 || errorMsg.includes('timeout') || errorMsg.includes('network');
            const isNotFound = error.status === 404 || errorMsg.includes('404') || errorMsg.includes('not found');
            
            if (isNotFound) {
              console.log('Already removed from server');
              setError(null);
              return;
            }
            
            if (isRetryable && retries < 2) {
              retries++;
              console.warn(`⚠️ Retrying removal (${retries}/2)...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
              continue;
            }
            
            // Failed - revert UI
            console.error('Failed to remove favorite:', error);
            setFavorites(prev => new Set([...prev, normalizedCarId]));
            setError('Failed to remove from favorites');
            throw error;
          }
        }
      } else {
        // Add to favorites
        setFavorites(prev => new Set([...prev, normalizedCarId]));
        
        try {
          await listingsService.toggleFavorite(normalizedCarId);
          console.log('✅ Added to favorites:', normalizedCarId);
          setError(null);
        } catch (error) {
          const errorMsg = (error.message || '').toLowerCase();
          const isAuth = error.status === 401 || error.status === 403 || errorMsg.includes('auth');
          
          if (isAuth) {
            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(normalizedCarId);
              return newFavorites;
            });
            throw error;
          }
          
          // For other errors, keep the optimistic update
          console.warn('Failed to add favorite (optimistic update kept):', error);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (!error.message?.includes('auth')) {
        setError('Failed to update favorite');
      }
      throw error;
    } finally {
      setLoading(false);
      operatingOnRef.current.delete(normalizedCarId);
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
    loading,
    error
  };
};
