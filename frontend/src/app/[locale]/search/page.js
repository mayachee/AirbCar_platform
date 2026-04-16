'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X, Car, MapPin, Zap, Shield, Clock, Star } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SearchFilters, SearchResults, LoadingSkeleton, SearchForm, useSearch, useFavorites } from '@/features/search';
import { Button } from '@/components/ui';
import { SelectField } from '@/components/ui/select-field';
import SearchPageSkeleton from './SearchPageSkeleton';

function SearchContent() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Calculate default dates
  const today = new Date();
  const next2Days = new Date(today);
  next2Days.setDate(today.getDate() + 2);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const defaultLocation = '';
  const defaultPickupDate = formatDate(today);
  const defaultReturnDate = formatDate(next2Days);

  // Initialize filters from URL params
  const initialFilters = {
    location: searchParams.get('location') || defaultLocation,
    pickupDate: searchParams.get('pickupDate') || defaultPickupDate,
    returnDate: searchParams.get('dropoffDate') || searchParams.get('returnDate') || defaultReturnDate,
    partnerId: searchParams.get('partner') || searchParams.get('partnerId'),
    priceRange: [0, 5000],
    transmission: [],
    fuelType: [],
    seats: [],
    style: [],
    brand: [],
    features: [],
    verified: false,
    instantBooking: false
  };

  const {
    vehicles: filteredCars,
    loading,
    filters,
    sortBy,
    updateFilters,
    setSortBy,
    clearFilters
  } = useSearch(initialFilters);

  // Ensure filteredCars is always an array
  const safeFilteredCars = Array.isArray(filteredCars) ? filteredCars : [];

  // Sync URL params with filters when URL changes
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

    if (Object.keys(newFilters).length > 0) {
      updateFilters(newFilters);
    }
  }, [searchParams, filters, updateFilters]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [filters, sortBy]);

  // Get currently visible cars
  const visibleCars = safeFilteredCars.slice(0, visibleCount);

  // Handle load more
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, safeFilteredCars.length));
  };

  // Use favorites hook
  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavorites();

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  // Handle search form submission
  const handleSearchFormSubmit = (formData) => {
    updateFilters({
      location: formData.location,
      pickupDate: formData.pickupDate,
      returnDate: formData.returnDate
    });

    const params = new URLSearchParams();
    if (formData.location) params.set('location', formData.location);
    if (formData.pickupDate) params.set('pickupDate', formData.pickupDate);
    if (formData.returnDate) params.set('returnDate', formData.returnDate);

    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : '/search';
    router.push(newUrl);
  };

  // Handle view details (redirect to car page with search params)
  const handleViewDetails = (car) => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.pickupDate) params.set('pickupDate', filters.pickupDate);
    if (filters.returnDate) params.set('returnDate', filters.returnDate);

    const queryString = params.toString();
    const url = `/car/${car.id}${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  // Handle favorite toggle with router redirect
  const handleToggleFavorite = async (carId) => {
    try {
      await toggleFavorite(carId);
    } catch (error) {
      if (error.message?.includes('authentication') || error.message?.includes('401')) {
        router.push('/auth/signin');
      }
    }
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [
    filters.location,
    filters.priceRange && filters.priceRange[1] < 5000,
    filters.transmission.length > 0,
    filters.fuelType.length > 0,
    filters.seats.length > 0,
    filters.style.length > 0,
    filters.brand.length > 0,
    filters.features.length > 0,
    filters.verified,
    filters.instantBooking
  ].filter(Boolean).length;
  }, [filters]);

  // Check if there are any search criteria
  const hasSearchCriteria = filters.location || filters.pickupDate || filters.returnDate;

  // Vehicle type quick-filter chips (from Stitch design)
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

  // Active type chip
  const activeTypeChip = filters.style?.length === 1 ? filters.style[0] : '';

  const handleTypeChipClick = (value) => {
    if (value === '') {
      handleFilterChange({ style: [] });
    } else {
      handleFilterChange({ style: [value] });
    }
  };

  // Features to show when no search results
  const features = useMemo(() => [
    { icon: Zap, title: t('feature_instant_booking'), description: t('feature_instant_booking_desc') },
    { icon: Shield, title: t('feature_verified_cars'), description: t('feature_verified_cars_desc') },
    { icon: Clock, title: t('feature_support'), description: t('feature_support_desc') },
    { icon: Star, title: t('feature_rated_drivers'), description: t('feature_rated_drivers_desc') }
  ], [t]);

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <Header />

      {/* Search Header — compact, editorial */}
      <section className="pt-28 pb-6 md:pt-32 md:pb-8 bg-[var(--surface-base)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Title row */}
            <div className="mb-6">
              <h1 className="headline-lg text-[var(--text-primary)]">
                {t('explore_fleet')}
              </h1>
              <p className="body-md text-[var(--text-secondary)] mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-none border-2 border-[var(--color-orange-500)] border-t-transparent animate-spin" />
                    {t('searching')}
                  </span>
                ) : safeFilteredCars.length > 0 ? (
                  <>
                    <span className="font-semibold text-[var(--color-orange-500)]">{safeFilteredCars.length}</span>{' '}
                    {t('vehicles_available').replace('{count}', '')}
                    {filters.location && (
                      <span className="text-[var(--text-muted)]">
                        {' '}&middot;{' '}{filters.location}
                      </span>
                    )}
                  </>
                ) : (
                  t('find_perfect_car')
                )}
              </p>
            </div>

            {/* Search Form */}
            <SearchForm
              onSearch={handleSearchFormSubmit}
              initialValues={{
                location: filters.location,
                pickupDate: filters.pickupDate,
                returnDate: filters.returnDate
              }}
            />
          </div>
        </div>
      </section>

      {/* Type chips + sort controls */}
      <div className="sticky top-16 z-30 bg-[var(--surface-base)] shadow-ambient-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Vehicle type chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {vehicleTypeChips.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => handleTypeChipClick(chip.value)}
                  className={`whitespace-nowrap px-4 py-2 rounded-none text-sm font-semibold transition-all duration-200 ${
                    (chip.value === '' && filters.style?.length === 0) || activeTypeChip === chip.value
                      ? 'bg-[var(--color-orange-500)] text-white shadow-ambient-sm'
                      : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sort + filter controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-none bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] text-sm font-medium transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters')}
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-none bg-[var(--color-orange-500)] text-white text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="label-xs text-[var(--text-muted)] hidden sm:inline">{t('sort_by')}</span>
                <SelectField
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'price_low', label: t('sort_price_low') },
                    { value: 'price_high', label: t('sort_price_high') },
                    { value: 'rating', label: t('sort_highest_rated') },
                    { value: 'newest', label: t('sort_newest') },
                  ]}
                  className="bg-[var(--surface-1)] text-sm font-semibold text-[var(--text-primary)] rounded-none px-3 py-2 focus:ring-1 focus:ring-[var(--color-orange-500)]/30 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {activeFiltersCount > 0 && (
        <div className="bg-[var(--surface-1)]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto py-3 flex flex-wrap items-center gap-2">
              <span className="label-xs text-[var(--text-muted)]">{t('active_filters')}</span>
              {filters.location && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-none bg-[var(--surface-container-lowest)] text-sm text-[var(--text-primary)] shadow-ambient-sm">
                  <MapPin className="h-3 w-3 mr-1.5 text-[var(--color-orange-500)]" />
                  {filters.location}
                  <button onClick={() => handleFilterChange({ location: '' })} className="ml-2 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.verified && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-none bg-[var(--surface-container-lowest)] text-sm text-[var(--text-primary)] shadow-ambient-sm">
                  <Shield className="h-3 w-3 mr-1.5 text-[var(--color-kc-tertiary)]" />
                  {t('sf_verified_agencies')}
                  <button onClick={() => handleFilterChange({ verified: false })} className="ml-2 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.instantBooking && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-none bg-[var(--surface-container-lowest)] text-sm text-[var(--text-primary)] shadow-ambient-sm">
                  <Zap className="h-3 w-3 mr-1.5 text-[var(--color-orange-500)]" />
                  {t('sf_instant_booking')}
                  <button onClick={() => handleFilterChange({ instantBooking: false })} className="ml-2 text-[var(--text-muted)] hover:text-[var(--color-kc-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-auto text-sm font-semibold text-[var(--color-orange-500)] hover:text-[var(--color-orange-600)] transition-colors"
              >
                {t('clear_all')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Mobile Overlay */}
      {showFiltersMobile && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowFiltersMobile(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-[var(--surface-base)] shadow-ambient-lg z-50 overflow-y-auto lg:hidden">
            <div className="p-5 flex items-center justify-between bg-[var(--surface-base)] sticky top-0 z-10 shadow-ambient-sm">
              <h3 className="title-lg text-[var(--text-primary)] flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[var(--color-orange-500)]" />
                {t('filters')}
              </h3>
              <button
                onClick={() => setShowFiltersMobile(false)}
                className="p-2 rounded-none hover:bg-[var(--surface-1)] transition-colors text-[var(--text-secondary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <SearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar — Desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-36">
                <div className="bg-[var(--surface-container-lowest)] rounded-none p-5 shadow-ambient">
                  <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="title-lg text-[var(--text-primary)] flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-[var(--color-orange-500)]" />
                      {t('filters')}
                    </h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="label-xs text-[var(--color-orange-500)] hover:text-[var(--color-orange-600)]"
                      >
                        {t('reset')}
                      </button>
                    )}
                  </div>
                  <SearchFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <LoadingSkeleton count={6} />
              ) : safeFilteredCars.length === 0 ? (
                <div className="space-y-10">
                  {/* Empty State */}
                  <div className="bg-[var(--surface-container-lowest)] rounded-none p-10 text-center shadow-ambient relative overflow-hidden">
                    {/* Subtle glow accent */}
                    <div className="glow-orange w-64 h-64 -bottom-20 -right-20 absolute" />

                    <div className="relative z-10">
                      {hasSearchCriteria ? (
                        <>
                          <div className="w-16 h-16 bg-[var(--surface-1)] rounded-none flex items-center justify-center mx-auto mb-5">
                            <Search className="h-8 w-8 text-[var(--color-orange-500)]" />
                          </div>
                          <h3 className="headline-md text-[var(--text-primary)] mb-2">{t('empty_heading')}</h3>
                          <p className="body-md text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                            {t('empty_description')}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              onClick={clearFilters}
                              className="px-6 py-2.5 rounded-none text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors"
                            >
                              {t('clear_all_filters')}
                            </button>
                            <button
                              onClick={() => router.push('/')}
                              className="btn-brand px-6 py-2.5 text-sm"
                            >
                              {t('start_new_search')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-[var(--surface-1)] rounded-none flex items-center justify-center mx-auto mb-5">
                            <Car className="h-8 w-8 text-[var(--color-kc-tertiary)]" />
                          </div>
                          <h3 className="headline-md text-[var(--text-primary)] mb-2">{t('start_heading')}</h3>
                          <p className="body-md text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                            {t('start_description')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features Section */}
                  {!hasSearchCriteria && (
                    <div>
                      <h3 className="title-lg text-[var(--text-primary)] mb-5">{t('why_choose')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature, index) => {
                          const Icon = feature.icon;
                          return (
                            <div
                              key={index}
                              className="bg-[var(--surface-container-lowest)] rounded-none p-5 shadow-ambient hover:shadow-ambient-lg transition-all duration-300 group hover:-translate-y-0.5"
                            >
                              <div className="w-10 h-10 bg-[var(--color-orange-500)]/10 rounded-none flex items-center justify-center mb-3 group-hover:bg-[var(--color-orange-500)]/15 transition-colors">
                                <Icon className="h-5 w-5 text-[var(--color-orange-500)]" />
                              </div>
                              <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1">{feature.title}</h4>
                              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{feature.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <SearchResults
                    filteredCars={visibleCars}
                    onViewDetails={handleViewDetails}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={isFavorite}
                    favoritesLoading={favoritesLoading}
                  />
                </div>
              )}

              {/* Results Footer */}
              {!loading && safeFilteredCars.length > 0 && (
                <div className="mt-10 pt-6 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <p className="body-md text-[var(--text-secondary)] mb-5">
                    {t('showing_results').replace('{visible}', Math.min(visibleCount, safeFilteredCars.length)).replace('{total}', safeFilteredCars.length)}
                  </p>

                  {visibleCount < safeFilteredCars.length && (
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 rounded-none bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--surface-2)] shadow-ambient-sm hover:shadow-ambient transition-all duration-300"
                    >
                      {t('load_more')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
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
