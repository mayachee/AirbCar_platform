'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, DollarSign, MessageSquare, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, FileText, Building, Star, Gauge, Settings as SettingsIcon, Users, Image as ImageIcon, ExternalLink, TrendingUp, Activity, Ban, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/features/admin/services/adminService';
import CustomerDocuments from '@/features/partner/components/CustomerDocuments';

export default function BookingDetailsModal({ booking, isOpen, onClose, onAction, actionLoading, userType = 'user', onDelete }) {
  const { user: currentUser } = useAuth();
  const [fullBookingData, setFullBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && booking?.id) {
      loadFullBookingData();
      setActiveTab('overview');
    } else {
      setFullBookingData(null);
    }
  }, [isOpen, booking?.id]);

  const loadFullBookingData = async () => {
    if (!booking?.id) return;
    
    try {
      setLoading(true);
      if (userType === 'admin') {
        const response = await adminService.getBookingById?.(booking.id);
        const bookingData = response?.data || response?.result || response || booking;
        setFullBookingData(bookingData);
      } else {
        setFullBookingData(booking);
      }
    } catch (error) {
      console.error('Error loading full booking data:', error);
      setFullBookingData(booking);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  const displayBooking = fullBookingData || booking;
  const listing = displayBooking.listing || displayBooking.vehicle || {};
  const user = displayBooking.user || {};
  const partner = listing.partner || {};
  const carOwner = displayBooking.car_owner || partner?.user || {};

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
    const start = new Date(displayBooking.start_time || displayBooking.start_date || displayBooking.pickup_date);
    const end = new Date(displayBooking.end_time || displayBooking.end_date || displayBooking.dropoff_date);
    if (!start || !end || isNaN(start) || isNaN(end)) return 'N/A';
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const calculateDailyRate = () => {
    const duration = calculateDuration();
    const days = parseInt(duration) || 1;
    const total = parseFloat(displayBooking.price || displayBooking.total_price || displayBooking.total_amount || 0);
    return formatCurrency(total / days);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const canCancel = displayBooking.status === 'pending' || displayBooking.status === 'accepted';
  const canAccept = (userType === 'partner' || userType === 'admin') && displayBooking.status === 'pending';
  const canReject = (userType === 'partner' || userType === 'admin') && displayBooking.status === 'pending';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'details', label: 'Details', icon: SettingsIcon },
    ...(userType === 'partner' || userType === 'admin' ? [{ id: 'customer', label: 'Customer Documents', icon: User }] : []),
  ];

  const TabButton = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;
    return (
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-100 text-blue-700 font-semibold' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{tab.label}</span>
      </button>
    );
  };

  const timelineEvents = [];
  if (displayBooking.requested_at) {
    timelineEvents.push({ date: displayBooking.requested_at, action: 'Requested', status: 'pending' });
  }
  if (displayBooking.accepted_at) {
    timelineEvents.push({ date: displayBooking.accepted_at, action: 'Accepted', status: 'accepted' });
  }
  if (displayBooking.rejected_at) {
    timelineEvents.push({ date: displayBooking.rejected_at, action: 'Rejected', status: 'rejected' });
  }
  if (displayBooking.cancelled_at) {
    timelineEvents.push({ date: displayBooking.cancelled_at, action: 'Cancelled', status: 'cancelled' });
  }
  timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const pictures = Array.isArray(listing.pictures) ? listing.pictures : 
                  (listing.pictures ? [listing.pictures] : []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3 flex-1">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-600">Booking ID: #{displayBooking.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(displayBooking.status)}`}>
                {displayBooking.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex space-x-2 overflow-x-auto">
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
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading booking details...</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Total Price</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(displayBooking.price || displayBooking.total_price || displayBooking.total_amount)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Duration</span>
                        </div>
                        <p className="text-xl font-bold text-green-900">{calculateDuration()}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Daily Rate</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">{calculateDailyRate()}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-medium text-orange-600">Requested</span>
                        </div>
                        <p className="text-lg font-bold text-orange-900">
                          {displayBooking.requested_at ? formatDateShort(displayBooking.requested_at) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
                            {pictures.length > 0 && (
                              <div className="flex -space-x-2">
                                {pictures.slice(0, 3).map((pic, idx) => (
                                  <img
                                    key={idx}
                                    src={pic}
                                    alt={`Vehicle ${idx + 1}`}
                                    className="h-10 w-10 rounded-lg border-2 border-white object-cover"
                                    onClick={() => window.open(pic, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Make & Model</p>
                              <p className="font-medium text-gray-900">
                                {listing.make && listing.model ? `${listing.make} ${listing.model}` : 'N/A'}
                                {listing.year && ` (${listing.year})`}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>Location</span>
                              </p>
                              <p className="font-medium text-gray-900">{listing.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                <Gauge className="h-3 w-3" />
                                <span>Fuel Type</span>
                              </p>
                              <p className="font-medium text-gray-900 capitalize">{listing.fuel_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                <SettingsIcon className="h-3 w-3" />
                                <span>Transmission</span>
                              </p>
                              <p className="font-medium text-gray-900 capitalize">{listing.transmission || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>Seating</span>
                              </p>
                              <p className="font-medium text-gray-900">{listing.seating_capacity || 'N/A'} seats</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Daily Rate</p>
                              <p className="font-medium text-gray-900">{formatCurrency(listing.price_per_day)}</p>
                            </div>
                            {listing.rating && listing.rating > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>Rating</span>
                                </p>
                                <p className="font-medium text-gray-900">{listing.rating.toFixed(1)} ⭐</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Period */}
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Rental Period</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">Pickup Date & Time</p>
                          <p className="font-bold text-gray-900 text-lg">
                            {formatDate(displayBooking.start_time || displayBooking.start_date || displayBooking.pickup_date)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">Return Date & Time</p>
                          <p className="font-bold text-gray-900 text-lg">
                            {formatDate(displayBooking.end_time || displayBooking.end_date || displayBooking.dropoff_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    {userType === 'partner' || userType === 'admin' ? (
                      <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                            {user.first_name?.[0] || user.email?.[0] || 'U'}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Name</p>
                            <p className="font-medium text-gray-900">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.username || user.email || 'N/A'}
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
                    ) : null}

                    {/* Partner/Owner Information */}
                    {userType === 'user' || userType === 'admin' ? (
                      <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                            {carOwner.first_name?.[0] || carOwner.email?.[0] || partner?.company_name?.[0] || 'P'}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Owner / Partner Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Name</p>
                            <p className="font-medium text-gray-900">
                              {carOwner.first_name && carOwner.last_name
                                ? `${carOwner.first_name} ${carOwner.last_name}`
                                : carOwner.username || carOwner.email || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium text-gray-900">{carOwner.email || 'N/A'}</p>
                            </div>
                          </div>
                          {partner?.company_name && (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Company</p>
                                <p className="font-medium text-gray-900">{partner.company_name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {displayBooking.rejection_reason && (
                      <div className="bg-red-50 rounded-lg p-5 border border-red-100">
                        <div className="flex items-center space-x-3 mb-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Rejection Reason</h3>
                        </div>
                        <p className="text-gray-700 bg-white rounded-lg p-4">{displayBooking.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h3>
                    {timelineEvents.length > 0 ? (
                      <div className="space-y-4">
                        {timelineEvents.map((event, index) => {
                          const StatusIcon = getStatusIcon(event.status);
                          return (
                            <div key={index} className="flex items-start space-x-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                event.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                event.status === 'accepted' ? 'bg-green-100 text-green-600' :
                                event.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                event.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 pb-4 border-l-2 border-gray-200 pl-4">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-gray-900 capitalize">{event.action}</p>
                                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{formatDate(event.date)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No timeline events available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Documents Tab - Partner/Admin Only */}
                {(userType === 'partner' || userType === 'admin') && activeTab === 'customer' && (
                  <div className="space-y-6">
                    <CustomerDocuments 
                      bookingId={displayBooking.id} 
                      customer={displayBooking.customer || displayBooking.user}
                    />
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">Booking Information</h4>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Booking ID</p>
                          <p className="font-medium text-gray-900">#{displayBooking.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(displayBooking.status)}`}>
                            {displayBooking.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                        {displayBooking.date && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Booking Date</p>
                            <p className="font-medium text-gray-900">{formatDateShort(displayBooking.date)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Duration</p>
                          <p className="font-medium text-gray-900">{calculateDuration()}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">Pricing Details</h4>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Price</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(displayBooking.price || displayBooking.total_price || displayBooking.total_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Daily Rate</p>
                          <p className="font-medium text-gray-900">{formatCurrency(listing.price_per_day)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Calculated Daily Rate</p>
                          <p className="font-medium text-gray-900">{calculateDailyRate()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              {(canAccept || canReject || canCancel) && (
                <>
                  {canAccept && (
                    <button
                      onClick={() => onAction?.('accept', displayBooking.id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                  )}
                  {canReject && (
                    <button
                      onClick={() => onAction?.('reject', displayBooking.id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  )}
                  {canCancel && (userType === 'user' || userType === 'admin') && (
                    <button
                      onClick={() => onAction?.('cancel', displayBooking.id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {userType === 'admin' && onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete booking #${displayBooking.id}? This action cannot be undone.`)) {
                      onDelete(displayBooking.id);
                      onClose();
                    }
                  }}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
