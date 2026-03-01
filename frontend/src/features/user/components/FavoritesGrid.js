'use client';

import { Heart, MapPin, Users, DollarSign, Calendar, Car, Loader2 } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';

// --- Helpers: normalize favorite shape from API/context ---
function getCarFromFavorite(favorite) {
  return favorite?.listing || favorite?.vehicle || favorite;
}

function getVehicleId(favorite) {
  const car = getCarFromFavorite(favorite);
  return car?.id ?? favorite?.vehicle_id ?? favorite?.id;
}

function getUniqueKey(favorite, index) {
  if (favorite?.id && favorite?.listing) return `favorite-${favorite.id}`;
  const vid = getVehicleId(favorite);
  return `vehicle-${vid}-${index}`;
}

const DEFAULT_IMAGE = '/carsymbol.jpg';

function FavoriteCard({
  favorite,
  variant,
  formatPrice,
  onRemoveFavorite,
  onBookNow,
  onViewDetails,
  removingFavorite,
}) {
  const car = getCarFromFavorite(favorite);
  const vehicleId = getVehicleId(favorite);
  const isRemoving = removingFavorite === vehicleId;
  const imageUrl = getVehicleImageUrl(car);
  const title = car?.name || `${car?.make ?? ''} ${car?.model ?? ''}`.trim() || 'Car';
  const price = formatPrice(car?.price_per_day ?? car?.price);
  const seats = car?.seating_capacity ?? car?.seats;

  const handleImageError = (e) => {
    if (e.target.src !== DEFAULT_IMAGE) e.target.src = DEFAULT_IMAGE;
  };

  const removeButton = onRemoveFavorite && (
    <button
      type="button"
      onClick={() => onRemoveFavorite(favorite)}
      disabled={isRemoving}
      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors text-red-500 disabled:opacity-50 shadow-lg"
      title="Remove from favorites"
      aria-label="Remove from favorites"
    >
      {isRemoving ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : (
        <Heart className="w-5 h-5 fill-current" aria-hidden />
      )}
    </button>
  );

  const priceBadge = (
    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
      <div className="flex items-baseline space-x-1">
        <span className="text-xl font-bold text-orange-500">{price}</span>
        <span className="text-xs text-gray-500">/day</span>
      </div>
    </div>
  );

  if (variant === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 w-full h-48 md:h-auto bg-gray-100 relative overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleImageError}
            />
            {removeButton}
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {title}
                  {car?.year && ` (${car.year})`}
                </h3>
                {car?.location && (
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-1 text-orange-500" aria-hidden />
                    {car.location}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {seats != null && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="w-4 h-4 mr-1 text-gray-400" aria-hidden />
                      {seats} seats
                    </div>
                  )}
                  {car?.transmission && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Car className="w-4 h-4 mr-1 text-gray-400" aria-hidden />
                      {car.transmission}
                    </div>
                  )}
                  {car?.fuel_type && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Car className="w-4 h-4 mr-1 text-gray-400" aria-hidden />
                      {car.fuel_type}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-700">
                    <DollarSign className="w-4 h-4 mr-1 text-orange-500" aria-hidden />
                    <span className="text-lg font-bold text-orange-500">{price}</span>
                    <span className="text-xs text-gray-500 ml-1">/day</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              {onBookNow && (
                <button
                  type="button"
                  onClick={() => onBookNow(car)}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" aria-hidden />
                  <span>Book Now</span>
                </button>
              )}
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(car)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors text-sm"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className="bg-[#1E293B]/30 rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={handleImageError}
        />
        {removeButton}
        {priceBadge}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
          {car?.year != null && <span className="text-gray-500"> ({car.year})</span>}
        </h3>
        {car?.location && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1 text-orange-500" aria-hidden />
            <span>{car.location}</span>
          </div>
        )}
        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-700 mb-4">
          {seats != null && (
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-gray-400" aria-hidden />
              {seats} seats
            </span>
          )}
          {car?.transmission && (
            <span className="flex items-center">
              <Car className="w-4 h-4 mr-1 text-gray-400" aria-hidden />
              {car.transmission}
            </span>
          )}
          {car?.fuel_type && <span>{car.fuel_type}</span>}
        </div>
        <div className="flex space-x-3">
          {onBookNow && (
            <button
              type="button"
              onClick={() => onBookNow(car)}
              className="flex-1 bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" aria-hidden />
              <span>Book Now</span>
            </button>
          )}
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(car)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors text-sm font-medium"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FavoritesGrid({
  favorites,
  loading,
  onRemoveFavorite,
  onBookNow,
  onViewDetails,
  viewMode = 'grid',
  removingFavorite = null,
  error = null,
}) {
  const { formatPrice } = useCurrency();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-live="polite">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200" />
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center" role="alert">
        <p className="text-red-700 dark:text-red-400 font-medium mb-2">Could not load favorites</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  const isList = viewMode === 'list';
  const Container = isList ? 'div' : 'div';
  const containerClass = isList ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <Container className={containerClass} role="list" aria-label="Favorite vehicles">
      {favorites.map((favorite, index) => (
        <div key={getUniqueKey(favorite, index)} role="listitem">
          <FavoriteCard
            favorite={favorite}
            variant={viewMode}
            formatPrice={formatPrice}
            onRemoveFavorite={onRemoveFavorite}
            onBookNow={onBookNow}
            onViewDetails={onViewDetails}
            removingFavorite={removingFavorite}
          />
        </div>
      ))}
    </Container>
  );
}
