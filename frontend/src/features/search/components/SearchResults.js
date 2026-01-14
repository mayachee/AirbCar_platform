'use client';

import VehicleCard from './VehicleCard';
import { showPricePerDay } from '@/features/search';

export default function SearchResults({ 
  filteredCars, 
  onViewDetails, 
  onToggleFavorite, 
  isFavorite, 
  favoritesLoading
}) {
  // Ensure filteredCars is always an array
  const cars = Array.isArray(filteredCars) ? filteredCars : [];
  
  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8c.28 0 .556.014.827.042l2.651-9.529z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
        <p className="text-gray-700 mb-4">Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <>
      {cars.map((car) => {
        return (
          <VehicleCard
            key={car.id}
            car={car}
            onViewDetails={onViewDetails}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(car.id)}
            favoritesLoading={favoritesLoading}
          />
        );
      })}
    </>
  );
}
