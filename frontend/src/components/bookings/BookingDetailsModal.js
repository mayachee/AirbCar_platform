'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, DollarSign, MessageSquare, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, FileText, Building, Star, Gauge, Settings as SettingsIcon, Users, Image as ImageIcon, ExternalLink, TrendingUp, Activity, Ban, Edit, Trash2, CreditCard, FileCheck, Navigation, Info, Hash, Globe, Shield, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/features/admin/services/adminService';
import CustomerDocuments from '@/features/partner/components/CustomerDocuments';

export default function BookingDetailsModal({ booking, isOpen, onClose, onAction, actionLoading, userType = 'user', onDelete }) {
  const { user: currentUser } = useAuth();
  const [fullBookingData, setFullBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [relatedData, setRelatedData] = useState({
    customer: null,
    listing: null,
    partner: null
  });

  useEffect(() => {
    // Handle nested data structure
    const bookingId = booking?.id || booking?.data?.id;
    if (isOpen && bookingId) {
      loadFullBookingData();
      setActiveTab('overview');
    } else {
      setFullBookingData(null);
    }
  }, [isOpen, booking?.id, booking?.data?.id]);

  // Debug: Log the booking data to see what we have
  // This must be before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (isOpen && booking) {
      const unwrappedBooking = booking?.data || booking;
      const unwrappedFullData = fullBookingData?.data || fullBookingData;
      const displayBooking = unwrappedFullData || unwrappedBooking;
      console.log('=== BOOKING DETAILS DEBUG ===');
      console.log('Full booking object:', displayBooking);
      console.log('Booking ID:', displayBooking.id);
      console.log('Booking status:', displayBooking.status);
      console.log('Listing/Vehicle:', displayBooking.listing || displayBooking.vehicle);
      console.log('User/Customer:', displayBooking.user || displayBooking.customer);
      console.log('All booking keys:', Object.keys(displayBooking));
      console.log('ID fields:', {
        customer_id: displayBooking.customer_id,
        listing_id: displayBooking.listing_id,
        partner_id: displayBooking.partner_id,
        customerId: displayBooking.customerId,
        listingId: displayBooking.listingId,
        partnerId: displayBooking.partnerId
      });
      console.log('Nested objects:', {
        hasCustomer: !!(displayBooking.customer || displayBooking.user),
        hasListing: !!(displayBooking.listing || displayBooking.vehicle),
        hasPartner: !!(displayBooking.partner || (displayBooking.listing && displayBooking.listing.partner))
      });
      console.log('Related data loaded:', relatedData);
      console.log('Pickup date fields:', {
        pickup_date: displayBooking.pickup_date,
        start_date: displayBooking.start_date,
        start_time: displayBooking.start_time,
        pickupDate: displayBooking.pickupDate
      });
      console.log('Return date fields:', {
        return_date: displayBooking.return_date,
        end_date: displayBooking.end_date,
        end_time: displayBooking.end_time,
        returnDate: displayBooking.returnDate
      });
      console.log('Price fields:', {
        total_amount: displayBooking.total_amount,
        total_price: displayBooking.total_price,
        price: displayBooking.price,
        totalAmount: displayBooking.totalAmount
      });
      console.log('============================');
    }
  }, [isOpen, booking, fullBookingData, relatedData]);

  const loadFullBookingData = async () => {
    // Handle nested data structure - get ID from booking or booking.data
    const bookingId = booking?.id || booking?.data?.id;
    if (!bookingId) {
      console.warn('No booking ID found. Booking object:', booking);
      return;
    }
    
    try {
      setLoading(true);
      let bookingData = null;
      
      if (userType === 'admin') {
        const response = await adminService.getBookingById?.(bookingId);
        console.log('Full booking API response:', response);
        // Handle apiClient response structure: { data, success, message }
        bookingData = response?.data || response?.result || response;
        console.log('Extracted booking data:', bookingData);
      } else {
        // For non-admin users, try to fetch full data if bookingService is available
        try {
          const { bookingsService } = await import('@/services/api');
          const response = await bookingsService?.getBooking?.(bookingId);
          if (response) {
            console.log('Full booking data from service:', response);
            bookingData = response;
          } else {
            // Use unwrapped booking data
            bookingData = booking?.data || booking;
          }
        } catch (serviceError) {
          console.log('Using initial booking data:', booking);
          bookingData = booking?.data || booking;
        }
      }
      
      setFullBookingData(bookingData);
      
      // If we only have IDs, fetch the related data
      await loadRelatedData(bookingData || (booking?.data || booking));
      
    } catch (error) {
      console.error('Error loading full booking data:', error);
      console.log('Falling back to initial booking data:', booking);
      const fallbackData = booking?.data || booking;
      setFullBookingData(fallbackData);
      await loadRelatedData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (bookingData) => {
    if (!bookingData) return;
    
    try {
      const promises = [];
      
      // Check if we need to fetch customer data
      const customerId = bookingData.customer_id || bookingData.customerId;
      const hasCustomerData = bookingData.customer || bookingData.user;
      
      if (customerId && !hasCustomerData && userType === 'admin') {
        console.log('Fetching customer data for ID:', customerId);
        promises.push(
          adminService.getUserById?.(customerId)
            .then(response => {
              const customerData = response?.data || response;
              return { type: 'customer', data: customerData };
            })
            .catch(err => {
              console.warn('Error fetching customer:', err);
              return { type: 'customer', data: null };
            })
        );
      } else {
        promises.push(Promise.resolve({ type: 'customer', data: null }));
      }
      
      // Check if we need to fetch listing data
      const listingId = bookingData.listing_id || bookingData.listingId || bookingData.vehicle_id || bookingData.vehicleId;
      const hasListingData = bookingData.listing || bookingData.vehicle;
      
      if (listingId && !hasListingData) {
        console.log('Fetching listing data for ID:', listingId);
        promises.push(
          adminService.getListingById?.(listingId)
            .then(response => {
              const listingData = response?.data || response;
              return { type: 'listing', data: listingData };
            })
            .catch(err => {
              console.warn('Error fetching listing:', err);
              return { type: 'listing', data: null };
            })
        );
      } else {
        promises.push(Promise.resolve({ type: 'listing', data: null }));
      }
      
      // Check if we need to fetch partner data
      const partnerId = bookingData.partner_id || bookingData.partnerId;
      const hasPartnerData = bookingData.partner || (bookingData.listing && bookingData.listing.partner);
      
      if (partnerId && !hasPartnerData && userType === 'admin') {
        console.log('Fetching partner data for ID:', partnerId);
        promises.push(
          adminService.getPartnerById?.(partnerId)
            .then(response => {
              const partnerData = response?.data || response;
              return { type: 'partner', data: partnerData };
            })
            .catch(err => {
              console.warn('Error fetching partner:', err);
              return { type: 'partner', data: null };
            })
        );
      } else {
        promises.push(Promise.resolve({ type: 'partner', data: null }));
      }
      
      const results = await Promise.all(promises);
      
      const newRelatedData = { customer: null, listing: null, partner: null };
      results.forEach(result => {
        if (result.data) {
          newRelatedData[result.type] = result.data;
        }
      });
      
      setRelatedData(newRelatedData);
      console.log('Loaded related data:', newRelatedData);
      
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  if (!isOpen || !booking) return null;

  // Handle nested data structure - booking might be wrapped in { data: {...} }
  const unwrappedBooking = booking?.data || booking;
  const unwrappedFullData = fullBookingData?.data || fullBookingData;
  const displayBooking = unwrappedFullData || unwrappedBooking;
  
  // Use related data if available, otherwise use nested data from booking
  const listing = relatedData.listing || displayBooking.listing || displayBooking.vehicle || {};
  const user = relatedData.customer || displayBooking.user || displayBooking.customer || {};
  const partner = relatedData.partner || listing.partner || displayBooking.partner || {};
  const carOwner = displayBooking.car_owner || partner?.user || {};
  
  // Extract booking documents (uploaded during booking)
  const bookingDocuments = {
    id_front_document_url: displayBooking.id_front_document_url,
    id_back_document_url: displayBooking.id_back_document_url
  };
  
  // Extract all booking fields - try multiple possible field names
  const pickupDate = displayBooking.pickup_date || displayBooking.start_date || displayBooking.start_time || displayBooking.pickupDate;
  const returnDate = displayBooking.return_date || displayBooking.end_date || displayBooking.end_time || displayBooking.returnDate || displayBooking.dropoff_date;
  const pickupTime = displayBooking.pickup_time || displayBooking.pickupTime;
  const returnTime = displayBooking.return_time || displayBooking.returnTime;
  const pickupLocation = displayBooking.pickup_location || displayBooking.pickupLocation;
  const returnLocation = displayBooking.return_location || displayBooking.returnLocation;
  const totalAmount = displayBooking.total_amount || displayBooking.total_price || displayBooking.price || displayBooking.totalAmount;
  const paymentStatus = displayBooking.payment_status || displayBooking.paymentStatus;
  const paymentMethod = displayBooking.payment_method || displayBooking.paymentMethod;
  const specialRequests = displayBooking.special_requests || displayBooking.specialRequests;
  const idFrontDoc = displayBooking.id_front_document_url || displayBooking.id_front_document || displayBooking.idFrontDocumentUrl;
  const idBackDoc = displayBooking.id_back_document_url || displayBooking.id_back_document || displayBooking.idBackDocumentUrl;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      // Handle both "HH:MM:SS" and "HH:MM" formats
      const time = timeString.includes(':') ? timeString.split(':').slice(0, 2).join(':') : timeString;
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      let formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (timeString) {
        formatted += ` at ${formatTime(timeString)}`;
      }
      return formatted;
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateDuration = () => {
    const start = new Date(pickupDate || displayBooking.start_time || displayBooking.start_date);
    const end = new Date(returnDate || displayBooking.end_time || displayBooking.end_date || displayBooking.dropoff_date);
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const calculateDailyRate = () => {
    const duration = calculateDuration();
    const days = parseInt(duration) || 1;
    const total = parseFloat(totalAmount || 0);
    if (days === 0) return formatCurrency(total);
    return formatCurrency(total / days);
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/60';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700/60';
      case 'refunded': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/60';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700/60';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/60';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/60';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/60';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/60';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'confirmed': return CheckCircle;
      case 'rejected': return XCircle;
      case 'cancelled': return Ban;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  // Admin can cancel any booking that's not already cancelled or completed
  const canCancel = (userType === 'admin') 
    ? (displayBooking.status !== 'cancelled' && displayBooking.status !== 'completed' && displayBooking.status !== 'rejected')
    : (displayBooking.status === 'pending' || displayBooking.status === 'accepted');
  
  // Admin and partners can accept/reject pending bookings
  const canAccept = (userType === 'partner' || userType === 'admin') && displayBooking.status === 'pending';
  const canReject = (userType === 'partner' || userType === 'admin') && displayBooking.status === 'pending';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'details', label: 'Details', icon: SettingsIcon },
    { id: 'raw', label: 'Raw Data', icon: Info },
    ...(userType === 'partner' || userType === 'admin' ? [{ id: 'customer', label: 'Customer Documents', icon: User }] : []),
  ];

  const TabButton = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;
    return (
      <button
        onClick={onClick}
        className={`shrink-5 flex items-center space-x-2 whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
          isActive 
            ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-200' 
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{tab.label}</span>
      </button>
    );
  };

  const timelineEvents = [];
  if (displayBooking.created_at) {
    timelineEvents.push({ date: displayBooking.created_at, action: 'Booking Created', status: 'pending', description: 'Booking request was submitted' });
  }
  if (displayBooking.requested_at) {
    timelineEvents.push({ date: displayBooking.requested_at, action: 'Requested', status: 'pending', description: 'Booking request was sent' });
  }
  if (displayBooking.accepted_at) {
    timelineEvents.push({ date: displayBooking.accepted_at, action: 'Accepted', status: 'accepted', description: 'Booking was accepted by owner' });
  }
  if (displayBooking.rejected_at) {
    timelineEvents.push({ date: displayBooking.rejected_at, action: 'Rejected', status: 'rejected', description: displayBooking.rejection_reason || 'Booking was rejected' });
  }
  if (displayBooking.cancelled_at) {
    timelineEvents.push({ date: displayBooking.cancelled_at, action: 'Cancelled', status: 'cancelled', description: 'Booking was cancelled' });
  }
  if (displayBooking.updated_at && displayBooking.updated_at !== displayBooking.created_at) {
    timelineEvents.push({ date: displayBooking.updated_at, action: 'Last Updated', status: displayBooking.status, description: 'Booking information was updated' });
  }
  timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const pictures = Array.isArray(listing.pictures) ? listing.pictures : 
                  (listing.pictures ? [listing.pictures] : []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20">
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Booking Details</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">Booking ID: #{displayBooking.id}</p>
              </div>
              <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(displayBooking.status)}`}>
                {displayBooking.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-end sm:self-auto"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Tabs */}
          <div className="shrink-0 px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading booking details...</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Debug Notice - Remove in production */}
                    {!displayBooking?.id && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/60 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Info:</strong> Booking data structure: {displayBooking ? 'Data found' : 'No data'}. 
                            ID: {displayBooking?.id || 'Not found'}. 
                            Check console for full object structure.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Total Price</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                          {formatCurrency(totalAmount)}
                        </p>
                        {paymentStatus && (
                          <p className="text-xs text-blue-700 dark:text-blue-200/80 mt-1 capitalize">{paymentStatus}</p>
                        )}
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-300" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-300">Duration</span>
                        </div>
                        <p className="text-xl font-bold text-green-900 dark:text-green-200">{calculateDuration()}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-300">Daily Rate</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{calculateDailyRate()}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-300">Created</span>
                        </div>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-200">
                          {displayBooking.created_at ? formatDateShort(displayBooking.created_at) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-800/40">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vehicle Information</h3>
                            {pictures.length > 0 && (
                              <div className="flex -space-x-2">
                                {pictures.slice(0, 3).map((pic, idx) => (
                                  <img
                                    key={idx}
                                    src={pic}
                                    alt={`Vehicle ${idx + 1}`}
                                    className="h-10 w-10 rounded-lg border-2 border-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => window.open(pic, '_blank')}
                                    title="Click to view full size"
                                  />
                                ))}
                                {pictures.length > 3 && (
                                  <div className="h-10 w-10 rounded-lg border-2 border-white bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    +{pictures.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Make & Model</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'N/A'}
                                {listing.year && ` (${listing.year})`}
                              </p>
                            </div>
                            {listing.vehicle_style && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Style</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.vehicle_style}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>Location</span>
                              </p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{listing.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <Gauge className="h-3 w-3" />
                                <span>Fuel Type</span>
                              </p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.fuel_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <SettingsIcon className="h-3 w-3" />
                                <span>Transmission</span>
                              </p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.transmission || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>Seating</span>
                              </p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{listing.seating_capacity || 'N/A'} seats</p>
                            </div>
                            {listing.price_per_day && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Daily Rate</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(listing.price_per_day)}</p>
                              </div>
                            )}
                            {listing.rating && listing.rating > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>Rating</span>
                                </p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-1">
                                  <span>{listing.rating.toFixed(1)}</span>
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                </p>
                              </div>
                            )}
                            {listing.available_features && Array.isArray(listing.available_features) && listing.available_features.length > 0 && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Features</p>
                                <div className="flex flex-wrap gap-2">
                                  {listing.available_features.map((feature, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Period */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rental Period</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Pickup Date & Time</span>
                          </p>
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                            {formatDateTime(pickupDate, pickupTime)}
                          </p>
                          {pickupLocation && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{pickupLocation}</span>
                            </p>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Return Date & Time</span>
                          </p>
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                            {formatDateTime(returnDate, returnTime)}
                          </p>
                          {returnLocation && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{returnLocation}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    {(paymentStatus || paymentMethod || totalAmount) && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 rounded-lg p-5 border border-green-100 dark:border-green-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                          <CreditCard className="h-5 w-5 text-green-600 dark:text-green-300" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-transparent dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Amount</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(totalAmount)}
                            </p>
                          </div>
                          {paymentStatus && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-transparent dark:border-gray-700">
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Payment Status</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(paymentStatus)}`}>
                                {paymentStatus?.toUpperCase() || 'N/A'}
                              </span>
                            </div>
                          )}
                          {paymentMethod && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-transparent dark:border-gray-700">
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Payment Method</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{paymentMethod}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special Requests */}
                    {specialRequests && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border border-yellow-100 dark:border-yellow-700/60">
                        <div className="flex items-center space-x-3 mb-3">
                          <MessageSquare className="h-5 w-5 text-yellow-600" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Special Requests</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap">{specialRequests}</p>
                      </div>
                    )}

                    {/* Customer Information */}
                    {userType === 'partner' || userType === 'admin' ? (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-100 dark:border-green-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                            {user.first_name?.[0] || user.email?.[0] || 'U'}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Name</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.username || user.email || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.email || 'N/A'}</p>
                            </div>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Phone</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{user.phone_number}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Partner/Owner Information */}
                    {userType === 'user' || userType === 'admin' ? (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-100 dark:border-purple-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                            {carOwner.first_name?.[0] || carOwner.email?.[0] || partner?.company_name?.[0] || 'P'}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Owner / Partner Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Name</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {carOwner.first_name && carOwner.last_name
                                ? `${carOwner.first_name} ${carOwner.last_name}`
                                : carOwner.username || carOwner.email || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{carOwner.email || 'N/A'}</p>
                            </div>
                          </div>
                          {partner?.company_name && (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Company</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{partner.company_name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {displayBooking.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-5 border border-red-100 dark:border-red-700/60">
                        <div className="flex items-center space-x-3 mb-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rejection Reason</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg p-4">{displayBooking.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Booking Timeline</h3>
                    {timelineEvents.length > 0 ? (
                      <div className="space-y-4">
                        {timelineEvents.map((event, index) => {
                          const StatusIcon = getStatusIcon(event.status);
                          const isLast = index === timelineEvents.length - 1;
                          return (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                event.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                event.status === 'accepted' || event.status === 'confirmed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-200' :
                                event.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-200' :
                                event.status === 'cancelled' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-200'
                              }`}>
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div className={`flex-1 ${!isLast ? 'pb-4 sm:border-l-2 sm:border-gray-200 sm:dark:border-gray-700' : ''} sm:pl-4`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">{event.action}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
                                </div>
                                {event.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">{event.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No timeline events available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Data Tab - Debug */}
                {activeTab === 'raw' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/60 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Debug Information</h3>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        This tab shows the raw booking data to help diagnose display issues. Check the browser console for detailed logs.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Complete Booking Object</h4>
                      <pre className="bg-white dark:bg-gray-950 p-4 rounded border border-gray-200 dark:border-gray-800 overflow-auto text-xs max-h-96 text-gray-800 dark:text-gray-200">
                        {JSON.stringify(displayBooking, null, 2)}
                      </pre>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Extracted Fields</h4>
                        <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                          <div><span className="font-medium">Pickup Date:</span> <span className="text-gray-600 dark:text-gray-300">{pickupDate || 'N/A'}</span></div>
                          <div><span className="font-medium">Return Date:</span> <span className="text-gray-600 dark:text-gray-300">{returnDate || 'N/A'}</span></div>
                          <div><span className="font-medium">Pickup Time:</span> <span className="text-gray-600 dark:text-gray-300">{pickupTime || 'N/A'}</span></div>
                          <div><span className="font-medium">Return Time:</span> <span className="text-gray-600 dark:text-gray-300">{returnTime || 'N/A'}</span></div>
                          <div><span className="font-medium">Pickup Location:</span> <span className="text-gray-600 dark:text-gray-300">{pickupLocation || 'N/A'}</span></div>
                          <div><span className="font-medium">Return Location:</span> <span className="text-gray-600 dark:text-gray-300">{returnLocation || 'N/A'}</span></div>
                          <div><span className="font-medium">Total Amount:</span> <span className="text-gray-600 dark:text-gray-300">{totalAmount || 'N/A'}</span></div>
                          <div><span className="font-medium">Payment Status:</span> <span className="text-gray-600 dark:text-gray-300">{paymentStatus || 'N/A'}</span></div>
                          <div><span className="font-medium">Payment Method:</span> <span className="text-gray-600 dark:text-gray-300">{paymentMethod || 'N/A'}</span></div>
                          <div><span className="font-medium">Special Requests:</span> <span className="text-gray-600 dark:text-gray-300">{specialRequests || 'N/A'}</span></div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Nested Objects</h4>
                        <div className="space-y-3 text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <span className="font-medium">Listing:</span>
                            <pre className="bg-white dark:bg-gray-950 p-2 rounded mt-1 text-xs overflow-auto max-h-32 text-gray-800 dark:text-gray-200">
                              {JSON.stringify(listing, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="font-medium">User/Customer:</span>
                            <pre className="bg-white dark:bg-gray-950 p-2 rounded mt-1 text-xs overflow-auto max-h-32 text-gray-800 dark:text-gray-200">
                              {JSON.stringify(user, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="font-medium">Partner:</span>
                            <pre className="bg-white dark:bg-gray-950 p-2 rounded mt-1 text-xs overflow-auto max-h-32 text-gray-800 dark:text-gray-200">
                              {JSON.stringify(partner, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Fetched Related Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Customer</p>
                          <pre className="bg-white dark:bg-gray-950 p-2 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                            {JSON.stringify(relatedData.customer, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Listing</p>
                          <pre className="bg-white dark:bg-gray-950 p-2 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                            {JSON.stringify(relatedData.listing, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Partner</p>
                          <pre className="bg-white dark:bg-gray-950 p-2 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                            {JSON.stringify(relatedData.partner, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Documents Tab - Partner/Admin Only */}
                {(userType === 'partner' || userType === 'admin') && activeTab === 'customer' && (
                  <div className="space-y-6">
                    {user && (user.id || user.email) ? (
                      <div>
                        {/* Show booking documents if available */}
                        {(displayBooking.id_front_document_url || displayBooking.id_back_document_url) && (
                          <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/60 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                              <FileCheck className="h-5 w-5 mr-2 text-blue-600" />
                              Documents Uploaded with This Booking
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {displayBooking.id_front_document_url && (
                                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-100 dark:border-blue-700/50">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">ID Front Document</p>
                                  <a 
                                    href={displayBooking.id_front_document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 text-sm flex items-center space-x-1"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>View Document</span>
                                  </a>
                                </div>
                              )}
                              {displayBooking.id_back_document_url && (
                                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-100 dark:border-blue-700/50">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">ID Back Document</p>
                                  <a 
                                    href={displayBooking.id_back_document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 text-sm flex items-center space-x-1"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>View Document</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <CustomerDocuments 
                          bookingId={displayBooking.id} 
                          customer={user}
                          userType={userType}
                          bookingData={displayBooking}
                        />
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/60 rounded-lg p-6 text-center">
                        <User className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">Customer information not available</p>
                        <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-2">
                          Customer ID: {displayBooking.customer_id || displayBooking.customerId || 'N/A'}
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                          User object: {user ? 'Found' : 'Not found'}
                        </p>
                        {displayBooking.customer_id && (
                          <button
                            onClick={async () => {
                              try {
                                const customerData = await adminService.getUserById(displayBooking.customer_id);
                                const fetchedCustomer = customerData?.data || customerData;
                                setRelatedData(prev => ({ ...prev, customer: fetchedCustomer }));
                              } catch (err) {
                                console.error('Error fetching customer:', err);
                              }
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Load Customer Data
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Complete Booking Details</h3>
                    
                    {/* Booking Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-blue-600" />
                        <span>Booking Information</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Booking ID</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">#{displayBooking.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(displayBooking.status)}`}>
                            {displayBooking.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Duration</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{calculateDuration()}</p>
                        </div>
                        {displayBooking.created_at && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Created At</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(displayBooking.created_at)}</p>
                          </div>
                        )}
                        {displayBooking.updated_at && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Last Updated</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(displayBooking.updated_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rental Details */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-100 dark:border-purple-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span>Rental Details</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-transparent dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Pickup</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(pickupDate, pickupTime)}</p>
                          {pickupLocation && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{pickupLocation}</span>
                            </p>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-transparent dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Return</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(returnDate, returnTime)}</p>
                          {returnLocation && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{returnLocation}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-100 dark:border-green-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <span>Payment Details</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
                        </div>
                        {listing.price_per_day && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Daily Rate (Listed)</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(listing.price_per_day)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Calculated Daily Rate</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{calculateDailyRate()}</p>
                        </div>
                        {paymentStatus && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Payment Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(paymentStatus)}`}>
                              {paymentStatus?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {paymentMethod && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Payment Method</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-5 border border-indigo-100 dark:border-indigo-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <Car className="h-5 w-5 text-indigo-600" />
                        <span>Vehicle Details</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Make & Model</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'N/A'}
                            {listing.year && ` (${listing.year})`}
                          </p>
                        </div>
                        {listing.vehicle_style && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Style</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.vehicle_style}</p>
                          </div>
                        )}
                        {listing.fuel_type && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Fuel Type</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.fuel_type}</p>
                          </div>
                        )}
                        {listing.transmission && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Transmission</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{listing.transmission}</p>
                          </div>
                        )}
                        {listing.seating_capacity && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Seating Capacity</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{listing.seating_capacity} seats</p>
                          </div>
                        )}
                        {listing.location && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Location</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{listing.location}</p>
                          </div>
                        )}
                        {listing.rating > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Rating</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span>{listing.rating.toFixed(1)}</span>
                            </p>
                          </div>
                        )}
                        {listing.available_features && Array.isArray(listing.available_features) && listing.available_features.length > 0 && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Features</p>
                            <div className="flex flex-wrap gap-2">
                              {listing.available_features.map((feature, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Information */}
                    {(userType === 'partner' || userType === 'admin') && (
                      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-5 border border-teal-100 dark:border-teal-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                          <User className="h-5 w-5 text-teal-600" />
                          <span>Customer Information</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Name</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.username || user.email || 'N/A'}
                            </p>
                          </div>
                          {user.email && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Email</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                            </div>
                          )}
                          {user.phone_number && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Phone</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.phone_number}</p>
                            </div>
                          )}
                          {user.role && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Role</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{user.role}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Partner/Owner Information */}
                    {(userType === 'user' || userType === 'admin') && partner && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-5 border border-amber-100 dark:border-amber-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                          <Building className="h-5 w-5 text-amber-600" />
                          <span>Owner / Partner Information</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {partner.business_name && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Business Name</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{partner.business_name}</p>
                            </div>
                          )}
                          {partner.business_type && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Business Type</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{partner.business_type}</p>
                            </div>
                          )}
                          {carOwner.email && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Email</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{carOwner.email}</p>
                            </div>
                          )}
                          {partner.rating > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Rating</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-1">
                                <Award className="h-4 w-4 text-yellow-500" />
                                <span>{partner.rating.toFixed(1)}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Identity Documents */}
                    {(idFrontDoc || idBackDoc) && (userType === 'partner' || userType === 'admin') && (
                      <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-5 border border-slate-100 dark:border-slate-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                          <FileCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          <span>Identity Documents</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {idFrontDoc && (
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-transparent dark:border-gray-800">
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Front ID Document</p>
                              <a 
                                href={idFrontDoc} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>View Document</span>
                              </a>
                            </div>
                          )}
                          {idBackDoc && (
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-transparent dark:border-gray-800">
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Back ID Document</p>
                              <a 
                                href={idBackDoc} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>View Document</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special Requests */}
                    {specialRequests && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border border-yellow-100 dark:border-yellow-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-yellow-600" />
                          <span>Special Requests</span>
                        </h4>
                        <p className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 rounded-lg p-4 whitespace-pre-wrap border border-transparent dark:border-gray-800">{specialRequests}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {(canAccept || canReject || canCancel) && (
                <>
                  {canAccept && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to accept booking #${displayBooking.id}?`)) {
                          onAction?.('accept', displayBooking.id);
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                  )}
                  {canReject && (
                    <button
                      onClick={() => {
                        const reason = window.prompt('Please provide a reason for rejecting this booking (optional):');
                        if (reason !== null) { // User didn't cancel the prompt
                          onAction?.('reject', displayBooking.id, reason);
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to cancel booking #${displayBooking.id}?`)) {
                          onAction?.('cancel', displayBooking.id);
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {userType === 'admin' && onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete booking #${displayBooking.id}? This action cannot be undone.`)) {
                      onDelete(displayBooking.id);
                      onClose();
                    }
                  }}
                  disabled={actionLoading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
