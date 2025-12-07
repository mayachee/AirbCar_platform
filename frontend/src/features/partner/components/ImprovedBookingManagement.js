'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Clock, User, Car, CheckCircle, XCircle, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { bookingService } from '@/features/booking/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import BookingDetailsModal from '@/components/bookings/BookingDetailsModal';
import CustomerDocuments from '@/features/partner/components/CustomerDocuments';

export default function ImprovedBookingManagement({ 
  bookings: propBookings = [], 
  loading: propLoading = false, 
  onBookingUpdate,
  acceptBooking,
  rejectBooking,
  cancelBooking 
}) {
  const { user: currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(propLoading);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    if (propBookings.length > 0) {
      setBookings(propBookings);
    } else {
      loadBookings();
    }
  }, [propBookings, loadBookings]);

  useEffect(() => {
    setLoading(propLoading);
  }, [propLoading]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch bookings from backend
      const allBookingsResponse = await bookingService.getBookings();
      const pendingRequestsResponse = await bookingService.getPendingRequests().catch(() => ({ data: [] }));
      
      // Handle different response structures from backend
      let all = [];
      if (Array.isArray(allBookingsResponse)) {
        all = allBookingsResponse;
      } else if (Array.isArray(allBookingsResponse?.data)) {
        all = allBookingsResponse.data;
      } else if (Array.isArray(allBookingsResponse?.results)) {
        all = allBookingsResponse.results;
      }
      
      let pending = [];
      if (Array.isArray(pendingRequestsResponse)) {
        pending = pendingRequestsResponse;
      } else if (Array.isArray(pendingRequestsResponse?.data)) {
        pending = pendingRequestsResponse.data;
      } else if (Array.isArray(pendingRequestsResponse?.results)) {
        pending = pendingRequestsResponse.results;
      }
      
      // Normalize booking data from backend
      const normalizeBooking = (booking) => {
        return {
          ...booking,
          // Ensure price field is available (backend may use 'price' or 'total_price')
          price: booking.price || booking.total_price || booking.total_amount || 0,
          // Ensure date fields are available (backend may use different field names)
          start_time: booking.start_time || booking.start_date || booking.pickup_date,
          end_time: booking.end_time || booking.end_date || booking.return_date,
          // Ensure listing/vehicle data is available
          listing: booking.listing || booking.vehicle || booking.car || {},
          // Ensure user/customer data is available
          user: booking.user || booking.customer || {},
        };
      };
      
      // Normalize all bookings
      all = all.map(normalizeBooking);
      pending = pending.map(normalizeBooking);
      
      // Combine and deduplicate by booking ID
      const allIds = new Set(all.map(b => b.id));
      const newBookings = pending.filter(b => !allIds.has(b.id));
      const combinedBookings = [...all, ...newBookings];
      
      setBookings(combinedBookings);
    } catch (error) {
      console.error('Error loading bookings from backend:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterBookings = useCallback(() => {
    let filtered = [...bookings];

    // Show pending only toggle
    if (showPendingOnly) {
      filtered = filtered.filter(b => b.status === 'pending');
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const customerName = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.toLowerCase();
        const customerEmail = (b.user?.email || '').toLowerCase();
        const vehicleName = `${b.listing?.make || ''} ${b.listing?.model || ''}`.toLowerCase();
        const bookingId = b.id?.toString() || '';
        return customerName.includes(term) || customerEmail.includes(term) || vehicleName.includes(term) || bookingId.includes(term);
      });
    }

    // Sort: pending first, then by date
    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      const dateA = new Date(a.start_time || a.start_date);
      const dateB = new Date(b.start_time || b.start_date);
      return dateA - dateB;
    });

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm, showPendingOnly]);

  const handleAction = async (action, bookingId) => {
    try {
      setActionLoading(true);
      let reason = '';
      
      if (action === 'reject') {
        reason = prompt('Please provide a reason for rejection (optional):');
        if (reason === null) {
          setActionLoading(false);
          return; // User cancelled
        }
      }

      let result;
      switch (action) {
        case 'accept':
          if (acceptBooking) {
            // Use prop function if provided (from parent component)
            result = await acceptBooking(bookingId);
          } else {
            // Use bookingService directly - calls POST /bookings/{id}/accept/
            const response = await bookingService.acceptBooking(bookingId);
            // Handle different response structures
            result = response?.data?.data || response?.data || response;
          }
          break;
        case 'reject':
          if (rejectBooking) {
            // Use prop function if provided (from parent component)
            result = await rejectBooking(bookingId, reason);
          } else {
            // Use bookingService directly - calls POST /bookings/{id}/reject/ with rejection_reason
            const response = await bookingService.rejectBooking(bookingId, reason);
            // Handle different response structures
            result = response?.data?.data || response?.data || response;
          }
          break;
        case 'cancel':
          if (cancelBooking) {
            result = await cancelBooking(bookingId);
          } else {
            const response = await bookingService.cancelBooking(bookingId);
            result = response?.data?.data || response?.data || response;
          }
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      // Reload bookings to get updated status from backend
      await loadBookings();
      
      // Notify parent component of the update
      if (onBookingUpdate) {
        onBookingUpdate();
      }
      
      // Close details modal if open
      setShowDetails(false);
      setSelectedBooking(null);
      
      // Show success message
      const actionText = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled';
      alert(`✅ Booking ${actionText} successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      console.error('Full error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        data: error?.data,
        stack: error?.stack
      });
      
      // Extract error message from different error formats
      const errorMsg = error?.message || 
                      error?.data?.error || 
                      error?.data?.detail || 
                      error?.response?.data?.error || 
                      error?.response?.data?.detail || 
                      '';
      
      // Show user-friendly error message
      let errorMessage = `❌ Failed to ${action} booking. `;
      
      if (errorMsg) {
        if (errorMsg.includes('403') || errorMsg.includes('permission') || errorMsg.includes('not have permission')) {
          errorMessage = '❌ Permission denied: You can only accept/reject bookings for vehicles you own.';
        } else if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('Not Found')) {
          errorMessage = '❌ Booking not found. It may have been deleted or does not exist.';
        } else if (errorMsg.includes('conflicts') || errorMsg.includes('conflict')) {
          errorMessage = '❌ Cannot accept: This booking conflicts with an existing booking for the same time period.';
        } else if (errorMsg.includes('only pending') || errorMsg.includes('Cannot accept booking with status') || errorMsg.includes('Only pending bookings')) {
          errorMessage = '❌ This booking can only be accepted if it is still pending.';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
          errorMessage = '❌ Request timed out. Please try again.';
        } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
          errorMessage = '❌ Network error. Please check your connection and try again.';
        } else {
          // Use the error message directly
          errorMessage += errorMsg;
        }
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    // Backend returns prices in MAD (Moroccan Dirham)
    const price = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price) + ' MAD';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  const getStatusStats = () => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  };

  const stats = getStatusStats();
  const pendingCount = stats.pending;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
            <p className="text-sm text-gray-600 mt-1">Total bookings: {bookings.length}</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} require your attention
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setShowPendingOnly(false);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                statusFilter === status && !showPendingOnly
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-gray-600 capitalize mb-1">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{stats[status] || 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => {
                setShowPendingOnly(e.target.checked);
                if (e.target.checked) {
                  setStatusFilter('all');
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show pending requests only</span>
          </label>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const listing = booking.listing || {};
            const customer = booking.user || {};
            const isPending = booking.status === 'pending';
            
            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
                  isPending 
                    ? 'border-yellow-300 bg-yellow-50/30' 
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                          {booking.status?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">Booking #{booking.id}</span>
                        {booking.requested_at && (
                          <span className="text-sm text-gray-500 flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Requested {formatDate(booking.requested_at)}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'Unknown Vehicle'}
                            {listing.year && ` (${listing.year})`}
                          </h3>
                          <p className="text-sm text-gray-600">{listing.location || 'Location not specified'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          {customer.phone_number && (
                            <p className="text-sm text-gray-600">{customer.phone_number}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Pickup</p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Return</p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(booking.end_time || booking.end_date || booking.return_date)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Price</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(booking.price || booking.total_price || booking.total_amount || 0)}
                          </p>
                        </div>
                      </div>

                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      
                      {isPending && (
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleAction('accept', booking.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleAction('reject', booking.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedBooking(null);
        }}
        onAction={handleAction}
        actionLoading={actionLoading}
        userType="partner"
      />
    </div>
  );
}

