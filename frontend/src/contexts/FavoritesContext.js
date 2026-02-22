'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const operatingOnRef = useRef(new Set());

  // Load favorites from API on mount and when user changes
  useEffect(() => {
    if (user) {
      loadFavoritesFromAPI();
    } else {
      setFavorites(new Set());
      if (typeof window !== 'undefined') {
        localStorage.removeItem('favorites_temp');
      }
    }
  }, [user]);

  // Auto-save to localStorage as backup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'favorites_temp',
        JSON.stringify([...favorites])
      );
    }
  }, [favorites]);

  const loadFavoritesFromAPI = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Try to load from API
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Load from localStorage as fallback
        loadFavoritesFromStorage();
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/favorites/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const favoritesList = data.results || data.data || data || [];
        const ids = Array.isArray(favoritesList)
          ? favoritesList
              .map(item => String(item?.id ?? item?.vehicle_id ?? item?.car_id ?? item?.listing?.id))
              .filter(Boolean)
          : [];
        
        setFavorites(new Set(ids));
        console.log('✅ Loaded favorites from API:', ids.length);
      } else {
        // Fallback to localStorage
        loadFavoritesFromStorage();
      }
    } catch (err) {
      console.warn('Failed to load favorites from API, using localStorage:', err);
      loadFavoritesFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritesFromStorage = () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('favorites_temp');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(new Set(parsed));
        console.log('📦 Loaded favorites from localStorage:', parsed.length);
      }
    } catch (err) {
      console.error('Failed to load from storage:', err);
      setFavorites(new Set());
    }
  };

  const addFavorite = useCallback(
    (vehicleId) => {
      const id = String(vehicleId);
      if (id && !operatingOnRef.current.has(id)) {
        operatingOnRef.current.add(id);
        
        setFavorites(prev => {
          const newFavs = new Set(prev);
          newFavs.add(id);
          console.log('➕ Added to favorites:', id);
          return newFavs;
        });

        // Send to API
        syncToAPI('add', id);
        
        setTimeout(() => operatingOnRef.current.delete(id), 200);
      }
    },
    []
  );

  const removeFavorite = useCallback(
    (vehicleId) => {
      const id = String(vehicleId);
      if (id && !operatingOnRef.current.has(id)) {
        operatingOnRef.current.add(id);
        
        setFavorites(prev => {
          const newFavs = new Set(prev);
          newFavs.delete(id);
          console.log('➖ Removed from favorites:', id);
          return newFavs;
        });

        // Send to API
        syncToAPI('remove', id);
        
        setTimeout(() => operatingOnRef.current.delete(id), 200);
      }
    },
    []
  );

  const syncToAPI = async (action, vehicleId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      if (action === 'add') {
        await fetch(`${apiUrl}/favorites/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vehicle_id: vehicleId }),
        });
      } else if (action === 'remove') {
        // Try with vehicle_id first, then favorite_id
        let response = await fetch(`${apiUrl}/favorites/${vehicleId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok && response.status === 404) {
          // Try alternate endpoint
          response = await fetch(`${apiUrl}/favorites/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vehicle_id: vehicleId, action: 'remove' }),
          });
        }
      }

      console.log(`✅ Synced ${action} to API for:`, vehicleId);
    } catch (err) {
      console.warn(`⚠️ Failed to sync ${action} to API:`, err);
      // Don't show error to user - UI is already updated optimistically
    }
  };

  const toggleFavorite = useCallback(
    (vehicleId) => {
      const id = String(vehicleId);
      if (id && !operatingOnRef.current.has(id)) {
        const isFav = favorites.has(id);
        if (isFav) {
          removeFavorite(id);
        } else {
          addFavorite(id);
        }
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback(
    (vehicleId) => {
      return favorites.has(String(vehicleId));
    },
    [favorites]
  );

  const clearAllFavorites = useCallback(() => {
    setFavorites(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('favorites_temp');
    }
    console.log('🗑️ Cleared all favorites');
  }, []);

  const value = {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount: favorites.size,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider');
  }
  return context;
}
