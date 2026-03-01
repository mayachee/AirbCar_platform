'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/features/user/services/userService';
import { FavoritesGrid } from '@/features/user';
import { Search, RefreshCw, Heart, X, AlertCircle, CheckCircle, Grid, List as ListIcon } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

const FAVORITES_QUERY_KEY = ['favorites'];

function getFavoritesQueryKey(userId) {
  return ['favorites', userId ?? 'guest'];
}

function normalizeFavorite(listing) {
  return {
    id: listing.id,
    listing,
    vehicle: listing,
    vehicle_id: listing.id,
    created_at: listing.created_at,
  };
}

export default function FavoritesTab({ favorites: propFavorites, loading: propLoading, onRemoveFavorite: onRemoveFavoriteProp, onBookNow, onViewDetails }) {
  const t = useTranslations('account');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { favorites: contextFavorites, toggleFavorite } = useFavoritesContext();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [removingFavorite, setRemovingFavorite] = useState(null);

  const fetchFavoritesList = useCallback(async () => {
    if (user) {
      try {
        const res = await userService.getFavorites();
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw : (raw?.favorites ?? raw?.data ?? []);
        return list.map((fav) => {
          const listing = fav.listing ?? fav.vehicle ?? fav;
          return {
            id: fav.id ?? listing?.id,
            listing,
            vehicle: listing,
            vehicle_id: listing?.id ?? fav.vehicle_id,
            created_at: fav.created_at,
          };
        });
      } catch (err) {
        throw err;
      }
    }
    const favoriteIds = Array.from(contextFavorites || []);
    if (favoriteIds.length === 0) return [];

    const response = await apiClient.get('/listings/', undefined, { timeout: 60000 });
    const data = response?.data || response;
    let allListings = [];
    if (data.results && Array.isArray(data.results)) {
      allListings = data.results;
    } else if (Array.isArray(data)) {
      allListings = data;
    } else if (data.data && Array.isArray(data.data)) {
      allListings = data.data;
    }

    return allListings
      .filter((listing) => favoriteIds.includes(String(listing.id)))
      .map(normalizeFavorite);
  }, [user, contextFavorites]);

  const {
    data: favorites = [],
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: getFavoritesQueryKey(user?.id),
    queryFn: fetchFavoritesList,
    enabled: !!user || (contextFavorites?.size ?? 0) > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loadError = queryError ? `Failed to load favorites: ${queryError.message}` : null;

  const handleRemoveFavorite = useCallback(
    async (favorite) => {
      if (!favorite) return;
      const vehicleId = favorite.vehicle?.id ?? favorite.vehicle_id ?? favorite.listing?.id;
      const favoriteId = favorite.id;
      if (vehicleId == null) return;

      setRemovingFavorite(vehicleId);
      setError(null);

      try {
        // Cancel any in-flight refetches so they don't overwrite our optimistic update
        await queryClient.cancelQueries({ queryKey: getFavoritesQueryKey(user?.id) });

        // IMMEDIATE UI UPDATE - Remove from display right away
        queryClient.setQueryData(getFavoritesQueryKey(user?.id), (prev) => {
          if (!Array.isArray(prev)) return [];
          return prev.filter((fav) => {
            const id = fav.vehicle?.id ?? fav.vehicle_id ?? fav.listing?.id;
            return String(id) !== String(vehicleId);
          });
        });

        // Update context as well
        toggleFavorite(vehicleId);

        // Show success message
        setSuccessMessage('✨ Removed from favorites');
        setTimeout(() => setSuccessMessage(''), 2000);

        // Sync with backend in background — do NOT revert UI on failure
        if (user) {
          userService.removeFavorite(vehicleId).catch((err) => {
            console.warn('⚠️ Backend sync failed (item already removed from UI):', err.message);
          });
        }
      } catch (err) {
        console.error('Error in remove handler:', err);
        setError('Error removing favorite');
        setTimeout(() => setError(null), 5000);
      } finally {
        setRemovingFavorite(null);
      }
    },
    [toggleFavorite, queryClient, user]
  );

  const getFilteredAndSortedFavorites = () => {
    let filtered = [...favorites];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((fav) => {
        const car = fav.listing || fav.vehicle || fav;
        const vehicleName = `${car.make || ''} ${car.model || ''}`.toLowerCase();
        const location = (car.location || '').toLowerCase();
        return vehicleName.includes(term) || location.includes(term);
      });
    }
    filtered.sort((a, b) => {
      const carA = a.listing || a.vehicle || a;
      const carB = b.listing || b.vehicle || b;
      if (sortBy === 'price-low') {
        return (carA.price_per_day || carA.price || 0) - (carB.price_per_day || carB.price || 0);
      }
      if (sortBy === 'price-high') {
        return (carB.price_per_day || carB.price || 0) - (carA.price_per_day || carA.price || 0);
      }
      if (sortBy === 'name') {
        const nameA = `${carA.make || ''} ${carA.model || ''}`.toLowerCase();
        const nameB = `${carB.make || ''} ${carB.model || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return (b.id || 0) - (a.id || 0);
    });
    return filtered;
  };

  const handleBookNow = (car) => {
    if (onBookNow) onBookNow(car);
    else router.push(`/car/${car.id}`);
  };

  const handleViewDetails = (car) => {
    if (onViewDetails) onViewDetails(car);
    else router.push(`/car/${car.id}`);
  };

  const displayFavorites = favorites.length > 0 ? favorites : propFavorites || [];
  const filteredFavorites = getFilteredAndSortedFavorites();
  const isLoading = queryLoading || propLoading;

  return (
    <div className="p-8 space-y-6">
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

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white-900 mb-2 flex items-center space-x-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            <span>{t('favorites_tab_title')}</span>
          </h3>
          <p className="text-gray-600">
            {filteredFavorites.length === displayFavorites.length
              ? t('favorites_count', { count: displayFavorites.length })
              : t('favorites_filtered', { filtered: filteredFavorites.length, total: displayFavorites.length })}
          </p>
        </div>
      </div>

      {displayFavorites.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('favorites_search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <SelectField
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'recent', label: t('favorites_sort_recent') },
              { value: 'price-low', label: t('favorites_sort_price_low') },
              { value: 'price-high', label: t('favorites_sort_price_high') },
              { value: 'name', label: t('favorites_sort_name') },
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

      <FavoritesGrid
        favorites={filteredFavorites.length > 0 ? filteredFavorites : searchTerm ? [] : displayFavorites}
        loading={isLoading}
        onRemoveFavorite={handleRemoveFavorite}
        onBookNow={handleBookNow}
        onViewDetails={handleViewDetails}
        viewMode={viewMode}
        removingFavorite={removingFavorite}
        error={loadError}
      />

      {!isLoading && searchTerm && filteredFavorites.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('favorites_empty')}</h3>
          <p className="text-gray-600 mb-4">{t('favorites_search')} &quot;{searchTerm}&quot;</p>
          <button onClick={() => setSearchTerm('')} className="text-orange-600 hover:text-orange-700 font-medium">
            {t('cancel')}
          </button>
        </div>
      )}

      {!isLoading && !searchTerm && displayFavorites.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('favorites_empty')}</h3>
          <p className="text-gray-600 mb-4">No favorites yet. Start adding your favorite cars!</p>
          <button onClick={() => router.push('/search')} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
            Browse Cars
          </button>
        </div>
      )}
    </div>
  );
}
