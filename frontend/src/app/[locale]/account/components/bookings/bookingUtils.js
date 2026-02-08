import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDaysUntilBooking = (startDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = start - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getBookingImage = (listing) => {
  if (!listing) return null;
  
  // Try images array (most common format)
  if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
    const firstImage = listing.images[0];
    // Handle object with url property
    if (typeof firstImage === 'object' && firstImage !== null) {
      // Try to extract URL from object
      const url = firstImage.url || firstImage.image || firstImage.url_path || firstImage.src || firstImage.link;
      if (url && typeof url === 'string') {
        return url;
      }
      // If object doesn't have a string URL property, skip it
    }
    // Handle string URL
    if (typeof firstImage === 'string' && firstImage.trim()) {
      // If it's already a full URL, return it
      if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
        return firstImage;
      }
      // If it's a relative path, return as is
      return firstImage;
    }
    // If firstImage is not a string or valid object, try next image
    if (listing.images.length > 1) {
      const secondImage = listing.images[1];
      if (typeof secondImage === 'string' && secondImage.trim()) {
        return secondImage;
      }
    }
  }
  
  // Try pictures array
  if (listing.pictures && Array.isArray(listing.pictures) && listing.pictures.length > 0) {
    const firstPicture = listing.pictures[0];
    if (typeof firstPicture === 'object' && firstPicture !== null) {
      const url = firstPicture.url || firstPicture.image || firstPicture.url_path || firstPicture.src || firstPicture.link;
      if (url && typeof url === 'string') {
        return url;
      }
    }
    if (typeof firstPicture === 'string' && firstPicture.trim()) {
      return firstPicture;
    }
    // Try next picture if available
    if (listing.pictures.length > 1) {
      const secondPicture = listing.pictures[1];
      if (typeof secondPicture === 'string' && secondPicture.trim()) {
        return secondPicture;
      }
    }
  }
  
  // Try single image fields
  if (listing.image_url) return listing.image_url;
  if (listing.picture_url) return listing.picture_url;
  if (listing.image) return listing.image;
  if (listing.picture) return listing.picture;
  if (listing.thumbnail) return listing.thumbnail;
  if (listing.photo) return listing.photo;
  
  // Try images as string (comma-separated or single)
  if (typeof listing.images === 'string' && listing.images.trim()) {
    const images = listing.images.split(',').map(img => img.trim()).filter(img => img);
    if (images.length > 0) {
      return images[0];
    }
  }
  
  return null;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'completed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  const IconComponent = (() => {
    switch (status?.toLowerCase()) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'confirmed': return CheckCircle;
      case 'rejected': return XCircle;
      case 'cancelled': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  })();
  
  return <IconComponent className="h-4 w-4" />;
};

