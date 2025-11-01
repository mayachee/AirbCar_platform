'use client';

import { X, Calendar, Clock, User, Car, DollarSign, MessageSquare, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BookingDebugInfo from './BookingDebugInfo';

export default function BookingDetailsModal({ booking, isOpen, onClose, onAction, actionLoading, userType = 'user' }) {
  const { user: currentUser } = useAuth();
  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const listing = booking.listing || booking.vehicle || {};
  const user = booking.user || {};
  const carOwner = booking.car_owner || booking.partner?.user || {};

  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  const canAccept = userType === 'partner' && booking.status === 'pending';
  const canReject = userType === 'partner' && booking.status === 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <p className="text-sm text-gray-500">Booking ID: #{booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
              {booking.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {booking.requested_at && (
              <p className="text-sm text-gray-500">
                Requested: {formatDate(booking.requested_at)}
              </p>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Make & Model</p>
                    <p className="font-medium text-gray-900">
                      {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'N/A'}
                      {listing.year && ` (${listing.year})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{listing.location || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-medium text-gray-900">{listing.fuel_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-medium text-gray-900">{listing.transmission || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seating Capacity</p>
                    <p className="font-medium text-gray-900">{listing.seating_capacity || 'N/A'} seats</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Daily Rate</p>
                    <p className="font-medium text-gray-900">{formatCurrency(listing.price_per_day)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Period */}
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rental Period</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pickup Date & Time</p>
                <p className="font-medium text-gray-900 text-lg">
                  {formatDate(booking.start_time || booking.start_date || booking.pickup_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Return Date & Time</p>
                <p className="font-medium text-gray-900 text-lg">
                  {formatDate(booking.end_time || booking.end_date || booking.dropoff_date)}
                </p>
              </div>
            </div>
            {booking.accepted_at && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Accepted: {formatDate(booking.accepted_at)}
                </p>
              </div>
            )}
          </div>

          {/* User Information */}
          {userType === 'partner' && user && (
            <div className="bg-green-50 rounded-lg p-5 border border-green-100">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {user.first_name || user.username} {user.last_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user.email || 'N/A'}</p>
                  </div>
                </div>
                {user.phone_number && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{user.phone_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Partner/Owner Information */}
          {userType === 'user' && carOwner && (
            <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {carOwner.first_name || carOwner.username} {carOwner.last_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{carOwner.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-orange-50 rounded-lg p-5 border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Total Price</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(booking.price || booking.total_price || booking.total_amount)}
              </p>
            </div>
          </div>

          {/* Messages */}
          {booking.request_message && (
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <div className="flex items-center space-x-3 mb-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Message</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.request_message}</p>
            </div>
          )}

          {booking.rejection_reason && (
            <div className="bg-red-50 rounded-lg p-5 border border-red-100">
              <div className="flex items-center space-x-3 mb-3">
                <MessageSquare className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Rejection Reason</h3>
              </div>
              <p className="text-gray-700">{booking.rejection_reason}</p>
            </div>
          )}

          {/* Debug Info (Development only) */}
          {process.env.NODE_ENV !== 'production' && (
            <BookingDebugInfo booking={booking} currentUser={currentUser} />
          )}

          {/* Action Buttons */}
          {(canAccept || canReject || canCancel) && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              {canAccept && (
                <button
                  onClick={() => onAction?.('accept', booking.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  <Clock className="h-5 w-5" />
                  <span>Accept Booking</span>
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => onAction?.('reject', booking.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>Reject Booking</span>
                </button>
              )}
              {canCancel && userType === 'user' && (
                <button
                  onClick={() => onAction?.('cancel', booking.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

