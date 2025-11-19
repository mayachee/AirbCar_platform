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
        
        // Debug logging
        console.log('🔍 Search API Response:', {
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasData: !!response?.data,
          dataType: typeof response?.data,
          dataIsArray: Array.isArray(response?.data),
          nestedData: response?.data?.data,
          nestedDataIsArray: Array.isArray(response?.data?.data)
        });
        
        // Handle different response structures from API client
        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response?.data) {
          // API client wraps response: { data: {...}, success: true }
          // Backend returns: { data: [], count: 0, message: "..." }
          // So we need to check response.data.data
          if (Array.isArray(response.data)) {
            // Direct array (unlikely but handle it)
            data = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            // Nested structure: { data: { data: [...], count: 12 } }
            data = response.data.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            // Paginated response
            data = response.data.results;
          } else {
            // Fallback: try to extract any array from response.data
            console.warn('⚠️ Unexpected response structure:', {
              response,
              dataKeys: response.data ? Object.keys(response.data) : 'no data',
              dataValue: response.data
            });
            data = [];
          }
        }
        
        console.log('✅ Extracted vehicles:', data.length, 'items');
        setVehicles(data);
        setFilteredVehicles(data);
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
      // Handle different response structures from API client
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        // API client wraps response: { data: {...}, success: true }
        // Backend returns: { data: [], count: 0, message: "..." }
        // So we need to check response.data.data
        if (Array.isArray(response.data)) {
          // Direct array (unlikely but handle it)
          data = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Nested structure: { data: { data: [...], count: 12 } }
          data = response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          // Paginated response
          data = response.data.results;
        } else {
          // Fallback: try to extract any array from response.data
          console.warn('Unexpected response structure in refetch:', response);
          data = [];
        }
      }
      setVehicles(data);
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
