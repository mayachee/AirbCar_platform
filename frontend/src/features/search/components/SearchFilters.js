'use client';

import { useState } from 'react';

export default function SearchFilters({ filters, onFilterChange }) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);

  const handleTransmissionToggle = (type) => {
    const current = filters.transmission || [];
    if (current.includes(type)) {
      onFilterChange({ transmission: current.filter(t => t !== type) });
    } else {
      onFilterChange({ transmission: [...current, type] });
    }
  };

  const handleFuelTypeToggle = (type) => {
    const current = filters.fuelType || [];
    if (current.includes(type)) {
      onFilterChange({ fuelType: current.filter(f => f !== type) });
    } else {
      onFilterChange({ fuelType: [...current, type] });
    }
  };

  const handleStyleToggle = (style) => {
    const current = filters.style || [];
    if (current.includes(style)) {
      onFilterChange({ style: current.filter(s => s !== style) });
    } else {
      onFilterChange({ style: [...current, style] });
    }
  };

  const handleBrandToggle = (brand) => {
    const current = filters.brand || [];
    if (current.includes(brand)) {
      onFilterChange({ brand: current.filter(b => b !== brand) });
    } else {
      onFilterChange({ brand: [...current, brand] });
    }
  };

  const handleFeatureToggle = (feature) => {
    const current = filters.features || [];
    if (current.includes(feature)) {
      onFilterChange({ features: current.filter(f => f !== feature) });
    } else {
      onFilterChange({ features: [...current, feature] });
    }
  };

  const handleSeatsToggle = (seats) => {
    const current = filters.seats || [];
    if (current.includes(seats)) {
      onFilterChange({ seats: current.filter(s => s !== seats) });
    } else {
      onFilterChange({ seats: [...current, seats] });
    }
  };

  return (
    <div className="bg-white sticky top-6">
      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Price Range (MAD/day)
        </label>
        <div className="px-3">
          <input
            type="range"
            min="0"
            max="5000"
            value={filters.priceRange ? filters.priceRange[1] : 5000}
            onChange={(e) => onFilterChange({ priceRange: [0, parseInt(e.target.value)] })}
            className="w-full h-3 bg-gradient-to-r from-orange-100 to-orange-300 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #F97316 0%, #F97316 ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, #E5E7EB ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-700 font-medium bg-gray-50 px-2 py-1 rounded">0 MAD</span>
            <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
              {filters.priceRange ? (filters.priceRange[1] >= 5000 ? '5000+' : filters.priceRange[1]) : '5000+'} MAD
            </span>
          </div>
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Transmission
        </label>
        <div className="flex flex-wrap gap-2">
          {['Manual', 'Automatic'].map(type => (
            <button
              key={type}
              onClick={() => handleTransmissionToggle(type)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                (filters.transmission || []).includes(type)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Fuel Type
        </label>
        <div className="flex flex-wrap gap-2">
          {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(fuel => (
            <button
              key={fuel}
              onClick={() => handleFuelTypeToggle(fuel)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                (filters.fuelType || []).includes(fuel)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Style
        </label>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const allStyles = ['Commercial', 'City', 'Sedan', 'Family', 'Minibus', '4x4', 'Convertible', 'Coupe', 'Antique', 'Campervan', 'SUV'];
            const stylesToShow = showAllStyles ? allStyles : allStyles.slice(0, 3);
            
            return (
              <>
                {stylesToShow.map(style => (
                  <button
                    key={style}
                    onClick={() => handleStyleToggle(style)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                      (filters.style || []).includes(style)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    {style}
                  </button>
                ))}
                {!showAllStyles && (
                  <button
                    onClick={() => setShowAllStyles(true)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-orange-600 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show More
                  </button>
                )}
                {showAllStyles && (
                  <button
                    onClick={() => setShowAllStyles(false)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Brand */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Brand
        </label>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const allBrands = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ford', 'Honda', 'Nissan', 'Chevrolet', 'Hyundai', 'Kia', 'Mazda', 'Jeep', 'Alfa-Romeo', 'Chrysler', 'Dacia', 'Dodge', 'Fiat', 'Land-Rover', 'Lexus', 'Mini', 'Mitsubishi', 'Opel', 'Seat', 'Skoda', 'Smart', 'Suzuki', 'Tesla', 'Volvo'];
            const brandsToShow = showAllBrands ? allBrands : allBrands.slice(0, 3);
            
            return (
              <>
                {brandsToShow.map(brand => (
                  <button
                    key={brand}
                    onClick={() => handleBrandToggle(brand)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                      (filters.brand || []).includes(brand)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
                {!showAllBrands && (
                  <button
                    onClick={() => setShowAllBrands(true)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-orange-600 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show More
                  </button>
                )}
                {showAllBrands && (
                  <button
                    onClick={() => setShowAllBrands(false)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Features
        </label>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const allFeatures = ['Child seat', 'GPS', 'Air conditioning', 'Bike rack', 'Roof box', 'Cruise control', 'Snow tires', 'Snow chains', 'Apple CarPlay', 'Android Auto', 'Four-wheel drive'];
            const featuresToShow = showAllFeatures ? allFeatures : allFeatures.slice(0, 3);
            
            return (
              <>
                {featuresToShow.map(feature => (
                  <button
                    key={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                      (filters.features || []).includes(feature)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
                {!showAllFeatures && (
                  <button
                    onClick={() => setShowAllFeatures(true)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-orange-600 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show More
                  </button>
                )}
                {showAllFeatures && (
                  <button
                    onClick={() => setShowAllFeatures(false)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Seats */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seats
        </label>
        <div className="flex flex-wrap gap-2">
          {['2', '4', '5', '7', '8+'].map(seats => (
            <button
              key={seats}
              onClick={() => handleSeatsToggle(seats)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-shrink-0 ${
                (filters.seats || []).includes(seats)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
              }`}
            >
              {seats}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Agency */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => onFilterChange({ verified: e.target.checked })}
            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Verified agencies only</span>
        </label>
      </div>

      {/* Instant Booking */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.instantBooking}
            onChange={(e) => onFilterChange({ instantBooking: e.target.checked })}
            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Instant booking available</span>
        </label>
      </div>
    </div>
  );
}
