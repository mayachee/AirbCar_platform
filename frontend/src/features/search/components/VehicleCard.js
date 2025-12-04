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
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{car.name}</h3>
            <p className="text-gray-600 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {car.location}
            </p>
          </div>
          <div className="text-right">
            {car.totalPrice ? (
              <>
                <div className="text-2xl font-bold text-orange-500">
                  {car.totalPrice} MAD
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  for {car.rentalDuration} day{car.rentalDuration > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  ({formatPrice(car.price_per_day)} per day)
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-500">
                  {formatPrice(car.price_per_day)}
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  {showPricePerDay(car.price_per_day)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Car Features */}
        <div className="flex items-center text-sm text-gray-700 mb-4 space-x-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {car.seats} seats
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            {car.transmission}
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {car.fuel}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(car.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-700">
              {car.rating} ({car.reviews} reviews)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button 
            onClick={() => onViewDetails(car)}
            className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            View Details
          </button>
          <button 
            onClick={() => onToggleFavorite(car.id)}
            disabled={favoritesLoading}
            className={`px-4 py-3 border rounded-lg transition-colors ${
              isFavorite 
                ? 'border-red-500 text-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-orange-500 hover:text-orange-500'
            } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg 
              className="w-5 h-5" 
              fill={isFavorite ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
