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
  // Advanced algorithmic multi-term tokenization
  const searchTerms = filters.location
    ? filters.location.toLowerCase().trim().split(/\s+/)
    : [];

  return vehicles.map(car => {
    let relevanceScore = 0;
    
    // 1. Better Location / Text Matching (Requires all terms to exist somewhere for higher relevance)
    let locationMatch = true;
    
    if (searchTerms.length > 0) {
      let matchedTermsCount = 0;
      
      const carLocation = car.location?.toLowerCase() || '';
      const carName = car.name?.toLowerCase() || '';
      const carBrand = car.brand?.toLowerCase() || '';
      const carModel = car.model?.toLowerCase() || '';
      const carPartner = car.partner?.business_name?.toLowerCase() || car.partner_name?.toLowerCase() || '';

      for (const term of searchTerms) {
        const inLocation = carLocation.includes(term);
        const inName = carName.includes(term);
        const inBrand = carBrand.includes(term);
        const inModel = carModel.includes(term);
        const inPartner = carPartner.includes(term);

        if (inLocation || inName || inBrand || inModel || inPartner) {
          matchedTermsCount++;
          // Scoring algorithm based on data proximity
          if (carBrand === term) relevanceScore += 4;
          else if (inBrand) relevanceScore += 2;
          
          if (carModel === term) relevanceScore += 4;
          else if (inModel) relevanceScore += 2;
          
          if (inName) relevanceScore += 2;
          
          if (carLocation === term) relevanceScore += 3;
          else if (inLocation) relevanceScore += 1;
          
          if (inPartner) relevanceScore += 1;
        }
      }

      // Must match all tokens exactly like Google Search
      if (matchedTermsCount !== searchTerms.length) {
        locationMatch = false;
      }
    }

    // Exact matches remaining logic
    const priceMatch = !filters.priceRange || (
      (car.price_per_day || 0) >= filters.priceRange[0] &&
      (filters.priceRange[1] >= 5000 ? true : (car.price_per_day || 0) <= filters.priceRange[1])
    );

    const transmissionMatch = !filters.transmission?.length || filters.transmission.includes(car.transmission);
    const fuelMatch = !filters.fuelType?.length || filters.fuelType.includes(car.fuelType || car.fuel);
    const seatsMatch = !filters.seats?.length || filters.seats.includes(car.seats?.toString() || '');
    const styleMatch = !filters.style?.length || filters.style.includes(car.style);
    const brandMatch = !filters.brand?.length || filters.brand.includes(car.brand);
    
    const featuresMatch = !filters.features?.length ||
      filters.features.every(feature => car.availableFeatures?.includes(feature));
      
    const verifiedMatch = !filters.verified || car.verified;

    const isMatch = locationMatch && priceMatch && transmissionMatch && fuelMatch &&
           seatsMatch && styleMatch && brandMatch && featuresMatch && verifiedMatch;

    return {
      ...car,
      relevanceScore,
      _isMatch: isMatch
    };
  })
  .filter(car => car._isMatch);
};

// Sort vehicles
export const sortVehicles = (vehicles, sortBy) => {
  const sorted = [...vehicles];
  
  // Primary sort by relevance if they have a non-zero relevance score
  const sortByRelevance = (a, b) => {
    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
  };

  switch (sortBy) {
    case 'relevance':
      sorted.sort(sortByRelevance);
      break;
    case 'price_low':
      sorted.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore && (a.relevanceScore > 0 || b.relevanceScore > 0)) {
          return sortByRelevance(a, b);
        }
        if (a.totalPrice && b.totalPrice) return a.totalPrice - b.totalPrice;
        return (a.price_per_day || 0) - (b.price_per_day || 0);
      });
      break;
    case 'price_high':
      sorted.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore && (a.relevanceScore > 0 || b.relevanceScore > 0)) {
          return sortByRelevance(a, b);
        }
        if (a.totalPrice && b.totalPrice) return b.totalPrice - a.totalPrice;
        return (b.price_per_day || 0) - (a.price_per_day || 0);
      });
      break;
    case 'rating':
      sorted.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore && (a.relevanceScore > 0 || b.relevanceScore > 0)) {
          return sortByRelevance(a, b);
        }
        return (b.rating || 0) - (a.rating || 0);
      });
      break;
    case 'newest':
      sorted.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore && (a.relevanceScore > 0 || b.relevanceScore > 0)) {
          return sortByRelevance(a, b);
        }
        return (b.year || 0) - (a.year || 0);
      });
      break;
    default:
      // Keep original order for relevance
      sorted.sort(sortByRelevance);
};
