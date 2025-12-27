'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, SlidersHorizontal, Grid3x3, List, X, Filter, Car, MapPin, Calendar, TrendingUp, Shield, Clock, Star, Zap } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SearchFilters, SearchResults, LoadingSkeleton, SearchForm, useSearch, useFavorites } from '@/features/search';
import { Button } from '@/components/ui';
import { SelectField } from '@/components/ui/select-field';
import SearchPageSkeleton from './SearchPageSkeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Scroll animations for hero text
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const heroFilter = useTransform(scrollY, [0, 300], ["blur(0px)", "blur(8px)"]);
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);
  
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
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      {/* Hero Section - Modern & Stylish */}
      <section className="relative text-white pt-32 pb-12 md:pt-60 md:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="max-w-5xl mx-auto relative z-20">
            <motion.div 
              style={{ 
                opacity: heroOpacity,
                scale: heroScale,
                filter: heroFilter,
                y: heroY
              }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center -z-10 select-none pointer-events-none"
            >
              <div className="relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
                 <h1 className="relative flex flex-col items-center justify-center">
                    <span className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter uppercase drop-shadow-sm">
                      Find your
                    </span>
                    <span className="text-5xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 tracking-tighter uppercase drop-shadow-lg mt-[-10px] sm:mt-[-20px]">
                      Perfect Car
                    </span>
                 </h1>
              </div>
            </motion.div>

            {/* Search Form Container */}
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

      {/* Main Content Section */}
      <main className="min-h-screen relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Results Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <>
                      {safeFilteredCars.length > 0 ? (
                        <>
                          <span className="text-orange-500">{safeFilteredCars.length}</span>{' '}
                          <span className="text-white">vehicles available</span>
                        </>
                      ) : hasSearchCriteria ? (
                        'No vehicles found'
                      ) : (
                        'Browse all vehicles'
                      )}
                    </>
                  )}
                </h2>
                <p className="text-gray-400 mt-2 flex items-center gap-2">
                  {hasSearchCriteria ? (
                    <>
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Matching your search criteria
                    </>
                  ) : (
                    'Find the perfect car for your next adventure'
                  )}
                </p>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className="lg:hidden flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
            
                {/* Sort Options */}
                <div className="flex items-center gap-2 px-2">
                  <span className="text-sm text-gray-400 font-medium hidden sm:inline">Sort by:</span>
                  <SelectField
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                      { value: 'price_low', label: 'Price: Low to High' },
                      { value: 'price_high', label: 'Price: High to Low' },
                      { value: 'rating', label: 'Highest Rated' },
                      { value: 'newest', label: 'Newest First' },
                    ]}
                    className="border-none bg-transparent text-sm font-semibold text-white focus:ring-0 cursor-pointer py-1 pr-8 pl-2"
                    contentProps={{
                      className: "bg-[#0F172A] border-white/10 text-white"
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Active Filters Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <span className="text-sm font-medium text-gray-400">Active filters:</span>
                {filters.location && (
                  <span className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/10 rounded-full text-sm text-white shadow-sm backdrop-blur-sm">
                    <MapPin className="h-3 w-3 mr-1.5 text-orange-400" />
                    {filters.location}
                    <button onClick={() => handleFilterChange({ location: '' })} className="ml-2 hover:text-red-400 text-gray-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {/* Add more filter tags here if needed */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 font-medium text-sm ml-auto"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Filters Mobile Overlay */}
          {showFiltersMobile && (
            <>
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                onClick={() => setShowFiltersMobile(false)}
              />
              <div className="fixed inset-y-0 left-0 w-80 bg-[#0F172A] shadow-2xl z-50 overflow-y-auto lg:hidden border-r border-white/10">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0F172A] sticky top-0 z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                    Filters
                  </h3>
                  <button
                    onClick={() => setShowFiltersMobile(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
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
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                      Filters
                    </h3>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs text-gray-400 hover:text-white h-auto py-1 px-2"
                      >
                        Reset
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
                  {/* Empty State - Modern */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-sm relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl opacity-50" />
                    
                    <div className="relative z-10">
                      {hasSearchCriteria ? (
                        <>
                          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-sm backdrop-blur-md">
                            <Search className="h-10 w-10 text-orange-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">No vehicles found</h3>
                          <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            We couldn't find any cars matching your specific criteria. Try adjusting your filters or search for a different location.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                              variant="outline"
                              onClick={clearFilters}
                              className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                            >
                              Clear all filters
                            </Button>
                            <Button
                              onClick={() => router.push('/')}
                              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                            >
                              Start new search
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3 shadow-sm backdrop-blur-md">
                            <Car className="h-10 w-10 text-blue-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">Start your search</h3>
                          <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Enter a location, pickup date, and return date above to find available cars in your area.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features Section - Modern Cards */}
                  {!hasSearchCriteria && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-6">Why choose AirbCar</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature, index) => {
                          const Icon = feature.icon;
                          return (
                            <div 
                              key={index}
                              className="bg-white/5 rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-sm"
                            >
                              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                                <Icon className="h-5 w-5 text-orange-400" />
                              </div>
                              <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
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
                filteredCars={visibleCars}
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
          {!loading && safeFilteredCars.length > 0 && (
            <div className="mt-16 pt-8 border-t border-white/10 text-center">
              <p className="text-base text-gray-400 mb-6">
                Showing <span className="font-bold text-white">{Math.min(visibleCount, safeFilteredCars.length)}</span> of <span className="font-bold text-white">{safeFilteredCars.length}</span> results
              </p>
              
              {visibleCount < safeFilteredCars.length && (
                <Button
                  onClick={handleLoadMore}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-2 rounded-xl text-lg font-medium transition-all duration-300 hover:scale-105"
                >
                  Load More Vehicles
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Smooth transition to footer */}
      <div className="h-24 bg-gradient-to-b from-[#0F172A] to-[#0B0F19]" />

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
