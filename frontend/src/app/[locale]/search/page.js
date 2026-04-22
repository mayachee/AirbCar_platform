'use client';

import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  X,
  Car,
  MapPin,
  Zap,
  Shield,
  Clock,
  Star,
  Map as MapIcon,
  List as ListIcon,
  ChevronDown,
  Heart,
  Users,
  Fuel,
  Settings2,
  Plus,
  Minus,
  Navigation,
} from 'lucide-react';
import { SearchFilters, useSearch, useFavorites } from '@/features/search';
import { SelectField } from '@/components/ui/select-field';
import { APP_NAME, MOROCCAN_CITIES } from '@/constants';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getVehicleImageUrl } from '@/utils/imageUtils';
import SearchPageSkeleton from './SearchPageSkeleton';

/* ----------------------------------------------------------------
   Compact search pill — fits inside the top bar (h-16)
   ---------------------------------------------------------------- */
function CompactSearchBar({ initialValues = {}, onSearch }) {
  const t = useTranslations('search');

  const pad2 = (n) => String(n).padStart(2, '0');
  const dateToYmd = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [location, setLocation] = useState(initialValues.location || '');
  const [pickupDate, setPickupDate] = useState(
    initialValues.pickupDate || dateToYmd(today)
  );
  const [returnDate, setReturnDate] = useState(
    initialValues.returnDate || dateToYmd(tomorrow)
  );

  useEffect(() => {
    if (initialValues.location !== undefined) setLocation(initialValues.location || '');
    if (initialValues.pickupDate) setPickupDate(initialValues.pickupDate);
    if (initialValues.returnDate) setReturnDate(initialValues.returnDate);
  }, [initialValues.location, initialValues.pickupDate, initialValues.returnDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ location: location.trim(), pickupDate, returnDate });
  };

  const handlePickupChange = (e) => {
    const next = e.target.value;
    setPickupDate(next);
    if (next && returnDate && returnDate <= next) {
      const d = new Date(next);
      d.setDate(d.getDate() + 1);
      setReturnDate(dateToYmd(d));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center w-full h-11 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors shadow-ambient-sm overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <label className="flex items-center gap-2 pl-4 pr-2 h-full min-w-0 flex-1">
        <MapPin className="w-4 h-4 text-[var(--color-orange-500)] flex-shrink-0" />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer w-full min-w-0 truncate"
          aria-label={t('sf_pickup_location')}
        >
          <option value="">{t('sf_select_city')}</option>
          {MOROCCAN_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <div className="h-6 w-px bg-[var(--border-subtle)]" />

      <label className="hidden md:flex items-center gap-1.5 px-3 h-full">
        <input
          type="date"
          value={pickupDate}
          onChange={handlePickupChange}
          min={dateToYmd(today)}
          className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
          aria-label={t('sf_pickup_date')}
        />
      </label>

      <div className="hidden md:block h-6 w-px bg-[var(--border-subtle)]" />

      <label className="hidden md:flex items-center gap-1.5 px-3 h-full">
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          min={pickupDate || dateToYmd(tomorrow)}
          className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
          aria-label={t('sf_return_date')}
        />
      </label>

      <button
        type="submit"
        className="h-full px-4 flex items-center gap-1.5 bg-[var(--color-orange-500)] hover:bg-[var(--color-orange-600)] text-white text-xs font-bold transition-colors"
        aria-label={t('sf_search_cars')}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">{t('sf_search_cars')}</span>
      </button>
    </form>
  );
}

/* ----------------------------------------------------------------
   Compact horizontal vehicle card — tuned for the narrow list lane
   ---------------------------------------------------------------- */
function HorizontalVehicleCard({
  car,
  isActive,
  isFavorite,
  favoritesLoading,
  onHover,
  onLeave,
  onSelect,
  onToggleFavorite,
}) {
  const t = useTranslations('search');
  const { formatPrice } = useCurrency();
  const imageUrl = getVehicleImageUrl(car);
  const rating = car.rating || 0;

  return (
    <article
      onMouseEnter={() => onHover?.(car.id)}
      onMouseLeave={() => onLeave?.(car.id)}
      onClick={() => onSelect?.(car)}
      className={`group relative cursor-pointer bg-[var(--surface-container-lowest)] rounded-2xl overflow-hidden transition-all duration-200 ${
        isActive
          ? 'ring-2 ring-[var(--color-orange-500)] shadow-ambient-lg -translate-y-0.5'
          : 'shadow-ambient hover:shadow-ambient-lg'
      }`}
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-[42%] aspect-[4/3] flex-shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={car.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              if (e.target.src !== '/carsymbol.jpg') e.target.src = '/carsymbol.jpg';
            }}
          />
          {/* subtle gradient for legibility of badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Verified badge */}
          {car.verified && (
            <span className="absolute top-2 left-2 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-kc-tertiary)]/95 backdrop-blur-sm text-white">
              <Shield className="w-3 h-3 mr-0.5" />
              {t('verified_agency')}
            </span>
          )}

          {/* Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(car.id);
            }}
            disabled={favoritesLoading}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-[var(--color-kc-error)]/95 text-white'
                : 'bg-black/35 text-white/90 hover:bg-black/55'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          {/* Instant */}
          {car.instant_booking && (
            <span className="absolute bottom-2 left-2 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-orange-500)]/95 backdrop-blur-sm text-white">
              <Zap className="w-3 h-3 mr-0.5" />
              {t('instant_booking')}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight truncate">
                {car.name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0 text-xs">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-[var(--text-primary)]">{rating.toFixed(1)}</span>
                <span className="text-[var(--text-muted)] text-[10px]">({car.reviews || 0})</span>
              </div>
            </div>

            <div className="flex items-center text-[var(--text-secondary)] text-xs mb-3 min-w-0">
              <MapPin className="w-3 h-3 mr-1 text-[var(--text-muted)] flex-shrink-0" />
              <span className="truncate">{car.location}</span>
            </div>

            {/* Specs */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {car.seats}
              </span>
              <span className="inline-flex items-center gap-1">
                <Settings2 className="w-3 h-3" />
                <span className="truncate max-w-[55px]">{car.transmission}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Fuel className="w-3 h-3" />
                <span className="truncate max-w-[55px]">{car.fuel}</span>
              </span>
            </div>
          </div>

          {/* Price row */}
          <div className="flex items-end justify-between pt-3 mt-3" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
            <div className="min-w-0">
              {car.totalPrice ? (
                <>
                  <p className="text-lg font-black text-[var(--text-primary)] leading-none">
                    {formatPrice(car.totalPrice)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                    {car.rentalDuration} {t(car.rentalDuration > 1 ? 'days' : 'day')} &middot;{' '}
                    {formatPrice(car.price_per_day)}
                    {t('per_day')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-[var(--text-primary)] leading-none">
                    {formatPrice(car.price_per_day)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">{t('per_day').replace(/^\//, '')}</p>
                </>
              )}
            </div>
            <span className="text-[11px] font-bold text-[var(--color-orange-500)] group-hover:underline">
              {t('view_details')} →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------
   Main search content
   ---------------------------------------------------------------- */
function SearchContent() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'
  const [hoveredCarId, setHoveredCarId] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(null);

  const listRef = useRef(null);

  // Default dates
  const today = new Date();
  const next2Days = new Date(today);
  next2Days.setDate(today.getDate() + 2);

  const formatDateFn = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const defaultPickupDate = formatDateFn(today);
  const defaultReturnDate = formatDateFn(next2Days);

  const initialFilters = {
    location: searchParams.get('location') || '',
    pickupDate: searchParams.get('pickupDate') || defaultPickupDate,
    returnDate:
      searchParams.get('dropoffDate') || searchParams.get('returnDate') || defaultReturnDate,
    partnerId: searchParams.get('partner') || searchParams.get('partnerId'),
    priceRange: [0, 5000],
    transmission: [],
    fuelType: [],
    seats: [],
    style: [],
    brand: [],
    features: [],
    verified: false,
    instantBooking: false,
  };

  const {
    vehicles: filteredCars,
    loading,
    filters,
    sortBy,
    updateFilters,
    setSortBy,
    clearFilters,
  } = useSearch(initialFilters);

  const safeFilteredCars = Array.isArray(filteredCars) ? filteredCars : [];

  // Sync URL → filters
  useEffect(() => {
    const newFilters = {};
    const locationFromUrl = searchParams.get('location');
    const pickupDateFromUrl = searchParams.get('pickupDate');
    const returnDateFromUrl = searchParams.get('dropoffDate') || searchParams.get('returnDate');

    if (locationFromUrl !== null && locationFromUrl !== filters.location) {
      newFilters.location = locationFromUrl;
    }
    if (pickupDateFromUrl !== null && pickupDateFromUrl !== filters.pickupDate) {
      newFilters.pickupDate = pickupDateFromUrl;
    }
    if (returnDateFromUrl !== null && returnDateFromUrl !== filters.returnDate) {
      newFilters.returnDate = returnDateFromUrl;
    }
    if (Object.keys(newFilters).length > 0) updateFilters(newFilters);
  }, [searchParams, filters, updateFilters]);

  useEffect(() => {
    setVisibleCount(12);
  }, [filters, sortBy]);

  const visibleCars = safeFilteredCars.slice(0, visibleCount);
  const handleLoadMore = () =>
    setVisibleCount((prev) => Math.min(prev + 12, safeFilteredCars.length));

  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavorites();

  const handleFilterChange = (newFilters) => updateFilters(newFilters);

  const handleSearchFormSubmit = (formData) => {
    updateFilters({
      location: formData.location,
      pickupDate: formData.pickupDate,
      returnDate: formData.returnDate,
    });
    const params = new URLSearchParams();
    if (formData.location) params.set('location', formData.location);
    if (formData.pickupDate) params.set('pickupDate', formData.pickupDate);
    if (formData.returnDate) params.set('returnDate', formData.returnDate);
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : '/search');
  };

  const handleViewDetails = (car) => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.pickupDate) params.set('pickupDate', filters.pickupDate);
    if (filters.returnDate) params.set('returnDate', filters.returnDate);
    const qs = params.toString();
    router.push(`/car/${car.id}${qs ? `?${qs}` : ''}`);
  };

  const handleToggleFavorite = async (carId) => {
    try {
      await toggleFavorite(carId);
    } catch (error) {
      if (error.message?.includes('authentication') || error.message?.includes('401')) {
        router.push('/auth/signin');
      }
    }
  };

  const activeFiltersCount = useMemo(
    () =>
      [
        filters.location,
        filters.priceRange && filters.priceRange[1] < 5000,
        filters.transmission.length > 0,
        filters.fuelType.length > 0,
        filters.seats.length > 0,
        filters.style.length > 0,
        filters.brand.length > 0,
        filters.features.length > 0,
        filters.verified,
        filters.instantBooking,
      ].filter(Boolean).length,
    [filters]
  );

  const hasSearchCriteria = filters.location || filters.pickupDate || filters.returnDate;

  const vehicleTypeChips = [
    { value: '', label: t('car_type_all') },
    { value: 'Sedan', label: t('sf_sedan') },
    { value: 'SUV', label: t('sf_suv') },
    { value: 'Convertible', label: t('sf_convertible') },
    { value: 'City', label: t('sf_city') },
    { value: '4x4', label: t('sf_4x4') },
    { value: 'Coupe', label: t('sf_coupe') },
    { value: 'Family', label: t('sf_family') },
  ];

  const activeTypeChip = filters.style?.length === 1 ? filters.style[0] : '';

  const handleTypeChipClick = (value) => {
    handleFilterChange({ style: value === '' ? [] : [value] });
  };

  const features = useMemo(
    () => [
      { icon: Zap, title: t('feature_instant_booking'), description: t('feature_instant_booking_desc') },
      { icon: Shield, title: t('feature_verified_cars'), description: t('feature_verified_cars_desc') },
      { icon: Clock, title: t('feature_support'), description: t('feature_support_desc') },
      { icon: Star, title: t('feature_rated_drivers'), description: t('feature_rated_drivers_desc') },
    ],
    [t]
  );

  // Deterministic pseudo-position for mock pins (stable across renders for same id)
  const pinPosition = (car, i) => {
    const id = String(car.id ?? i);
    let h = 0;
    for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
    const left = 10 + (h % 76);
    const top = 8 + ((h >> 8) % 78);
    return { left: `${left}%`, top: `${top}%` };
  };

  const selectedCar = useMemo(
    () => visibleCars.find((c) => c.id === selectedCarId) || null,
    [visibleCars, selectedCarId]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface-base)]">
      {/* ===== TOP BAR ===== */}
      <header
        className="flex-shrink-0 bg-[var(--surface-container-lowest)] shadow-ambient-sm z-40"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 mr-1">
            <div className="w-8 h-8 bg-[var(--color-orange-500)] rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline font-bold text-lg text-[var(--text-primary)]">
              {APP_NAME}
            </span>
          </Link>

          <div className="flex-1 max-w-3xl">
            <CompactSearchBar
              onSearch={handleSearchFormSubmit}
              initialValues={{
                location: filters.location,
                pickupDate: filters.pickupDate,
                returnDate: filters.returnDate,
              }}
            />
          </div>
        </div>
      </header>

      {/* ===== FILTER RAIL ===== */}
      <div
        className="flex-shrink-0 bg-[var(--surface-base)] z-30 shadow-ambient-sm"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {vehicleTypeChips.map((chip) => {
              const active =
                (chip.value === '' && filters.style?.length === 0) || activeTypeChip === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => handleTypeChipClick(chip.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-[var(--text-primary)] text-[var(--surface-base)] shadow-ambient-sm'
                      : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}

            <div className="w-px h-5 bg-[var(--border-subtle)] flex-shrink-0 mx-1" />

            <div className="relative">
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeFiltersCount > 0
                    ? 'bg-[var(--color-orange-500)]/10 text-[var(--color-orange-500)] ring-1 ring-[var(--color-orange-500)]/30'
                    : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('filters')}
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-orange-500)] text-white text-[9px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showFiltersDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFiltersDropdown(false)} />
                  <div
                    className="absolute top-full left-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[var(--surface-container-lowest)] rounded-2xl shadow-ambient-lg z-50 p-5"
                    style={{ border: '1px solid var(--border-subtle)' }}
                  >
                    <div
                      className="flex items-center justify-between mb-4 pb-3"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-[var(--color-orange-500)]" />
                        {t('filters')}
                      </h3>
                      <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="text-xs font-semibold text-[var(--color-orange-500)] hover:text-[var(--color-orange-600)]"
                          >
                            {t('reset')}
                          </button>
                        )}
                        <button
                          onClick={() => setShowFiltersDropdown(false)}
                          className="p-1 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-muted)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <SearchFilters filters={filters} onFilterChange={handleFilterChange} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {!loading && safeFilteredCars.length > 0 && (
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                <span className="font-bold text-[var(--text-primary)]">
                  {safeFilteredCars.length}
                </span>{' '}
                {t('vehicles_available').replace('{count}', '')}
                {filters.location && (
                  <span className="text-[var(--text-muted)]"> · {filters.location}</span>
                )}
              </span>
            )}

            <SelectField
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'price_low', label: t('sort_price_low') },
                { value: 'price_high', label: t('sort_price_high') },
                { value: 'rating', label: t('sort_highest_rated') },
                { value: 'newest', label: t('sort_newest') },
              ]}
              className="bg-[var(--surface-1)] text-xs font-semibold text-[var(--text-primary)] rounded-full px-3 py-1.5 focus:ring-1 focus:ring-[var(--color-orange-500)]/30 cursor-pointer"
            />
          </div>
        </div>

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <div className="px-4 sm:px-6 pb-2.5 flex flex-wrap items-center gap-1.5">
            {filters.location && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-xs text-[var(--text-primary)]">
                <MapPin className="h-3 w-3 mr-1 text-[var(--color-orange-500)]" />
                {filters.location}
                <button
                  onClick={() => handleFilterChange({ location: '' })}
                  className="ml-1.5 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.verified && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-xs text-[var(--text-primary)]">
                <Shield className="h-3 w-3 mr-1 text-[var(--color-kc-tertiary)]" />
                {t('sf_verified_agencies')}
                <button
                  onClick={() => handleFilterChange({ verified: false })}
                  className="ml-1.5 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.instantBooking && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-xs text-[var(--text-primary)]">
                <Zap className="h-3 w-3 mr-1 text-[var(--color-orange-500)]" />
                {t('sf_instant_booking')}
                <button
                  onClick={() => handleFilterChange({ instantBooking: false })}
                  className="ml-1.5 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-[var(--color-orange-500)] hover:text-[var(--color-orange-600)] ml-1"
            >
              {t('clear_all')}
            </button>
          </div>
        )}
      </div>

      {/* ===== SPLIT MAIN ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Vehicle List */}
        <div
          ref={listRef}
          className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/2 lg:w-[46%] xl:w-[42%] overflow-y-auto`}
        >
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-container-lowest)] rounded-2xl overflow-hidden shadow-ambient animate-pulse flex"
                >
                  <div className="w-[42%] aspect-[4/3] bg-[var(--surface-2)]" />
                  <div className="flex-1 p-4 space-y-2.5">
                    <div className="h-4 bg-[var(--surface-2)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--surface-1)] rounded w-1/2" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                      <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                      <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                    </div>
                    <div className="flex justify-between items-end pt-3">
                      <div className="h-5 w-20 bg-[var(--surface-2)] rounded" />
                      <div className="h-4 w-16 bg-[var(--color-orange-500)]/20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : safeFilteredCars.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                {hasSearchCriteria ? (
                  <>
                    <div className="w-16 h-16 bg-[var(--surface-1)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Search className="h-8 w-8 text-[var(--color-orange-500)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      {t('empty_heading')}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">{t('empty_description')}</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={clearFilters}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors"
                      >
                        {t('clear_all_filters')}
                      </button>
                      <button onClick={() => router.push('/')} className="btn-brand px-5 py-2 text-sm">
                        {t('start_new_search')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-[var(--surface-1)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Car className="h-8 w-8 text-[var(--color-kc-tertiary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      {t('start_heading')}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">{t('start_description')}</p>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={index} className="bg-[var(--surface-1)] rounded-xl p-3">
                            <Icon className="h-4 w-4 text-[var(--color-orange-500)] mb-1.5" />
                            <h4 className="font-semibold text-[var(--text-primary)] text-xs mb-0.5">
                              {feature.title}
                            </h4>
                            <p className="text-[var(--text-muted)] text-[10px] leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {visibleCars.map((car) => (
                <HorizontalVehicleCard
                  key={car.id}
                  car={car}
                  isActive={hoveredCarId === car.id || selectedCarId === car.id}
                  isFavorite={isFavorite(car.id)}
                  favoritesLoading={favoritesLoading}
                  onHover={setHoveredCarId}
                  onLeave={(id) => setHoveredCarId((current) => (current === id ? null : current))}
                  onSelect={handleViewDetails}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}

              {visibleCount < safeFilteredCars.length && (
                <div className="py-6 text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    {t('showing_results')
                      .replace('{visible}', Math.min(visibleCount, safeFilteredCars.length))
                      .replace('{total}', safeFilteredCars.length)}
                  </p>
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--surface-2)] shadow-ambient-sm hover:shadow-ambient transition-all duration-200"
                  >
                    {t('load_more')}
                  </button>
                </div>
              )}

              <div className="h-20 md:hidden" />
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div
          className={`${mobileView === 'map' ? 'flex' : 'hidden'} md:flex flex-col flex-1 relative`}
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          {/* Map canvas */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-[var(--surface-base)] to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 overflow-hidden">
            {/* Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(18,28,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(18,28,42,0.04) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            {/* Road curves */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.08]"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M 0 25 Q 25 20 50 30 T 100 35"
                stroke="currentColor"
                strokeWidth="0.4"
                fill="none"
              />
              <path
                d="M 0 65 Q 35 55 60 70 T 100 60"
                stroke="currentColor"
                strokeWidth="0.3"
                fill="none"
              />
              <path
                d="M 30 0 Q 35 35 45 60 T 50 100"
                stroke="currentColor"
                strokeWidth="0.3"
                fill="none"
              />
              <path
                d="M 70 0 Q 65 30 75 55 T 80 100"
                stroke="currentColor"
                strokeWidth="0.4"
                fill="none"
              />
            </svg>

            {/* Water-like blob */}
            <div
              className="absolute rounded-full opacity-30"
              style={{
                left: '55%',
                top: '15%',
                width: '38%',
                height: '30%',
                background:
                  'radial-gradient(circle at 30% 30%, rgba(55,171,158,0.35), transparent 70%)',
              }}
            />
            <div
              className="absolute rounded-full opacity-25"
              style={{
                left: '5%',
                top: '55%',
                width: '28%',
                height: '24%',
                background:
                  'radial-gradient(circle at 40% 40%, rgba(55,171,158,0.35), transparent 70%)',
              }}
            />
          </div>

          {/* Price pins */}
          {!loading &&
            visibleCars.map((car, i) => {
              const pos = pinPosition(car, i);
              const isActive = hoveredCarId === car.id || selectedCarId === car.id;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => setSelectedCarId(car.id)}
                  onMouseEnter={() => setHoveredCarId(car.id)}
                  onMouseLeave={() =>
                    setHoveredCarId((current) => (current === car.id ? null : current))
                  }
                  className="absolute group -translate-x-1/2 -translate-y-full focus:outline-none"
                  style={{ left: pos.left, top: pos.top, zIndex: isActive ? 20 : 10 }}
                >
                  <div
                    className={`relative flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold shadow-ambient whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--text-primary)] text-white scale-110 shadow-ambient-lg'
                        : 'bg-[var(--surface-container-lowest)] text-[var(--text-primary)] hover:bg-[var(--color-orange-500)] hover:text-white'
                    }`}
                  >
                    {formatPrice(car.price_per_day)}
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 transition-colors ${
                        isActive
                          ? 'bg-[var(--text-primary)]'
                          : 'bg-[var(--surface-container-lowest)] group-hover:bg-[var(--color-orange-500)]'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

          {/* Top-left overlay — summary chip */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-container-lowest)]/95 backdrop-blur-sm shadow-ambient-sm text-xs font-semibold text-[var(--text-primary)]"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--color-orange-500)]" />
              {filters.location || 'All areas'}
              <span className="text-[var(--text-muted)] font-normal">·</span>
              <span className="text-[var(--color-orange-500)]">{visibleCars.length}</span>
            </div>
          </div>

          {/* Top-right controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <div
              className="flex flex-col rounded-xl overflow-hidden bg-[var(--surface-container-lowest)]/95 backdrop-blur-sm shadow-ambient-sm"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <button
                className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
                aria-label="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="h-px bg-[var(--border-subtle)]" />
              <button
                className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
                aria-label="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--surface-container-lowest)]/95 backdrop-blur-sm shadow-ambient-sm text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
              style={{ border: '1px solid var(--border-subtle)' }}
              aria-label="Recenter"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-left hint */}
          <div
            className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-[var(--surface-container-lowest)]/80 backdrop-blur-sm text-[11px] text-[var(--text-muted)] shadow-ambient-sm z-10"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <MapIcon className="w-3 h-3" />
            Interactive map coming soon
          </div>

          {/* Selected pin preview */}
          {selectedCar && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(92%,360px)] z-30">
              <div
                className="relative bg-[var(--surface-container-lowest)] rounded-2xl shadow-ambient-lg overflow-hidden"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <button
                  onClick={() => setSelectedCarId(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                  aria-label="Close preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex">
                  <div className="w-28 h-28 flex-shrink-0 relative">
                    <img
                      src={getVehicleImageUrl(selectedCar)}
                      alt={selectedCar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (e.target.src !== '/carsymbol.jpg') e.target.src = '/carsymbol.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {selectedCar.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{(selectedCar.rating || 0).toFixed(1)}</span>
                      <span className="text-[var(--text-muted)]">({selectedCar.reviews || 0})</span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="truncate">{selectedCar.location}</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-base font-black text-[var(--text-primary)] leading-none">
                          {formatPrice(selectedCar.price_per_day)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{t('per_day')}</p>
                      </div>
                      <button
                        onClick={() => handleViewDetails(selectedCar)}
                        className="btn-brand px-3.5 py-1.5 text-[11px]"
                      >
                        {t('view_details')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MOBILE FLOATING TOGGLE ===== */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--text-primary)] text-[var(--surface-base)] rounded-full shadow-ambient-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {mobileView === 'list' ? (
            <>
              <MapIcon className="w-4 h-4" />
              Map
              {safeFilteredCars.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-orange-500)] text-white text-[10px] font-bold">
                  {safeFilteredCars.length}
                </span>
              )}
            </>
          ) : (
            <>
              <ListIcon className="w-4 h-4" />
              List
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
