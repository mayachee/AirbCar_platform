import { useState, useEffect, useCallback } from 'react';
import { searchService, filterVehicles, sortVehicles } from '@/features/search';

export { useFavorites } from './useFavorites';

export const useSearch = (initialFilters = {}) => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('price_low');

  // Load vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await searchService.searchVehicles(filters);
        const data = response.data || response;
        setVehicles(data || []);
        setFilteredVehicles(data || []);
      } catch (err) {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Search API timeout/network error, using empty list');
          setVehicles([]);
          setFilteredVehicles([]);
          setError(null); // Don't show error to user
        } else {
          console.warn('Failed to fetch vehicles:', err.message);
          setVehicles([]);
          setFilteredVehicles([]);
          setError(null); // Don't show error to user
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    // Filter vehicles using utility function
    let filtered = filterVehicles(vehicles, filters);
    
    // Calculate rental duration and total price for each car if dates are available
    if (filters.pickupDate && filters.returnDate) {
      const duration = Math.ceil((new Date(filters.returnDate) - new Date(filters.pickupDate)) / (1000 * 60 * 60 * 24));
      
      filtered = filtered.map(car => ({
        ...car,
        rentalDuration: duration,
        totalPrice: (car.price_per_day || 0) * duration
      }));
    }

    // Apply sorting using utility function
    filtered = sortVehicles(filtered, sortBy);

    setFilteredVehicles(filtered);
  }, [vehicles, filters, sortBy]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchService.searchVehicles(filters);
      const data = response.data || response;
      setVehicles(data || []);
    } catch (err) {
      // Handle timeout and network errors gracefully
      if (err?.isTimeoutError || err?.isNetworkError) {
        console.warn('Search API timeout/network error, using empty list');
        setVehicles([]);
        setError(null);
      } else {
        console.warn('Failed to refetch vehicles:', err.message);
        setVehicles([]);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return {
    vehicles: filteredVehicles,
    allVehicles: vehicles,
    loading,
    error,
    filters,
    sortBy,
    updateFilters,
    setSortBy,
    clearFilters,
    refetch
  };
};
