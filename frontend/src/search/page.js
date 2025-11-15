'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SearchFilters, SearchResults, LoadingSkeleton, SearchForm, useSearch, useFavorites } from '@/features/search';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
      // If user is not authenticated, redirect to login
      if (error.message?.includes('authentication') || error.message?.includes('401')) {
        router.push('/auth/signin');
      }
    }
  };

  // Count active filters
  const activeFiltersCount = [
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Car
          </h1>
          <p className="text-gray-600">
            Discover amazing vehicles for your next adventure
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <SearchForm 
            onSearch={handleSearchFormSubmit}
            initialValues={{
              location: filters.location,
              pickupDate: filters.pickupDate,
              returnDate: filters.returnDate
            }}
          />
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Searching...' : `${filteredCars.length} car${filteredCars.length === 1 ? '' : 's'} found`}
            </h2>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />

          {/* Results */}
          <div className="lg:w-3/4">
            {loading ? (
              <LoadingSkeleton count={6} />
            ) : (
              <SearchResults
                filteredCars={filteredCars}
                onViewDetails={handleViewDetails}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                favoritesLoading={favoritesLoading}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return <SearchContent />;
}