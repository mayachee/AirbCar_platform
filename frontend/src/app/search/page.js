'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Grid3x3, List, X, Filter, Car, MapPin, Calendar, TrendingUp, Shield, Clock, Star, Zap } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SearchFilters, SearchResults, LoadingSkeleton, SearchForm, useSearch, useFavorites } from '@/features/search';
import { Button } from '@/components/ui';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  // Initialize filters from URL params
  const initialFilters = {
    location: searchParams.get('location') || '',
    pickupDate: searchParams.get('pickupDate') || '',
    returnDate: searchParams.get('dropoffDate') || searchParams.get('returnDate') || '',
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

  // Use favorites hook
  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavorites();

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  // Handle search form submission
  const handleSearchFormSubmit = (formData) => {
    // Update filters state
    updateFilters({
      location: formData.location,
      pickupDate: formData.pickupDate,
      returnDate: formData.returnDate
    });
    
    // Also update URL to persist the search params
    const params = new URLSearchParams();
    if (formData.location) params.set('location', formData.location);
    if (formData.pickupDate) params.set('pickupDate', formData.pickupDate);
    if (formData.returnDate) params.set('returnDate', formData.returnDate);
    
    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : '/search';
    
    console.log('Updating search URL with params:', {
      location: formData.location,
      pickupDate: formData.pickupDate,
      returnDate: formData.returnDate,
      url: newUrl
    });
    
    router.push(newUrl);
  };

  // Handle view details (redirect to car page with search params)
  const handleViewDetails = (car) => {
    // Build URL with current search filters (dates, location)
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.pickupDate) params.set('pickupDate', filters.pickupDate);
    if (filters.returnDate) params.set('returnDate', filters.returnDate);
    
    const queryString = params.toString();
    const url = `/car/${car.id}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Navigating to car details with params:', {
      carId: car.id,
      location: filters.location,
      pickupDate: filters.pickupDate,
      returnDate: filters.returnDate,
      url
    });
    
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

  // Features to show when no search results
  const features = [
    { icon: Zap, title: 'Instant Booking', description: 'Book your car in seconds' },
    { icon: Shield, title: 'Verified Cars', description: 'All vehicles are verified' },
    { icon: Clock, title: '24/7 Support', description: 'Available anytime you need help' },
    { icon: Star, title: 'Rated Drivers', description: 'Trusted by thousands of users' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Bolt Style Enhanced */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-20 pb-32 sm:pt-28 sm:pb-40 overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Main Heading */}
            <div className="text-center mb-12">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight">
                Find your perfect car
          </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Request in seconds, book in minutes. Discover amazing vehicles for your next adventure.
          </p>
        </div>

            {/* Search Form - Ultra Modern */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-5xl mx-auto border border-gray-100">
          <SearchForm 
            onSearch={handleSearchFormSubmit}
            initialValues={{
              location: filters.location,
              pickupDate: filters.pickupDate,
              returnDate: filters.returnDate
            }}
          />
        </div>

            {/* Quick Stats */}
            {!loading && safeFilteredCars.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-base text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{safeFilteredCars.length}</div>
                    <div className="text-sm">available cars</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <main className="bg-white -mt-16 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Results Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2 leading-tight">
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-pulse">Searching...</span>
                  </span>
                ) : (
                  <>
                    {safeFilteredCars.length > 0 ? (
                      <>
                        <span className="text-orange-600">{safeFilteredCars.length}</span>{' '}
                        <span className="font-normal text-gray-700">car{safeFilteredCars.length === 1 ? '' : 's'} found</span>
                      </>
                    ) : hasSearchCriteria ? (
                      'No cars found'
                    ) : (
                      'Browse all cars'
                    )}
                  </>
                )}
              </h2>
              <p className="text-lg text-gray-500 mt-2">
                {hasSearchCriteria ? 'Matching your search criteria' : 'Discover your perfect ride'}
              </p>
              
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200">
                    <Filter className="h-4 w-4 mr-2" />
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="lg:hidden flex items-center gap-2 border-gray-300"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-semibold hidden sm:inline">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 font-medium shadow-sm"
            >
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 border-l border-gray-300 transition-all ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
          </div>
        </div>

          {/* Filters Mobile Overlay */}
          {showFiltersMobile && (
            <>
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                onClick={() => setShowFiltersMobile(false)}
              />
              <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto lg:hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50 sticky top-0">
                  <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFiltersMobile(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6">
                  <SearchFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </>
          )}

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-gray-900" />
                      Filters
                    </h3>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear all
                      </Button>
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
                <div className="space-y-6">
              <LoadingSkeleton count={6} />
                </div>
              ) : filteredCars.length === 0 ? (
                <div className="space-y-12">
                  {/* Empty State */}
                  <div className="bg-white rounded-3xl border-2 border-gray-100 p-16 text-center">
                    {hasSearchCriteria ? (
                      <>
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Search className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">No cars found</h3>
                        <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
                          We couldn't find any cars matching your search criteria. Try adjusting your filters or search for a different location.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            size="lg"
                            className="border-gray-300 px-8"
                          >
                            Clear all filters
                          </Button>
                          <Button
                            onClick={() => router.push('/')}
                            size="lg"
                            className="px-8"
                          >
                            Start new search
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Car className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Start your search</h3>
                        <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
                          Enter a location, pickup date, and return date above to find available cars in your area.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Features Section - Bolt Style */}
                  {!hasSearchCriteria && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why choose us</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                          const Icon = feature.icon;
                          return (
                            <div 
                              key={index}
                              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
                            >
                              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                                <Icon className="h-7 w-7 text-orange-600" />
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                              <p className="text-gray-600 text-sm">{feature.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
              <SearchResults
                filteredCars={safeFilteredCars}
                onViewDetails={handleViewDetails}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                favoritesLoading={favoritesLoading}
              />
                </div>
            )}
            </div>
          </div>

          {/* Results Footer */}
          {!loading && safeFilteredCars.length > 0 && safeFilteredCars.length >= 12 && (
            <div className="mt-16 pt-8 border-t border-gray-200 text-center">
              <p className="text-base text-gray-500">
                Showing <span className="font-bold text-gray-900">{safeFilteredCars.length}</span> results
                {safeFilteredCars.length >= 12 && '. Scroll to see more.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LoadingSkeleton count={6} />
        </main>
        <Footer />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
