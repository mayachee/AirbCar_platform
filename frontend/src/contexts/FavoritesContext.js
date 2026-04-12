'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const FavoritesContext = createContext({
  favorites: new Set(),
  addFavorite: () => {},
  removeFavorite: () => {},
  toggleFavorite: () => {},
  isFavorite: () => false,
  loading: false,
});

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const operatingOnRef = useRef(new Set());
  const isDev = process.env.NODE_ENV !== 'production';

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('favorites_list');
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(new Set(parsed));
          if (isDev) console.log('📦 Loaded favorites from localStorage:', parsed.length);
        }
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('favorites_list', JSON.stringify([...favorites]));
        if (isDev) console.log('💾 Saved favorites:', favorites.size);
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
    }
  }, [favorites]);

  const addFavorite = useCallback((vehicleId) => {
    const id = String(vehicleId);
    if (!id || operatingOnRef.current.has(id)) return;

    operatingOnRef.current.add(id);
    setFavorites(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      if (isDev) console.log('➕ Added favorite:', id);
      return newSet;
    });

    setTimeout(() => operatingOnRef.current.delete(id), 100);
  }, []);

  const removeFavorite = useCallback((vehicleId) => {
    const id = String(vehicleId);
    if (!id || operatingOnRef.current.has(id)) return;

    operatingOnRef.current.add(id);
    setFavorites(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      if (isDev) console.log('➖ Removed favorite:', id);
      return newSet;
    });

    setTimeout(() => operatingOnRef.current.delete(id), 100);
  }, []);

  const toggleFavorite = useCallback((vehicleId) => {
    const id = String(vehicleId);
    if (!id) return;

    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        if (isDev) console.log('➖ Toggled removed:', id);
      } else {
        newSet.add(id);
        if (isDev) console.log('➕ Toggled added:', id);
      }
      return newSet;
    });
  }, []);

  const isFavorite = useCallback((vehicleId) => {
    return favorites.has(String(vehicleId));
  }, [favorites]);

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    loading,
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
    console.warn('useFavoritesContext called outside FavoritesProvider');
    return {
      favorites: new Set(),
      addFavorite: () => {},
      removeFavorite: () => {},
      toggleFavorite: () => {},
      isFavorite: () => false,
      loading: false,
    };
  }
  return context;
}
