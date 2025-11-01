// Format price for display
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'Price on request';
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) return 'Price on request';
  return `${numPrice} MAD`;
};

// Show price per day label
export const showPricePerDay = (price) => {
  const numPrice = Number(price);
  return (numPrice && numPrice > 0) ? 'per day' : '';
};

// Calculate rental duration
export const calculateDuration = (pickupDate, returnDate) => {
  if (!pickupDate || !returnDate) return 1;
  
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  
  // Calculate the difference in days
  const diffInMs = returnD.getTime() - pickup.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  // For same day rental (0 difference) or any fractional day, round up to at least 1
  return Math.max(1, Math.ceil(diffInDays));
};

// Calculate total price for a rental
export const calculateTotalPrice = (car, pickupDate, dropoffDate) => {
  if (!car || !pickupDate || !dropoffDate) return 0;
  
  const days = calculateDuration(pickupDate, dropoffDate);
  const dailyPrice = Number(car.price_per_day || 0);
  const rentalPrice = days * dailyPrice;
  
  return {
    days,
    dailyPrice,
    rentalPrice,
    totalPrice: rentalPrice
  };
};

// Build search params from filters
export const buildSearchParams = (filters) => {
  const params = new URLSearchParams();
  
  if (filters.location) params.set('location', filters.location);
  if (filters.pickupDate) params.set('pickupDate', filters.pickupDate);
  if (filters.returnDate) params.set('returnDate', filters.returnDate);
  
  return params.toString() ? `?${params.toString()}` : '';
};

// Parse search params from URL
export const parseSearchParams = (searchParams) => {
  return {
    location: searchParams.get('location') || '',
    pickupDate: searchParams.get('pickupDate') || '',
    returnDate: searchParams.get('dropoffDate') || searchParams.get('returnDate') || ''
  };
};

// Filter vehicles based on criteria
export const filterVehicles = (vehicles, filters) => {
  return vehicles.filter(car => {
    // Location filter
    const locationMatch = !filters.location || 
      car.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
      car.name?.toLowerCase().includes(filters.location.toLowerCase()) ||
      car.brand?.toLowerCase().includes(filters.location.toLowerCase());
    
    // Price filter
    const priceMatch = !filters.priceRange || (
      (car.price_per_day || 0) >= filters.priceRange[0] && 
      (filters.priceRange[1] >= 5000 ? true : (car.price_per_day || 0) <= filters.priceRange[1])
    );
    
    // Transmission filter
    const transmissionMatch = !filters.transmission?.length || 
      filters.transmission.includes(car.transmission);
    
    // Fuel type filter
    const fuelMatch = !filters.fuelType?.length || 
      filters.fuelType.includes(car.fuelType || car.fuel);
    
    // Seats filter
    const seatsMatch = !filters.seats?.length || 
      filters.seats.includes(car.seats.toString());
    
    // Style filter
    const styleMatch = !filters.style?.length || 
      filters.style.includes(car.style);
    
    // Brand filter
    const brandMatch = !filters.brand?.length || 
      filters.brand.includes(car.brand);
    
    // Features filter
    const featuresMatch = !filters.features?.length || 
      filters.features.every(feature => car.availableFeatures && car.availableFeatures.includes(feature));
    
    // Verified filter
    const verifiedMatch = !filters.verified || car.verified;
    
    return locationMatch && priceMatch && transmissionMatch && fuelMatch && 
           seatsMatch && styleMatch && brandMatch && featuresMatch && verifiedMatch;
  });
};

// Sort vehicles
export const sortVehicles = (vehicles, sortBy) => {
  const sorted = [...vehicles];
  
  switch (sortBy) {
    case 'price_low':
      if (sorted.length > 0 && sorted[0].totalPrice) {
        sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
      } else {
        sorted.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0));
      }
      break;
    case 'price_high':
      if (sorted.length > 0 && sorted[0].totalPrice) {
        sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
      } else {
        sorted.sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0));
      }
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      break;
    default:
      // Keep original order for relevance
      break;
  }
  
  return sorted;
};
