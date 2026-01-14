'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SearchFilters({ filters, onFilterChange }) {
  const { formatPrice, currency: currentCurrency } = useCurrency();
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
    <div className="sticky top-6">
      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Price Range ({currentCurrency}/day)
        </label>
        <div className="px-3">
          <input
            type="range"
            min="0"
            max="5000"
            value={filters.priceRange ? filters.priceRange[1] : 5000}
            onChange={(e) => onFilterChange({ priceRange: [0, parseInt(e.target.value)] })}
            className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #F97316 0%, #F97316 ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, rgba(255,255,255,0.1) ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-400 font-medium bg-white/5 px-2 py-1 rounded">{formatPrice(0)}</span>
            <span className="text-orange-400 font-medium bg-orange-500/10 px-2 py-1 rounded">
              {filters.priceRange ? (filters.priceRange[1] >= 5000 ? formatPrice(5000) + '+' : formatPrice(filters.priceRange[1])) : formatPrice(5000) + '+'}
            </span>
          </div>
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Transmission
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {['Manual', 'Automatic'].map(type => (
            <button
              key={type}
              onClick={() => handleTransmissionToggle(type)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                (filters.transmission || []).includes(type)
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Fuel Type
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(fuel => (
            <button
              key={fuel}
              onClick={() => handleFuelTypeToggle(fuel)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                (filters.fuelType || []).includes(fuel)
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Style
        </h3>
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      (filters.style || []).includes(style)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {style}
                  </button>
                ))}
                {!showAllStyles && (
                  <button
                    onClick={() => setShowAllStyles(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Brand
        </h3>
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      (filters.brand || []).includes(brand)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
                {!showAllBrands && (
                  <button
                    onClick={() => setShowAllBrands(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Features
        </h3>
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      (filters.features || []).includes(feature)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
                {!showAllFeatures && (
                  <button
                    onClick={() => setShowAllFeatures(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 flex items-center justify-center gap-1"
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
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Seats
        </h3>
        <div className="flex flex-wrap gap-2">
          {['2', '4', '5', '7', '8+'].map(seats => (
            <button
              key={seats}
              onClick={() => handleSeatsToggle(seats)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                (filters.seats || []).includes(seats)
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {seats}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Agency */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => onFilterChange({ verified: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-5 h-5 border-2 border-white/20 rounded bg-white/5 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all duration-200"></div>
            <svg className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">Verified agencies only</span>
        </label>
      </div>

      {/* Instant Booking */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.instantBooking}
              onChange={(e) => onFilterChange({ instantBooking: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-5 h-5 border-2 border-white/20 rounded bg-white/5 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all duration-200"></div>
            <svg className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">Instant booking available</span>
        </label>
      </div>
    </div>
  );
}
