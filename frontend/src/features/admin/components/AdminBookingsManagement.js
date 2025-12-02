'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Calendar, Clock, DollarSign, User, Car, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Star, TrendingUp, AlertCircle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';
import BookingDetailsModal from '@/components/bookings/BookingDetailsModal';

export default function AdminBookingsManagement() {
  const { addToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const bookingsApiUrl = `${apiUrl}/bookings/`;
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  
  // View and pagination
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure bookings is always an array
  const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || bookings?.data || []);

  // Get unique customers and vehicles for filters
  const uniqueCustomers = useMemo(() => {
    if (!Array.isArray(bookingsList)) return [];
    const customers = bookingsList.map(b => ({
      id: b.user?.id,
      name: `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim() || b.user?.email || 'Unknown',
      email: b.user?.email
    })).filter((c, index, self) => 
      c.id && index === self.findIndex((t) => t.id === c.id)
    );
    return customers.sort((a, b) => a.name.localeCompare(b.name));
  }, [bookingsList]);

  const uniqueVehicles = useMemo(() => {
    if (!Array.isArray(bookingsList)) return [];
    const vehicles = bookingsList.map(b => ({
      id: b.listing?.id,
      name: `${b.listing?.make || ''} ${b.listing?.model || ''}`.trim() || 'Unknown Vehicle',
      make: b.listing?.make,
      model: b.listing?.model,
      year: b.listing?.year
    })).filter((v, index, self) => 
      v.id && index === self.findIndex((t) => t.id === v.id)
    );
    return vehicles.sort((a, b) => a.name.localeCompare(b.name));
  }, [bookingsList]);

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookingsList)) {
      return [];
    }
    
    let filtered = bookingsList.filter(booking => {
      // Status filter
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      // Search filter
      const matchesSearch = !searchTerm || (() => {
        const term = searchTerm.toLowerCase();
        const userEmail = booking.user?.email?.toLowerCase() || '';
        const userName = `${booking.user?.first_name || ''} ${booking.user?.last_name || ''}`.toLowerCase();
        const vehicleName = `${booking.listing?.make || ''} ${booking.listing?.model || ''}`.toLowerCase();
        const bookingId = booking.id?.toString() || '';
        const partnerName = booking.listing?.partner?.user?.email?.toLowerCase() || '';
        return userEmail.includes(term) || userName.includes(term) || vehicleName.includes(term) || 
               bookingId.includes(term) || partnerName.includes(term);
      })();
      
      // Date filter
      const matchesDate = dateFilter === 'all' || (() => {
        const now = new Date();
        const startDate = new Date(booking.start_time || booking.start_date);
        const endDate = new Date(booking.end_time || booking.end_date);
        
        switch (dateFilter) {
          case 'today':
            return startDate.toDateString() === now.toDateString();
          case 'this_week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return startDate >= weekAgo;
          case 'this_month':
            return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
          case 'upcoming':
            return startDate > now && ['pending', 'accepted'].includes(booking.status);
          case 'past':
            return endDate < now || ['completed', 'cancelled', 'rejected'].includes(booking.status);
          default:
            return true;
        }
      })();
      
      // Customer filter
      const matchesCustomer = customerFilter === 'all' || booking.user?.id === parseInt(customerFilter);
      
      // Vehicle filter
      const matchesVehicle = vehicleFilter === 'all' || booking.listing?.id === parseInt(vehicleFilter);
      
      return matchesStatus && matchesSearch && matchesDate && matchesCustomer && matchesVehicle;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested properties
        if (sortConfig.key === 'customer') {
          aValue = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim() || a.user?.email || '';
          bValue = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim() || b.user?.email || '';
        } else if (sortConfig.key === 'vehicle') {
          aValue = `${a.listing?.make || ''} ${a.listing?.model || ''}`.trim();
          bValue = `${b.listing?.make || ''} ${b.listing?.model || ''}`.trim();
        } else if (sortConfig.key === 'price') {
          aValue = parseFloat(a.price || a.total_price || 0);
          bValue = parseFloat(b.price || b.total_price || 0);
        } else if (sortConfig.key === 'start_time' || sortConfig.key === 'start_date' || sortConfig.key === 'requested_at') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [bookingsList, statusFilter, searchTerm, dateFilter, customerFilter, vehicleFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, customerFilter, vehicleFilter]);

  // Load bookings
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings, handling pagination if needed
      let allBookings = [];
      let page = 1;
      const pageSize = 100; // Request large page size to minimize requests
      const maxPages = 100; // Safety limit to prevent infinite loops
      let hasMorePages = true;
      
      // First, try to get all bookings without pagination
      try {
        const response = await adminService.getBookings();
        const responseData = response?.data || response;
        
        // Check if it's a paginated response (Django REST Framework style)
        if (responseData?.results && Array.isArray(responseData.results)) {
          allBookings = responseData.results;
          
          // Check if there are more pages
          if (responseData.next || (responseData.count && responseData.count > allBookings.length)) {
            hasMorePages = true;
            page = 2; // Start from page 2 since we already got page 1
          } else {
            hasMorePages = false;
          }
        } 
        // Check if it's a direct array
        else if (Array.isArray(responseData)) {
          allBookings = responseData;
          hasMorePages = false;
        } 
        // Check if it's nested in data
        else if (responseData?.data && Array.isArray(responseData.data)) {
          allBookings = responseData.data;
          hasMorePages = false;
        }
      } catch (firstPageError) {
        console.warn('Error fetching first page of bookings:', firstPageError);
        // Continue to try pagination if first request fails
      }
      
      // Fetch additional pages if needed
      while (hasMorePages && page <= maxPages) {
        try {
          const response = await adminService.getBookings({ page, page_size: pageSize });
          const responseData = response?.data || response;
          
          let pageBookings = [];
          
          // Extract bookings from response
          if (responseData?.results && Array.isArray(responseData.results)) {
            pageBookings = responseData.results;
            // Check if there are more pages
            hasMorePages = responseData.next !== null && responseData.next !== undefined;
          } else if (Array.isArray(responseData)) {
            pageBookings = responseData;
            hasMorePages = false;
          } else if (responseData?.data && Array.isArray(responseData.data)) {
            pageBookings = responseData.data;
            hasMorePages = false;
          } else {
            // No more data or unexpected format
            hasMorePages = false;
          }
          
          // Add bookings to the collection
          if (pageBookings.length > 0) {
            allBookings = [...allBookings, ...pageBookings];
          } else {
            // No more bookings
            hasMorePages = false;
          }
          
          page++;
          
        } catch (pageError) {
          // If pagination fails, use what we have so far
          console.warn(`Error fetching page ${page} of bookings:`, pageError);
          hasMorePages = false;
        }
      }
      
      // Remove duplicates based on ID
      const uniqueBookings = allBookings.filter((booking, index, self) =>
        index === self.findIndex((b) => b.id === booking.id)
      );
      
      setBookings(uniqueBookings);
      
      if (uniqueBookings.length > 0) {
        console.log(`Successfully loaded ${uniqueBookings.length} bookings`);
      } else {
        console.log('No bookings found');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to load bookings. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to load bookings: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    addToast('Bookings refreshed successfully', 'success');
  };

  const handleAction = async (action, bookingId, reason = null) => {
    try {
      setActionLoading(true);
      switch (action) {
        case 'accept':
          await adminService.acceptBooking(bookingId);
          addToast('Booking accepted successfully', 'success');
          break;
        case 'reject':
          // If reason is provided, we might need to send it to the backend
          // For now, just reject - backend may handle reason separately
          await adminService.rejectBooking(bookingId);
          addToast(reason ? `Booking rejected: ${reason}` : 'Booking rejected successfully', 'success');
          break;
        case 'cancel':
          await adminService.cancelBooking(bookingId);
          addToast('Booking cancelled successfully', 'success');
          break;
      }
      await loadBookings();
      setShowDetails(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to process booking action. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to ${action} booking: ${errorMessage}`, 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const booking = bookingsList.find(b => b.id === bookingId);
    const bookingInfo = booking ? `Booking #${bookingId} (${booking.user?.email || 'Unknown'})` : `Booking #${bookingId}`;

    if (!window.confirm(`Are you sure you want to delete ${bookingInfo}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deleteBooking?.(bookingId);
      addToast(`Booking ${bookingInfo} deleted successfully`, 'success');
      await loadBookings();
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to delete booking. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to delete booking: ${errorMessage}`, 'error');
      }
      console.error('Error deleting booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Try API export first
      try {
        const response = await adminService.exportBookings?.();
        if (response?.data instanceof Blob) {
          const url = window.URL.createObjectURL(response.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          addToast('Bookings exported successfully from API', 'success');
          return;
        }
      } catch (apiError) {
        console.warn('API export not available, using client-side export:', apiError);
      }

      // Fallback to client-side export
      const csvContent = [
        ['ID', 'Customer', 'Email', 'Vehicle', 'Start Date', 'End Date', 'Price', 'Status', 'Requested At', 'Partner'].join(','),
        ...filteredBookings.map(booking => [
          booking.id || 'N/A',
          `"${(`${booking.user?.first_name || ''} ${booking.user?.last_name || ''}`.trim() || 'N/A').replace(/"/g, '""')}"`,
          `"${(booking.user?.email || 'N/A').replace(/"/g, '""')}"`,
          `"${(`${booking.listing?.make || ''} ${booking.listing?.model || ''}`.trim() || 'N/A').replace(/"/g, '""')}"`,
          booking.start_time || booking.start_date ? new Date(booking.start_time || booking.start_date).toLocaleDateString() : 'N/A',
          booking.end_time || booking.end_date ? new Date(booking.end_time || booking.end_date).toLocaleDateString() : 'N/A',
          booking.price || booking.total_price || '0',
          booking.status || 'N/A',
          booking.requested_at ? new Date(booking.requested_at).toLocaleDateString() : 'N/A',
          `"${(booking.listing?.partner?.user?.email || 'N/A').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('Bookings exported successfully (client-side)', 'success');
    } catch (error) {
      addToast(`Failed to export bookings: ${error?.message || 'Unknown error'}`, 'error');
      console.error('Error exporting bookings:', error);
    }
  };

  const getStatusStats = () => {
    const stats = {
      all: bookingsList.length,
      pending: bookingsList.filter(b => b.status === 'pending').length,
      accepted: bookingsList.filter(b => b.status === 'accepted').length,
      completed: bookingsList.filter(b => b.status === 'completed').length,
      cancelled: bookingsList.filter(b => b.status === 'cancelled').length,
      rejected: bookingsList.filter(b => b.status === 'rejected').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const calculateTotalRevenue = () => {
    return bookingsList
      .filter(b => ['accepted', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || 0)), 0);
  };

  const calculateAveragePrice = () => {
    const validBookings = bookingsList.filter(b => b.price || b.total_price);
    if (validBookings.length === 0) return 0;
    const total = validBookings.reduce((sum, b) => sum + (parseFloat(b.price || b.total_price || 0)), 0);
    return total / validBookings.length;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Bookings Management</h3>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected to backend"></div>
              <span className="text-xs text-gray-500">API: {apiUrl}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </p>
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            <LinkIcon className="h-3 w-3" />
            <span>Endpoint: </span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{bookingsApiUrl}</code>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh bookings"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        {['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              statusFilter === status
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <p className="text-xs font-medium text-gray-600 capitalize mb-1">{status}</p>
            <p className="text-xl font-bold text-gray-900">{stats[status] || 0}</p>
          </button>
        ))}
        <div className="p-3 rounded-lg border-2 border-gray-200 bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-xs font-medium text-gray-600 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-900">{formatCurrency(calculateTotalRevenue())}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search bookings, customers, vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>

        {uniqueCustomers.length > 0 && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Customers</option>
              {uniqueCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
        )}

        {uniqueVehicles.length > 0 && (
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Vehicles</option>
              {uniqueVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('vehicle')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vehicle</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('start_time')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Dates</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Price</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {booking.user?.first_name?.[0] || booking.user?.email?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user?.first_name && booking.user?.last_name
                              ? `${booking.user.first_name} ${booking.user.last_name}`
                              : booking.user?.email || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">{booking.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.listing?.make} {booking.listing?.model}
                      </div>
                      <div className="text-xs text-gray-500">{booking.listing?.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.start_time || booking.start_date)}</div>
                      <div className="text-xs text-gray-500">to {formatDate(booking.end_time || booking.end_date)}</div>
                      {booking.requested_at && (
                        <div className="text-xs text-gray-400 mt-1">Requested: {formatDate(booking.requested_at)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(booking.price || booking.total_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction('accept', booking.id)}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Accept booking"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAction('reject', booking.id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Reject booking"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.status !== 'completed' && (
                          <button
                            onClick={() => handleAction('cancel', booking.id)}
                            disabled={actionLoading}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
                            title="Cancel booking"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
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
        userType="admin"
        onDelete={handleDeleteBooking}
      />
    </div>
  );
}
