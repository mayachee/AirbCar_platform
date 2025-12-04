/**
 * Utility functions for fixing and normalizing image URLs
 */

/**
 * Fix malformed image URLs that may contain incorrect paths
 * @param {string} url - The image URL to fix
 * @returns {string} - The corrected image URL
 */
export function fixImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return '/carsymbol.jpg';
  }

  // If it's already a valid absolute URL pointing to the backend, return as is
  const backendUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://airbcar-backend.onrender.com';
  
  // Normalize backend URL (remove trailing slash)
  const normalizedBackendUrl = backendUrl.replace(/\/$/, '');
  
  // Check if URL contains malformed paths like /partner/airbcar-backend/ or similar patterns
  // This handles URLs like: https://www.airbcar.com/partner/airbcar-backend/media/listings/...
  if (url.includes('/partner/') || url.includes('/airbcar-backend/')) {
    // Extract the media path if it exists
    const mediaIndex = url.indexOf('/media/');
    if (mediaIndex !== -1) {
      const mediaPath = url.substring(mediaIndex); // Get /media/... onwards
      // Remove query parameters and fragments
      const cleanPath = mediaPath.split('?')[0].split('#')[0];
      return `${normalizedBackendUrl}${cleanPath}`;
    }
  }

  // If it's a relative path starting with /media/, prepend backend URL
  if (url.startsWith('/media/')) {
    return `${normalizedBackendUrl}${url}`;
  }

  // If it's already an absolute URL but contains /media/, check if it needs fixing
  if ((url.startsWith('http://') || url.startsWith('https://')) && url.includes('/media/')) {
    // Check if it's pointing to the wrong domain
    if (!url.includes(backendUrl) && (url.includes('airbcar.com') || url.includes('www.airbcar.com'))) {
      // Extract media path and reconstruct with correct backend URL
      const mediaIndex = url.indexOf('/media/');
      if (mediaIndex !== -1) {
        const mediaPath = url.substring(mediaIndex);
        const cleanPath = mediaPath.split('?')[0].split('#')[0];
        return `${normalizedBackendUrl}${cleanPath}`;
      }
    }
    // If it's already pointing to the correct backend, return as is
    if (url.includes(normalizedBackendUrl) || url.includes(backendUrl)) {
      return url;
    }
  }

  // If it's a Supabase Storage URL, return as is (don't modify)
  if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/')) {
    return url;
  }

  // If it's already an absolute URL and doesn't need fixing, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative path starting with /, return as is (might be a frontend asset)
  if (url.startsWith('/')) {
    return url;
  }

  // Default fallback
  return '/carsymbol.jpg';
}

/**
 * Get the first image from a vehicle/listing object
 * @param {object} vehicle - The vehicle/listing object
 * @returns {string} - The image URL
 */
export function getVehicleImageUrl(vehicle) {
  if (!vehicle) {
    return '/carsymbol.jpg';
  }

  // Try images array first
  if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
    const img = vehicle.images[0];
    
    // If it's an object with url property
    if (typeof img === 'object' && img !== null) {
      if (img.url) {
        return fixImageUrl(img.url);
      }
      if (img.image) {
        return fixImageUrl(img.image);
      }
      if (img.path) {
        return fixImageUrl(img.path);
      }
    }
    
    // If it's a string
    if (typeof img === 'string') {
      return fixImageUrl(img);
    }
  }

  // Try alternative field names
  if (vehicle.image) {
    return fixImageUrl(vehicle.image);
  }
  if (vehicle.photo) {
    return fixImageUrl(vehicle.photo);
  }
  if (vehicle.thumbnail) {
    return fixImageUrl(vehicle.thumbnail);
  }
  if (vehicle.pictures && Array.isArray(vehicle.pictures) && vehicle.pictures.length > 0) {
    return fixImageUrl(vehicle.pictures[0]);
  }

  return '/carsymbol.jpg';
}

/**
 * Get all image URLs from a vehicle/listing object
 * @param {object} vehicle - The vehicle/listing object
 * @returns {string[]} - Array of image URLs
 */
export function getAllVehicleImages(vehicle) {
  if (!vehicle) {
    return ['/carsymbol.jpg'];
  }

  const images = [];

  // Try images array
  if (vehicle.images && Array.isArray(vehicle.images)) {
    vehicle.images.forEach(img => {
      if (typeof img === 'object' && img !== null) {
        if (img.url) images.push(fixImageUrl(img.url));
        else if (img.image) images.push(fixImageUrl(img.image));
        else if (img.path) images.push(fixImageUrl(img.path));
      } else if (typeof img === 'string') {
        images.push(fixImageUrl(img));
      }
    });
  }

  // If no images found, return fallback
  if (images.length === 0) {
    return ['/carsymbol.jpg'];
  }

  return images;
}

