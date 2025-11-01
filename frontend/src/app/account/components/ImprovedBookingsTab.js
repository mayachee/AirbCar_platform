'use client';

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { bookingService } from '@/services/api';
import BookingDetailsModal from '@/components/bookings/BookingDetailsModal';
import { useBookings } from './bookings/useBookings';
import BookingCard from './bookings/BookingCard';
import BookingFilters from './bookings/BookingFilters';
import BookingsTabs from './bookings/BookingsTabs';
import CancelBookingModal from './bookings/CancelBookingModal';
import ToastNotifications from './bookings/ToastNotifications';
import { formatCurrency, formatDateTime } from './bookings/bookingUtils';

export default function ImprovedBookingsTab() {
  const [tab, setTab] = useState('upcoming');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const {
    bookings,
    filteredBookings,
    setFilteredBookings,
    loading,
    refreshing,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
    loadBookings,
    filterBookings,
    calculateCounts
  } = useBookings();

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const filtered = filterBookings(bookings, tab, statusFilter, searchTerm, sortBy);
    setFilteredBookings(filtered);
  }, [bookings, tab, statusFilter, searchTerm, sortBy, filterBookings, setFilteredBookings]);

  const { upcomingCount, pastCount } = calculateCounts(bookings);

  const handleCancel = async (bookingId) => {
    setBookingToCancel(bookingId);
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      setActionLoading(true);
      await bookingService.cancelBooking(bookingToCancel);
      await loadBookings();
      setShowDetails(false);
      setShowCancelConfirm(false);
      setBookingToCancel(null);
      setSuccessMessage('Booking cancelled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setErrorMessage('Failed to cancel booking. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = (booking) => {
    const printWindow = window.open('', '_blank');
    const listing = booking.listing || {};
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Receipt #${booking.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            h1 { color: #ea580c; }
            h2 { border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .price { font-size: 24px; font-weight: bold; color: #ea580c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Receipt</h1>
            <p>Booking ID: #${booking.id}</p>
            <p>Status: ${booking.status?.toUpperCase()}</p>
          </div>
          <div class="details">
            <div class="section">
              <h2>Vehicle</h2>
              <p><strong>${listing.make || ''} ${listing.model || ''}</strong></p>
              <p>${listing.location || 'N/A'}</p>
            </div>
            <div class="section">
              <h2>Rental Period</h2>
              <p><strong>Pickup:</strong> ${formatDateTime(booking.start_time || booking.start_date)}</p>
              <p><strong>Return:</strong> ${formatDateTime(booking.end_time || booking.end_date)}</p>
            </div>
          </div>
          <div class="section">
            <h2>Total Price</h2>
            <p class="price">${formatCurrency(booking.price || booking.total_price)}</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleAction = async (action, bookingId) => {
    if (action === 'cancel') {
      await handleCancel(bookingId);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <ToastNotifications
        successMessage={successMessage}
        errorMessage={errorMessage}
        onSuccessDismiss={() => setSuccessMessage('')}
        onErrorDismiss={() => setErrorMessage('')}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h3>
          <p className="text-gray-600">View and manage your car rental bookings</p>
        </div>
        <button
          onClick={() => loadBookings(true)}
          disabled={refreshing || loading}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Tabs */}
      <BookingsTabs
        tab={tab}
        onTabChange={setTab}
        upcomingCount={upcomingCount}
        pastCount={pastCount}
        allCount={bookings.length}
      />

      {/* Filters */}
      <BookingFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortBy={sortBy}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onSortChange={setSortBy}
      />

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {tab === 'upcoming' && 'You have no upcoming bookings'}
            {tab === 'past' && 'You have no past bookings'}
            {tab === 'all' && 'You have no bookings yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetails={(booking) => {
                setSelectedBooking(booking);
                setShowDetails(true);
              }}
              onPrint={handlePrint}
              onCancel={handleCancel}
              actionLoading={actionLoading}
            />
          ))}
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
        userType="user"
      />

      {/* Cancel Confirmation Modal */}
      <CancelBookingModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setBookingToCancel(null);
        }}
        onConfirm={confirmCancel}
        isLoading={actionLoading}
      />
    </div>
  );
}
