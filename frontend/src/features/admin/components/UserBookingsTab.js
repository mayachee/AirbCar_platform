'use client';

import { useState } from 'react';
import { Car, Calendar, DollarSign, Clock, MapPin, User, Building, ChevronDown, ChevronUp, Tag, Gauge, Users, Settings, FileText, XCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch {
    return 'N/A';
  }
};

const calculateTotalPrice = (booking, listing) => {
  if (booking.price) {
    return booking.price;
  }
  if (listing?.price_per_day && booking.start_time && booking.end_time) {
    const days = calculateDuration(booking.start_time, booking.end_time);
    const daysNum = parseInt(days) || 1;
    return (parseFloat(listing.price_per_day) || 0) * daysNum;
  }
  return null;
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UserBookingsTab({ bookings, loading }) {
  const [expandedBookings, setExpandedBookings] = useState(new Set());

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No bookings found</p>
        <p className="text-gray-400 text-sm mt-1">This user hasn't made any bookings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const isExpanded = expandedBookings.has(booking.id);
        const listing = booking.listing || {};
        const carOwner = booking.car_owner || listing.partner?.user || {};
        const totalPrice = calculateTotalPrice(booking, listing);
        const duration = calculateDuration(booking.start_time, booking.end_time);

        return (
          <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Header - Always Visible */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {listing.make || 'Car'} {listing.model || ''} {listing.year || ''}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status || 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Tag className="h-3 w-3" />
                        <span>Booking #{booking.id}</span>
                      </span>
                      {duration && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{duration}</span>
                        </span>
                      )}
                      {totalPrice && (
                        <span className="flex items-center space-x-1 font-semibold text-gray-900">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(totalPrice)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(booking.id)}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="p-4 space-y-6 border-t border-gray-200">
                {/* Booking Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Booking Timeline</span>
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested:</span>
                        <span className="text-gray-900 font-medium">
                          {booking.requested_at ? formatDate(booking.requested_at) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="text-gray-900 font-medium">
                          {booking.start_time ? formatDate(booking.start_time) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date:</span>
                        <span className="text-gray-900 font-medium">
                          {booking.end_time ? formatDate(booking.end_time) : 'N/A'}
                        </span>
                      </div>
                      {booking.accepted_at && (
                        <div className="flex justify-between">
                          <span className="text-green-600">Accepted:</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(booking.accepted_at)}
                          </span>
                        </div>
                      )}
                      {booking.rejected_at && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Rejected:</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(booking.rejected_at)}
                          </span>
                        </div>
                      )}
                      {booking.cancelled_at && (
                        <div className="flex justify-between">
                          <span className="text-orange-600">Cancelled:</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(booking.cancelled_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Booking Date:</span>
                        <span className="text-gray-900 font-medium">
                          {booking.date ? formatDate(booking.date) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Pricing Details</span>
                    </h5>
                    <div className="space-y-2 text-sm">
                      {listing.price_per_day && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Daily Rate:</span>
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(listing.price_per_day)}
                          </span>
                        </div>
                      )}
                      {duration && duration !== 'N/A' && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-gray-900 font-medium">{duration}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-900 font-semibold">Total Price:</span>
                        <span className="text-gray-900 font-bold text-lg">
                          {formatCurrency(totalPrice || booking.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                {listing && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Vehicle Details</span>
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {listing.make && listing.model && (
                        <div>
                          <span className="text-xs text-gray-500">Vehicle</span>
                          <p className="text-sm font-medium text-gray-900">
                            {listing.make} {listing.model} {listing.year}
                          </p>
                        </div>
                      )}
                      {listing.location && (
                        <div>
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Location</span>
                          </span>
                          <p className="text-sm font-medium text-gray-900">{listing.location}</p>
                        </div>
                      )}
                      {listing.fuel_type && (
                        <div>
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <Gauge className="h-3 w-3" />
                            <span>Fuel</span>
                          </span>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {listing.fuel_type}
                          </p>
                        </div>
                      )}
                      {listing.transmission && (
                        <div>
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <Settings className="h-3 w-3" />
                            <span>Transmission</span>
                          </span>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {listing.transmission}
                          </p>
                        </div>
                      )}
                      {listing.seating_capacity && (
                        <div>
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>Seats</span>
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            {listing.seating_capacity}
                          </p>
                        </div>
                      )}
                      {listing.vehicle_condition && (
                        <div>
                          <span className="text-xs text-gray-500">Condition</span>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {listing.vehicle_condition}
                          </p>
                        </div>
                      )}
                      {listing.rating && (
                        <div>
                          <span className="text-xs text-gray-500">Rating</span>
                          <p className="text-sm font-medium text-gray-900">
                            ⭐ {listing.rating}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {listing.features && Array.isArray(listing.features) && listing.features.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs text-gray-500 block mb-2">Features</span>
                        <div className="flex flex-wrap gap-2">
                          {listing.features.map((feature, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {listing.vehicle_description && (
                      <div className="mt-4">
                        <span className="text-xs text-gray-500 block mb-2">Description</span>
                        <p className="text-sm text-gray-700">{listing.vehicle_description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Partner/Owner Information */}
                {carOwner && (carOwner.email || carOwner.first_name || carOwner.username) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Car Owner/Partner</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Name</span>
                        <p className="text-sm font-medium text-gray-900">
                          {carOwner.first_name && carOwner.last_name
                            ? `${carOwner.first_name} ${carOwner.last_name}`
                            : carOwner.username || carOwner.email || 'N/A'}
                        </p>
                      </div>
                      {carOwner.email && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Email</span>
                          <p className="text-sm font-medium text-gray-900">{carOwner.email}</p>
                        </div>
                      )}
                      {listing.partner?.company_name && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Company</span>
                          <p className="text-sm font-medium text-gray-900">
                            {listing.partner.company_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  {booking.request_message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Request Message</p>
                          <p className="text-sm text-blue-800">{booking.request_message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-800">{booking.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Booking Status Timeline */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Status Timeline</span>
                  </h5>
                  <div className="space-y-2">
                    {booking.requested_at && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-500">Requested on</span>
                        <span className="text-gray-900 font-medium">{formatDate(booking.requested_at)}</span>
                      </div>
                    )}
                    {booking.accepted_at && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-500">Accepted on</span>
                        <span className="text-gray-900 font-medium">{formatDate(booking.accepted_at)}</span>
                      </div>
                    )}
                    {booking.rejected_at && (
                      <div className="flex items-center space-x-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-gray-500">Rejected on</span>
                        <span className="text-gray-900 font-medium">{formatDate(booking.rejected_at)}</span>
                      </div>
                    )}
                    {booking.cancelled_at && (
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-500">Cancelled on</span>
                        <span className="text-gray-900 font-medium">{formatDate(booking.cancelled_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

