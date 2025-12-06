'use client';

import { formatPrice, showPricePerDay } from '@/features/search';
import { getVehicleImageUrl } from '@/utils/imageUtils';

export default function VehicleCard({ car, onViewDetails, onToggleFavorite, isFavorite, favoritesLoading }) {
  // Use the image utility to fix URLs
  const imageUrl = getVehicleImageUrl(car);

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
      {/* Car Image */}
      <div className="relative">
        <img
          src={imageUrl}
          alt={car.name}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={(e) => {
            console.log('Image failed to load:', imageUrl, 'Car data:', car);
            if (e.target.src !== '/carsymbol.jpg') {
              e.target.src = '/carsymbol.jpg';
            }
          }}
        />
        {car.verified && (
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified Agency
            </span>
          </div>
        )}
      </div>

      {/* Car Details */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50">
        {/* Header Section with Title and Price */}
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
              {car.name}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <svg className="w-4 h-4 mr-1.5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{car.location}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {car.totalPrice ? (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {car.totalPrice} MAD
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {car.rentalDuration} day{car.rentalDuration > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatPrice(car.price_per_day)}/day
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatPrice(car.price_per_day)}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {showPricePerDay(car.price_per_day)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Car Features - Enhanced Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {car.seats} Seats
          </div>
          <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            {car.transmission}
          </div>
          <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {car.fuel}
          </div>
        </div>

        {/* Rating - Enhanced */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => {
                const rating = car.rating || 0;
                const filled = i < Math.floor(rating);
                const halfFilled = i === Math.floor(rating) && rating % 1 >= 0.5;
                return (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${filled ? 'text-yellow-400' : halfFilled ? 'text-yellow-300' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-900">{car.rating || 0}</span>
              <span className="text-xs text-gray-500">({car.reviews || 0} {car.reviews === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>
          {car.instant_booking && (
            <div className="flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Instant
            </div>
          )}
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-3">
          <button 
            onClick={() => onViewDetails(car)}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <button 
            onClick={() => onToggleFavorite(car.id)}
            disabled={favoritesLoading}
            className={`px-4 py-3 rounded-lg transition-all duration-200 border-2 ${
              isFavorite 
                ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100 shadow-md' 
                : 'border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 bg-white'
            } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg 
              className="w-5 h-5" 
              fill={isFavorite ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
