'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { FavoritesGrid } from '@/features/user';
import { Search, RefreshCw, Heart, X, AlertCircle, CheckCircle, Loader2, Filter, Grid, List as ListIcon } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function FavoritesTab({ favorites: propFavorites, loading: propLoading, onRemoveFavorite, onBookNow, onViewDetails }) {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, price-low, price-high, name
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [removingFavorite, setRemovingFavorite] = useState(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLocalLoading(true);
      setError(null);
      
      let favoritesData = [];
      
      // Try the my-favorites endpoint first (returns favorites with full listing details)
      try {
        // Increase timeout for favorites (60 seconds - may include full listing details)
        const response = await apiClient.get('/favorites/my-favorites/', undefined, { timeout: 60000 });
        const data = response?.data || response;
        console.log('my-favorites response:', data);
        
        // Backend returns: { favorites: [...], listings: [...] }
        if (data.favorites && Array.isArray(data.favorites)) {
          // Use favorites array directly (contains favorite entry + listing)
          favoritesData = data.favorites;
        } else if (data.listings && Array.isArray(data.listings)) {
          // If backend returns listings directly, wrap them in favorite structure
          favoritesData = data.listings.map((listing, idx) => ({
            id: data.favorites?.[idx]?.id || listing.id,
            listing: listing,
            created_at: data.favorites?.[idx]?.created_at
          }));
        } else if (Array.isArray(data)) {
          favoritesData = data;
        }
      } catch (err) {
        console.error('My-favorites endpoint error:', err);
        // Continue to fallback
      }

      // Fallback to general favorites endpoint (GET /favorites/)
      if (favoritesData.length === 0 || !favoritesData) {
        try {
          // Increase timeout for favorites (60 seconds - may include full listing details)
          const response = await apiClient.get('/favorites/', undefined, { timeout: 60000 });
          const data = response?.data || response;
          console.log('General favorites response:', data);
          
          // Handle different response structures
          if (data.results && Array.isArray(data.results)) {
            favoritesData = data.results;
          } else if (Array.isArray(data)) {
            favoritesData = data;
          } else if (data.favorites && Array.isArray(data.favorites)) {
            favoritesData = data.favorites;
          } else if (data.data && Array.isArray(data.data)) {
            favoritesData = data.data;
          }
        } catch (err) {
          console.error('General favorites endpoint error:', err.message);
          setError(`Failed to load favorites: ${err.message}`);
        }
      }

      // Transform and process favorites data
      const processedFavorites = [];
      const seenIds = new Set();
      
      // Process fetched favorites - handle both Favorite objects and direct listings
      favoritesData.forEach(fav => {
        // Handle different favorite response structures:
        // 1. { id: favoriteId, listing: {...}, user: {...} } - Standard Favorite object
        // 2. { listing: {...} } - Direct listing in favorite
        // 3. {...} - Direct listing object
        const favorite = fav.listing || fav;
        const favoriteId = fav.id; // Favorite entry ID
        const listingId = favorite?.id || favorite;
        
        // Create a unique key for deduplication
        const dedupeKey = favoriteId || listingId;
        
        if (dedupeKey && !seenIds.has(dedupeKey)) {
          seenIds.add(dedupeKey);
          
          // Normalize the favorite structure
          processedFavorites.push({
            id: favoriteId || listingId, // Favorite entry ID or listing ID
            listing: favorite, // The actual listing/vehicle data
            vehicle: favorite, // Alias for compatibility
            vehicle_id: listingId,
            created_at: fav.created_at
          });
        }
      });
      
      // If no favorites from API and props are available, use them
      if (processedFavorites.length === 0 && propFavorites && propFavorites.length > 0) {
        propFavorites.forEach(fav => {
          const listing = fav.listing || fav.vehicle || fav;
          const vehicleId = listing?.id || fav.vehicle_id || fav.id;
          if (vehicleId && !seenIds.has(vehicleId)) {
            seenIds.add(vehicleId);
            processedFavorites.push({
              id: fav.id || vehicleId,
              listing: listing,
              vehicle: listing,
              vehicle_id: vehicleId
            });
          }
        });
      }
      
      if (processedFavorites.length > 0) {
        console.log(`✅ Successfully loaded ${processedFavorites.length} favorites from backend`);
      } else if (!error) {
        console.log('ℹ️ No favorites found in backend');
      }
      setFavorites(processedFavorites);
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      const errorMsg = err.message || 'Failed to load favorites';
      
      // If 404, the endpoint might not exist - fallback to props if available
      if (err.message && (err.message.includes('404') || err.status === 404)) {
        console.warn('⚠️ Favorites API endpoint returned 404');
        if (propFavorites && propFavorites.length > 0) {
          console.log('Using provided favorites data as fallback');
          // Deduplicate propFavorites if using them
          const deduplicated = [];
          const seenIds = new Set();
          propFavorites.forEach(fav => {
            const listing = fav.listing || fav.vehicle || fav;
            const vehicleId = listing?.id || fav.vehicle_id || fav.id;
            if (vehicleId && !seenIds.has(vehicleId)) {
              seenIds.add(vehicleId);
              deduplicated.push({
                id: fav.id || vehicleId,
                listing: listing,
                vehicle: listing,
                vehicle_id: vehicleId
              });
            }
          });
          setFavorites(deduplicated);
        } else {
          setError('Favorites API endpoint not available. Please check your backend connection.');
        }
      } else {
        // Other errors - network issues, auth issues, etc.
        setError(`Failed to load favorites: ${errorMsg}. Please check your connection and try refreshing.`);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [propFavorites]);

  useEffect(() => {
    // Always fetch to get fresh data
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (favorite) => {
    if (!favorite) return;

    // Get the favorite ID (the Favorite object ID from backend)
    // OR the listing/vehicle ID as fallback
    const favoriteId = favorite.id; // This is the Favorite entry ID from backend
    const vehicleId = favorite.vehicle?.id || favorite.vehicle_id || favorite.listing?.id;
    
    // Use favorite.id (Favorite entry ID) if available - this is what the backend expects
    // favorite.id is the ID of the Favorite entry in the database, not the listing ID
    const idToUse = favoriteId || vehicleId;
    setRemovingFavorite(idToUse);
    
    try {
      // Try to use the provided handler first
      if (onRemoveFavorite) {
        await onRemoveFavorite(favorite);
        setFavorites(prev => prev.filter(fav => {
          const favId = fav.id || fav.vehicle?.id || fav.vehicle_id || fav.listing?.id;
          const listingId = fav.listing?.id || fav.vehicle?.id;
          return favId !== idToUse && listingId !== vehicleId;
        }));
        setSuccessMessage('Removed from favorites');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      
      // Otherwise try API call - try favorite ID first, then fallback to listing/vehicle ID
      try {
        await apiClient.delete(`/favorites/${idToUse}/`);
      } catch (deleteError) {
        const deleteErrorMessage = (deleteError.message || '').toLowerCase();
        const isNotFound = deleteError.status === 404 || 
                          deleteErrorMessage.includes('404') || 
                          deleteErrorMessage.includes('not found') ||
                          deleteErrorMessage.includes('endpoint not found');
        
        // If favorite ID doesn't work with 404, try with listing/vehicle ID
        if (isNotFound && favoriteId && vehicleId !== favoriteId) {
          try {
          await apiClient.delete(`/favorites/${vehicleId}/`);
          } catch (secondDeleteError) {
            const secondErrorMessage = (secondDeleteError.message || '').toLowerCase();
            const secondIsNotFound = secondDeleteError.status === 404 || 
                                    secondErrorMessage.includes('404') || 
                                    secondErrorMessage.includes('not found') ||
                                    secondErrorMessage.includes('endpoint not found');
            
            // If both fail with 404, treat as success (favorite already removed)
            if (secondIsNotFound) {
              console.log('Favorite not found with either ID, assuming already removed');
              // Continue to update local state below
            } else {
              throw secondDeleteError;
            }
          }
        } else if (isNotFound) {
          // 404 means favorite already removed - treat as success
          console.log('Favorite not found, assuming already removed');
          // Continue to update local state below
        } else {
          throw deleteError;
        }
      }
      
      // Update local state immediately for better UX
      setFavorites(prev => prev.filter(fav => {
        const favId = fav.id || fav.vehicle?.id || fav.vehicle_id || fav.listing?.id;
        const listingId = fav.listing?.id || fav.vehicle?.id;
        return favId !== idToUse && listingId !== vehicleId;
      }));
      
      setSuccessMessage('Removed from favorites');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the favorites to ensure consistency
      await fetchFavorites();
    } catch (err) {
      // Handle different error cases gracefully
      const errorMessage = (err.message || '').toLowerCase();
      const isNotFoundError = err.status === 404 || 
                              errorMessage.includes('404') || 
                              errorMessage.includes('not found') || 
                              errorMessage.includes('endpoint not found') ||
                              errorMessage.includes('favorite not found');
      
      if (isNotFoundError) {
        console.log('Favorite not found or already removed');
        // Update local state anyway - favorite might already be removed
        setFavorites(prev => prev.filter(fav => {
          const favId = fav.id || fav.vehicle?.id || fav.vehicle_id || fav.listing?.id;
          const listingId = fav.listing?.id || fav.vehicle?.id;
          return favId !== idToUse && listingId !== vehicleId;
        }));
        setSuccessMessage('Removed from favorites');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Error removing favorite:', err);
        setError('Failed to remove favorite. Please try again.');
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setRemovingFavorite(null);
    }
  };

  // Filter and sort favorites
  const getFilteredAndSortedFavorites = () => {
    let filtered = [...favorites];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fav => {
        const car = fav.listing || fav.vehicle || fav;
        const vehicleName = `${car.make || ''} ${car.model || ''}`.toLowerCase();
        const location = (car.location || '').toLowerCase();
        return vehicleName.includes(term) || location.includes(term);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const carA = a.listing || a.vehicle || a;
      const carB = b.listing || b.vehicle || b;
      
      if (sortBy === 'price-low') {
        const priceA = carA.price_per_day || carA.price || 0;
        const priceB = carB.price_per_day || carB.price || 0;
        return priceA - priceB;
      } else if (sortBy === 'price-high') {
        const priceA = carA.price_per_day || carA.price || 0;
        const priceB = carB.price_per_day || carB.price || 0;
        return priceB - priceA;
      } else if (sortBy === 'name') {
        const nameA = `${carA.make || ''} ${carA.model || ''}`.toLowerCase();
        const nameB = `${carB.make || ''} ${carB.model || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        // Recent (default) - keep original order or by ID
        return (b.id || 0) - (a.id || 0);
      }
    });

    return filtered;
  };

  const handleBookNow = (car) => {
    if (onBookNow) {
      onBookNow(car);
    } else {
      router.push(`/car/${car.id}`);
    }
  };

  const handleViewDetails = (car) => {
    if (onViewDetails) {
      onViewDetails(car);
    } else {
      router.push(`/car/${car.id}`);
    }
  };

  const displayFavorites = favorites.length > 0 ? favorites : (propFavorites || []);
  const filteredFavorites = getFilteredAndSortedFavorites();
  const isLoading = localLoading || propLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-2 hover:text-green-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white-900 mb-2 flex items-center space-x-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            <span>My Favorite Cars</span>
          </h3>
          <p className="text-gray-600">
            {filteredFavorites.length === displayFavorites.length 
              ? `You have ${displayFavorites.length} favorite ${displayFavorites.length === 1 ? 'car' : 'cars'}`
              : `Showing ${filteredFavorites.length} of ${displayFavorites.length} favorites`
            }
          </p>
        </div>
        <button
          onClick={() => fetchFavorites()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters and Search */}
      {displayFavorites.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by car name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <SelectField
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'recent', label: 'Recently Added' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
              { value: 'name', label: 'Name: A to Z' },
            ]}
            className="px-4 py-2 rounded-lg"
          />
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="List view"
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Favorites Grid */}
      <FavoritesGrid
        favorites={filteredFavorites.length > 0 ? filteredFavorites : (searchTerm ? [] : displayFavorites)}
        loading={isLoading}
        onRemoveFavorite={handleRemoveFavorite}
        onBookNow={handleBookNow}
        onViewDetails={handleViewDetails}
        viewMode={viewMode}
        removingFavorite={removingFavorite}
      />

      {/* No Results Message */}
      {!isLoading && searchTerm && filteredFavorites.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
          <p className="text-gray-600 mb-4">No favorites match your search "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

    </div>
  );
}

