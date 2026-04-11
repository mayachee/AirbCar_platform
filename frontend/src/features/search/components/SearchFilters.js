'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SearchFilters({ filters, onFilterChange }) {
  const t = useTranslations('search');
  const { formatPrice, currency: currentCurrency } = useCurrency();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);

  // Translation maps (API values -> displayed labels)
  const transmissionLabels = { 'Manual': t('sf_manual'), 'Automatic': t('sf_automatic') };
  const fuelLabels = { 'Petrol': t('sf_petrol'), 'Diesel': t('sf_diesel'), 'Electric': t('sf_electric'), 'Hybrid': t('sf_hybrid') };
  const styleLabels = { 'Commercial': t('sf_commercial'), 'City': t('sf_city'), 'Sedan': t('sf_sedan'), 'Family': t('sf_family'), 'Minibus': t('sf_minibus'), '4x4': t('sf_4x4'), 'Convertible': t('sf_convertible'), 'Coupe': t('sf_coupe'), 'Antique': t('sf_antique'), 'Campervan': t('sf_campervan'), 'SUV': t('sf_suv') };
  const featureLabels = { 'Child seat': t('sf_child_seat'), 'GPS': t('sf_gps'), 'Air conditioning': t('sf_air_conditioning'), 'Bike rack': t('sf_bike_rack'), 'Roof box': t('sf_roof_box'), 'Cruise control': t('sf_cruise_control'), 'Snow tires': t('sf_snow_tires'), 'Snow chains': t('sf_snow_chains'), 'Apple CarPlay': t('sf_apple_carplay'), 'Android Auto': t('sf_android_auto'), 'Four-wheel drive': t('sf_four_wheel_drive') };

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

  // Chip styling
  const chipBase = 'px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200';
  const chipActive = 'bg-[var(--color-orange-500)] text-white shadow-ambient-sm';
  const chipInactive = 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]';

  // Expand/collapse button
  const ExpandButton = ({ expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className={`${chipBase} ${chipInactive} flex items-center gap-1 text-[var(--color-orange-500)]`}
    >
      <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      {expanded ? t('sf_show_less') : t('sf_show_more')}
    </button>
  );

  // Section header
  const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[var(--color-orange-500)]" />
      {children}
    </h3>
  );

  return (
    <div className="sticky top-6 space-y-6">
      {/* Price Range */}
      <div>
        <SectionTitle>{t('sf_price_range', { currency: currentCurrency })}</SectionTitle>
        <div className="px-1">
          <input
            type="range"
            min="0"
            max="5000"
            value={filters.priceRange ? filters.priceRange[1] : 5000}
            onChange={(e) => onFilterChange({ priceRange: [0, parseInt(e.target.value)] })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-orange-500) 0%, var(--color-orange-500) ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, var(--surface-2) ${((filters.priceRange ? filters.priceRange[1] : 5000) / 5000) * 100}%, var(--surface-2) 100%)`
            }}
          />
          <div className="flex justify-between text-xs mt-2">
            <span className="text-[var(--text-muted)] font-medium">{formatPrice(0)}</span>
            <span className="text-[var(--color-orange-500)] font-bold bg-[var(--color-orange-500)]/10 px-2 py-0.5 rounded-full">
              {filters.priceRange ? (filters.priceRange[1] >= 5000 ? formatPrice(5000) + '+' : formatPrice(filters.priceRange[1])) : formatPrice(5000) + '+'}
            </span>
          </div>
        </div>
      </div>

      {/* Transmission */}
      <div>
        <SectionTitle>{t('sf_transmission')}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {['Manual', 'Automatic'].map(type => (
            <button
              key={type}
              onClick={() => handleTransmissionToggle(type)}
              className={`${chipBase} ${(filters.transmission || []).includes(type) ? chipActive : chipInactive}`}
            >
              {transmissionLabels[type] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <SectionTitle>{t('sf_fuel_type')}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(fuel => (
            <button
              key={fuel}
              onClick={() => handleFuelTypeToggle(fuel)}
              className={`${chipBase} ${(filters.fuelType || []).includes(fuel) ? chipActive : chipInactive}`}
            >
              {fuelLabels[fuel] || fuel}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <SectionTitle>{t('sf_style')}</SectionTitle>
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
                    className={`${chipBase} ${(filters.style || []).includes(style) ? chipActive : chipInactive}`}
                  >
                    {styleLabels[style] || style}
                  </button>
                ))}
                <ExpandButton expanded={showAllStyles} onToggle={() => setShowAllStyles(!showAllStyles)} />
              </>
            );
          })()}
        </div>
      </div>

      {/* Brand */}
      <div>
        <SectionTitle>{t('sf_brand')}</SectionTitle>
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
                    className={`${chipBase} ${(filters.brand || []).includes(brand) ? chipActive : chipInactive}`}
                  >
                    {brand}
                  </button>
                ))}
                <ExpandButton expanded={showAllBrands} onToggle={() => setShowAllBrands(!showAllBrands)} />
              </>
            );
          })()}
        </div>
      </div>

      {/* Features */}
      <div>
        <SectionTitle>{t('sf_features')}</SectionTitle>
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
                    className={`${chipBase} ${(filters.features || []).includes(feature) ? chipActive : chipInactive}`}
                  >
                    {featureLabels[feature] || feature}
                  </button>
                ))}
                <ExpandButton expanded={showAllFeatures} onToggle={() => setShowAllFeatures(!showAllFeatures)} />
              </>
            );
          })()}
        </div>
      </div>

      {/* Seats */}
      <div>
        <SectionTitle>{t('sf_seats')}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {['2', '4', '5', '7', '8+'].map(seats => (
            <button
              key={seats}
              onClick={() => handleSeatsToggle(seats)}
              className={`${chipBase} ${(filters.seats || []).includes(seats) ? chipActive : chipInactive}`}
            >
              {seats}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Agency */}
      <div>
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => onFilterChange({ verified: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded-md bg-[var(--surface-2)] peer-checked:bg-[var(--color-orange-500)] transition-all duration-200" />
            <svg className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="ml-3 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-medium">{t('sf_verified_agencies')}</span>
        </label>
      </div>

      {/* Instant Booking */}
      <div>
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.instantBooking}
              onChange={(e) => onFilterChange({ instantBooking: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded-md bg-[var(--surface-2)] peer-checked:bg-[var(--color-orange-500)] transition-all duration-200" />
            <svg className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="ml-3 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-medium">{t('sf_instant_booking')}</span>
        </label>
      </div>
    </div>
  );
}
