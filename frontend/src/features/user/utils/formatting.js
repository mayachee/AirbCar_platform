/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'MAD') => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  return dateObj.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Format date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getYear() === end.getYear()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  
  return `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`;
};

/**
 * Calculate days between dates
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 1; // Minimum 1 day
};

/**
 * Format profile completion percentage
 */
export const formatProfileCompletion = (percentage) => {
  if (percentage === 100) return 'Complete';
  if (percentage >= 75) return 'Almost Complete';
  if (percentage >= 50) return 'Halfway There';
  if (percentage >= 25) return 'Getting Started';
  return 'Just Started';
};

/**
 * Format booking status for display
 */
export const formatBookingStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    accepted: 'Accepted',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected'
  };
  
  return statusMap[status?.toLowerCase()] || status;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'yellow',
    confirmed: 'blue',
    accepted: 'green',
    active: 'purple',
    completed: 'green',
    cancelled: 'red',
    rejected: 'red'
  };
  
  return colorMap[status?.toLowerCase()] || 'gray';
};
