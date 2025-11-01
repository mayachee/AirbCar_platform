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
  if (listing?.pictures && listing.pictures.length > 0) {
    return Array.isArray(listing.pictures) ? listing.pictures[0] : listing.pictures;
  }
  if (listing?.image_url) return listing.image_url;
  if (listing?.picture) return listing.picture;
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

