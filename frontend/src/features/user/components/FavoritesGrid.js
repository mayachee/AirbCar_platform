'use client';

import { formatCurrency } from '../utils/formatting';
import { Heart, MapPin, Users, DollarSign, Calendar, Car, Loader2 } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';

export default function FavoritesGrid({ favorites, loading, onRemoveFavorite, onBookNow, onViewDetails, viewMode = 'grid', removingFavorite = null }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-orange-500/40 rounded-xl shadow-sm border p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-gray-600 mb-6">Start adding cars to your favorites to save them for later!</p>
      </div>
    );
  }

  const getCarImage = (car) => {
    return getVehicleImageUrl(car);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {favorites.map((favorite, index) => {
          const car = favorite.listing || favorite.vehicle || favorite;
          const vehicleId = car.id || favorite.vehicle_id || favorite.id;
          const uniqueKey = favorite.id && favorite.listing ? `favorite-${favorite.id}` : `vehicle-${vehicleId}-${index}`;
          const isRemoving = removingFavorite === vehicleId;
          const imageUrl = getCarImage(car);

          return (
            <div key={uniqueKey} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                {/* Car Image */}
                <div className="md:w-64 w-full h-48 md:h-auto bg-gray-100 relative overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      if (e.target.src !== '/carsymbol.jpg') {
                        e.target.src = '/carsymbol.jpg';
                      }
                    }}
                  />
                  {onRemoveFavorite && (
                    <button
                      onClick={() => onRemoveFavorite(favorite)}
                      disabled={isRemoving}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors text-red-500 disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Heart className="w-5 h-5 fill-current" />
                      )}
                    </button>
                  )}
                </div>

                {/* Car Details */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {car.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                        {car.year && ` (${car.year})`}
                      </h3>
                      {car.location && (
                        <div className="flex items-center text-sm text-gray-600 mb-4">
                          <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                          {car.location}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {(car.seating_capacity || car.seats) && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {car.seating_capacity || car.seats} seats
                          </div>
                        )}
                        {car.transmission && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Car className="w-4 h-4 mr-1 text-gray-400" />
                            {car.transmission}
                          </div>
                        )}
                        {car.fuel_type && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Car className="w-4 h-4 mr-1 text-gray-400" />
                            {car.fuel_type}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-700">
                          <DollarSign className="w-4 h-4 mr-1 text-orange-500" />
                          <span className="text-lg font-bold text-orange-500">
                            {formatCurrency(car.price_per_day || car.price)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-4">
                    {onBookNow && (
                      <button
                        onClick={() => onBookNow(car)}
                        className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book Now</span>
                      </button>
                    )}
                    {onViewDetails && (
                      <button
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
        })}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((favorite, index) => {
        // Handle different favorite response structures
        const car = favorite.listing || favorite.vehicle || favorite;
        const vehicleId = car.id || favorite.vehicle_id || favorite.id;
        const uniqueKey = favorite.id && favorite.listing ? `favorite-${favorite.id}` : `vehicle-${vehicleId}-${index}`;
        const isRemoving = removingFavorite === vehicleId;
        const imageUrl = getCarImage(car);
        
        return (
          <div key={uniqueKey} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 group">
            {/* Car Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
              <img
                src={imageUrl}
                alt={`${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  if (e.target.src !== '/carsymbol.jpg') {
                    e.target.src = '/carsymbol.jpg';
                  }
                }}
              />
              {onRemoveFavorite && (
                <button
                  onClick={() => onRemoveFavorite(favorite)}
                  disabled={isRemoving}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors text-red-500 disabled:opacity-50 shadow-lg"
                  title="Remove from favorites"
                >
                  {isRemoving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className="w-5 h-5 fill-current" />
                  )}
                </button>
              )}
              {/* Price Badge */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-bold text-orange-500">
                    {formatCurrency(car.price_per_day || car.price)}
                  </span>
                  <span className="text-xs text-gray-500">/day</span>
                </div>
              </div>
            </div>

            {/* Car Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {car.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                {car.year && <span className="text-gray-500"> ({car.year})</span>}
              </h3>
              
              {car.location && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                  <span>{car.location}</span>
                </div>
              )}

              {/* Features */}
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-700 mb-4">
                {(car.seating_capacity || car.seats) && (
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    {car.seating_capacity || car.seats} seats
                  </span>
                )}
                {car.transmission && (
                  <span className="flex items-center">
                    <Car className="w-4 h-4 mr-1 text-gray-400" />
                    {car.transmission}
                  </span>
                )}
                {car.fuel_type && (
                  <span>{car.fuel_type}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {onBookNow && (
                  <button
                    onClick={() => onBookNow(car)}
                    className="flex-1 bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Now</span>
                  </button>
                )}
                {onViewDetails && (
                  <button
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
      })}
    </div>
  );
}
