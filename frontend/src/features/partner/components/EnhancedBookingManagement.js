'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Calendar, Clock, User, Car, CheckCircle, XCircle, Eye, 
  MessageSquare, AlertCircle, Loader2, Download, Filter, SortAsc, 
  SortDesc, DollarSign, MapPin, Phone, Mail, FileText, ChevronDown,
  ChevronUp, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';
import { bookingService } from '@/features/booking/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import BookingDetailsModal from '@/components/bookings/BookingDetailsModal';
import CustomerDocuments from '@/features/partner/components/CustomerDocuments';
import { SelectField } from '@/components/ui/select-field';

export default function EnhancedBookingManagement({ 
  bookings: propBookings = [], 
  loading: propLoading = false, 
  onBookingUpdate,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  hasPartnerProfile = true,
  onAddVehicle = null,
}) {
  const { user: currentUser } = useAuth();
  const t = useTranslations('partner_dashboard');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(propLoading);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'price', 'status', 'customer'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'pending', 'refunded'

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });

  // Load bookings
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('ðŸ” Loading bookings...');
      
      const allBookingsResponse = await bookingService.getBookings();
      const pendingRequestsResponse = hasPartnerProfile
        ? await bookingService.getPendingRequests().catch(() => ({ data: [] }))
        : { data: [] };
      
      console.log('ðŸ“¦ Raw bookings response:', allBookingsResponse);
      console.log('ðŸ“¦ Raw pending response:', pendingRequestsResponse);
      
      let all = [];
      if (Array.isArray(allBookingsResponse)) {
        all = allBookingsResponse;
      } else if (Array.isArray(allBookingsResponse?.data)) {
        all = allBookingsResponse.data;
      } else if (Array.isArray(allBookingsResponse?.results)) {
        all = allBookingsResponse.results;
      } else if (allBookingsResponse?.data && Array.isArray(allBookingsResponse.data)) {
        // Handle nested data structure: { data: { data: [...] } }
        all = allBookingsResponse.data;
      }
      
      let pending = [];
      if (Array.isArray(pendingRequestsResponse)) {
        pending = pendingRequestsResponse;
      } else if (Array.isArray(pendingRequestsResponse?.data)) {
        pending = pendingRequestsResponse.data;
      } else if (Array.isArray(pendingRequestsResponse?.results)) {
        pending = pendingRequestsResponse.results;
      }
      
      console.log('âœ… Parsed bookings:', all.length, 'all,', pending.length, 'pending');
      
      const normalizeBooking = (booking) => ({
        ...booking,
        price: booking.price || booking.total_price || booking.total_amount || 0,
        start_time: booking.start_time || booking.start_date || booking.pickup_date,
        end_time: booking.end_time || booking.end_date || booking.return_date,
        listing: booking.listing || booking.vehicle || booking.car || {},
        user: booking.user || booking.customer || {},
        payment_status: booking.payment_status || 'pending',
        payment_method: booking.payment_method || 'online',
      });
      
      all = all.map(normalizeBooking);
      pending = pending.map(normalizeBooking);
      
      const allIds = new Set(all.map(b => b.id));
      const newBookings = pending.filter(b => !allIds.has(b.id));
      const combinedBookings = [...all, ...newBookings];
      
      setBookings(combinedBookings);
      
      // Calculate stats
      const newStats = {
        total: combinedBookings.length,
        pending: combinedBookings.filter(b => b.status === 'pending').length,
        confirmed: combinedBookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length,
        completed: combinedBookings.filter(b => b.status === 'completed').length,
        cancelled: combinedBookings.filter(b => b.status === 'cancelled').length,
        totalRevenue: combinedBookings
          .filter(b => b.status === 'completed' || b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0),
        pendingRevenue: combinedBookings
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort bookings
  const filterAndSortBookings = useCallback(() => {
    let filtered = [...bookings];

    // Status filter
    if (showPendingOnly) {
      filtered = filtered.filter(b => b.status === 'pending');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        if (statusFilter === 'confirmed') {
          return b.status === 'confirmed' || b.status === 'accepted';
        }
        return b.status === statusFilter;
      });
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(b => b.payment_status === paymentFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.start_time || b.start_date || b.pickup_date);
        return bookingDate >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.start_time || b.start_date || b.pickup_date);
        return bookingDate <= new Date(dateRange.end);
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const customerName = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.toLowerCase();
        const customerEmail = (b.user?.email || '').toLowerCase();
        const vehicleName = `${b.listing?.make || ''} ${b.listing?.model || ''}`.toLowerCase();
        const bookingId = b.id?.toString() || '';
        const phone = (b.user?.phone_number || '').toLowerCase();
        return customerName.includes(term) || customerEmail.includes(term) || 
               vehicleName.includes(term) || bookingId.includes(term) || phone.includes(term);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.start_time || a.start_date || a.pickup_date);
          bVal = new Date(b.start_time || b.start_date || b.pickup_date);
          break;
        case 'price':
          aVal = parseFloat(a.price || a.total_price || a.total_amount || 0);
          bVal = parseFloat(b.price || b.total_price || b.total_amount || 0);
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'customer':
          aVal = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.toLowerCase();
          bVal = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      
      // Secondary sort by date if same value
      if (sortBy !== 'date') {
        const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
        const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
        return dateB - dateA;
      }
      
      return 0;
    });

    // Prioritize pending bookings
    if (!showPendingOnly && statusFilter === 'all') {
      filtered.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm, showPendingOnly, sortBy, sortOrder, dateRange, paymentFilter]);

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
    filterAndSortBookings();
  }, [filterAndSortBookings]);

  const handleAction = async (action, bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      let reason = '';
      
      if (action === 'reject') {
        reason = prompt(t('reject_reason_prompt'));
        if (reason === null) {
          setActionLoading(prev => ({ ...prev, [bookingId]: false }));
          return;
        }
      }

      let result;
      switch (action) {
        case 'accept':
          if (acceptBooking) {
            result = await acceptBooking(bookingId);
          } else {
            const response = await bookingService.acceptBooking(bookingId);
            result = response?.data || response;
          }
          break;
        case 'reject':
          if (rejectBooking) {
            result = await rejectBooking(bookingId, reason);
          } else {
            const response = await bookingService.rejectBooking(bookingId, reason);
            result = response?.data || response;
          }
          break;
        case 'cancel':
          if (cancelBooking) {
            result = await cancelBooking(bookingId);
          } else {
            const response = await bookingService.cancelBooking(bookingId);
            result = response?.data || response;
          }
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      await loadBookings();
      if (onBookingUpdate) onBookingUpdate();
      
      setShowDetails(false);
      setSelectedBooking(null);
      
      // Show success toast (you can replace with a toast library)
      const actionText = action === 'accept' ? t('accepted') : action === 'reject' ? t('rejected') : t('cancelled');
      console.log(`âœ… ${t('booking')} ${actionText} ${t('successfully')}!`);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      alert(`Error: ${error?.message || 'Failed to process booking'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const toggleExpand = (bookingId) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const exportBookings = () => {
    const csv = [
    [t('csv_booking_id'), t('csv_customer'), t('csv_vehicle'), t('csv_pickup_date'), t('csv_return_date'), t('csv_status'), t('csv_payment_status'), t('csv_total_price')].join(','),
      ...filteredBookings.map(b => [
        b.id,
        `"${b.user?.first_name || ''} ${b.user?.last_name || ''}"`,
        `"${b.listing?.make || ''} ${b.listing?.model || ''}"`,
        b.start_time || b.start_date || b.pickup_date,
        b.end_time || b.end_date || b.return_date,
        b.status,
        b.payment_status,
        b.price || b.total_price || b.total_amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'active': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { formatPrice } = useCurrency();

  const formatDate = (dateString) => {
    if (!dateString) return t('not_available');
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return t('not_available');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('not_available');
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return t('not_available');
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading && bookings.length === 0) {
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
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl shadow-sm border-2 border-orange-200 dark:border-orange-800 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('booking_management')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('manage_vehicle_bookings')}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {typeof onAddVehicle === 'function' && (
              <button
                onClick={onAddVehicle}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Car className="h-4 w-4" />
                <span>Add Vehicle</span>
              </button>
            )}
            <button
              onClick={loadBookings}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 rounded-lg text-orange-700 dark:text-orange-300 font-medium hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('refresh')}</span>
            </button>
            <button
              onClick={exportBookings}
              disabled={filteredBookings.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg font-medium hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{t('export_csv')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('total_bookings')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4 border-2 border-yellow-300 dark:border-yellow-700">
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">{t('pending')}</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.pending}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('confirmed')}</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('completed')}</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.completed}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('cancelled')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.cancelled}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 sm:p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{t('total_revenue')}</span>
            </p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(stats.totalRevenue)}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 sm:p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('pending_revenue')}</p>
            <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">{formatPrice(stats.pendingRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('search_bookings')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <SelectField
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setShowPendingOnly(false);
            }}
            options={[
              { value: 'all', label: t('all_status') },
              { value: 'pending', label: t('pending') },
              { value: 'confirmed', label: t('confirmed') },
              { value: 'completed', label: t('completed') },
              { value: 'cancelled', label: t('cancelled') },
            ]}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          <SelectField
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_payments') },
              { value: 'paid', label: t('paid') },
              { value: 'pending', label: t('pending_payment') },
              { value: 'refunded', label: t('refunded') },
            ]}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          <SelectField
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            options={[
              { value: 'date-desc', label: t('sort_date_newest') },
              { value: 'date-asc', label: t('sort_date_oldest') },
              { value: 'price-desc', label: t('sort_price_high') },
              { value: 'price-asc', label: t('sort_price_low') },
              { value: 'customer-asc', label: t('sort_customer_az') },
              { value: 'status-asc', label: t('sort_status') },
            ]}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => {
                setShowPendingOnly(e.target.checked);
                if (e.target.checked) setStatusFilter('all');
              }}
              className="rounded border-gray-300 dark:border-gray-600 text-orange-600 dark:text-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('pending_only')}</span>
          </label>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('start_date')}</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('end_date')}</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{t('showing_results', { visible: filteredBookings.length, total: bookings.length })}</span>
        {(dateRange.start || dateRange.end || searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
          <button
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setShowPendingOnly(false);
            }}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
          >
            {t('clear_filters')}
          </button>
        )}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_bookings_found')}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('try_adjusting_filters')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const listing = booking.listing || {};
            const customer = booking.user || {};
            const isPending = booking.status === 'pending';
            const isExpanded = expandedBookings.has(booking.id);
            const days = calculateDays(booking.start_time || booking.start_date || booking.pickup_date, 
                                      booking.end_time || booking.end_date || booking.return_date);
            const isLoading = actionLoading[booking.id];
            
            return (
              <div
                key={booking.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
                  isPending 
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-900/20 hover:shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(booking.status)}`}>
                          {booking.status?.toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{booking.id}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                          {booking.payment_status?.toUpperCase()}
                        </span>
                        {booking.payment_method && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({booking.payment_method})
                          </span>
                        )}
                        {booking.created_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{t('created_on', { date: formatDate(booking.created_at) })}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Main Content Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                        {/* Vehicle Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {listing.make && listing.model ? `${listing.make} ${listing.model}` : t('unknown_vehicle')}
                              {listing.year && ` (${listing.year})`}
                            </h3>
                          </div>
                          {listing.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{listing.location}</span>
                            </p>
                          )}
                          {listing.price_per_day && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {formatPrice(listing.price_per_day)}/day
                            </p>
                          )}
                        </div>
                        
                        {/* Customer Info */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {customer.first_name} {customer.last_name}
                            </h3>
                          </div>
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{customer.email}</span>
                              </p>
                            )}
                            {customer.phone_number && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone_number}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Booking Dates & Price */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('pickup')}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateTime(booking.start_time || booking.start_date || booking.pickup_date)}</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('return')}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateTime(booking.end_time || booking.end_date || booking.return_date)}</span>
                              </p>
                            </div>
                            <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('duration_days', { days })}</p>
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatPrice(booking.price || booking.total_price || booking.total_amount || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          {booking.special_requests && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{t('special_requests')}</span>
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{booking.special_requests}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('pickup_location')}</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.pickup_location || listing.location || t('not_available')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('return_location')}</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.return_location || listing.location || t('not_available')}</p>
                            </div>
                          </div>

                          {customer && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('customer_documents')}</p>
                              <CustomerDocuments customer={customer} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="w-full lg:w-auto lg:ml-6 flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="w-full lg:w-auto px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{t('details')}</span>
                      </button>
                      
                      <button
                        onClick={() => toggleExpand(booking.id)}
                        className="w-full lg:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all flex items-center justify-center space-x-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span>{t('less')}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span>{t('more')}</span>
                          </>
                        )}
                      </button>
                      
                      {isPending && (
                        <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleAction('accept', booking.id)}
                            disabled={isLoading}
                            className="w-full lg:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 rounded-xl hover:from-green-700 hover:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 transition-all disabled:opacity-60 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl space-x-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('processing')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>{t('accept')}</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleAction('reject', booking.id)}
                            disabled={isLoading}
                            className="w-full lg:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 rounded-xl hover:from-red-700 hover:to-red-800 dark:hover:from-red-800 dark:hover:to-red-900 transition-all disabled:opacity-60 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('processing')}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                <span>{t('reject')}</span>
                              </>
                            )}
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

