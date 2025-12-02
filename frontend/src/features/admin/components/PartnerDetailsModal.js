'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Phone, Building, MapPin, Calendar, CheckCircle, XCircle, Edit, Trash2, User, FileText, Car, DollarSign, Award, Clock, Download, ExternalLink, Eye, Star, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';

// Simple date formatter
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function PartnerDetailsModal({ partner, isOpen, onClose, onEdit, onDelete, onApprove, onReject, onUnverify }) {
  const [fullPartnerData, setFullPartnerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && partner?.id) {
      loadFullPartnerData();
    } else {
      setFullPartnerData(null);
      setActiveTab('overview');
    }
  }, [isOpen, partner?.id]);

  const loadFullPartnerData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPartnerById(partner.id);
      const partnerData = response?.data || response?.result || response || partner;
      setFullPartnerData(partnerData);
    } catch (error) {
      console.error('Error loading full partner data:', error);
      // Fallback to provided partner data
      setFullPartnerData(partner);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !partner) return null;

  // Use full data if available, otherwise use provided partner data
  const displayData = fullPartnerData || partner;
  const userData = displayData?.user || displayData?.user_data || {};
  
  // Get listings
  const listings = Array.isArray(displayData?.listings) ? displayData.listings : [];
  
  // Calculate stats
  const totalListings = listings?.length || 0;
  const availableListings = listings?.filter(l => l.availability !== false)?.length || 0;
  const totalBookings = displayData?.total_bookings || displayData?.bookings_count || 0;
  const totalEarnings = displayData?.total_earnings || displayData?.earnings || 0;
  const averageRating = displayData?.average_rating || displayData?.rating || 0;

  // Get user info
  const userName = userData?.first_name && userData?.last_name 
    ? `${userData.first_name} ${userData.last_name}`
    : userData?.username || partner.name || 'N/A';
  const userEmail = userData?.email || displayData?.email || partner.email || 'N/A';
  const userPhone = userData?.phone_number || displayData?.phone || partner.phone || null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'listings', label: `Listings (${totalListings})`, icon: Car },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'legal', label: 'Legal Info', icon: FileText },
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
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                {userName[0]?.toUpperCase() || 'P'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
                <p className="text-sm text-gray-600">{userEmail}</p>
                {displayData?.company_name && (
                  <p className="text-xs text-gray-500 mt-1">{displayData.company_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                displayData?.is_verified || displayData?.verification_status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : displayData?.verification_status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {displayData?.is_verified || displayData?.verification_status === 'approved' ? (
                  <>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Verified
                  </>
                ) : displayData?.verification_status === 'rejected' ? (
                  <>
                    <XCircle className="h-3 w-3 inline mr-1" />
                    Rejected
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 inline mr-1" />
                    Pending
                  </>
                )}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
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
                <span className="ml-3 text-gray-600">Loading partner data...</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Total Listings</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{totalListings}</p>
                        <p className="text-xs text-blue-600 mt-1">{availableListings} available</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Total Bookings</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{totalBookings}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-600">Total Earnings</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totalEarnings)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Star className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Average Rating</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>User Information</span>
                        </h3>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </label>
                          <p className="text-gray-900">{userEmail}</p>
                        </div>

                        {userPhone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <Phone className="h-4 w-4" />
                              <span>Phone</span>
                            </label>
                            <p className="text-gray-900">{userPhone}</p>
                          </div>
                        )}

                        {userData?.username && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">Username</label>
                            <p className="text-gray-900">{userData.username}</p>
                          </div>
                        )}

                        {userData?.date_joined && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">Member Since</label>
                            <p className="text-gray-900">{formatDate(userData.date_joined)}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>Company Information</span>
                        </h3>
                        
                        {displayData?.company_name && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <Building className="h-4 w-4" />
                              <span>Company Name</span>
                            </label>
                            <p className="text-gray-900">{displayData.company_name}</p>
                          </div>
                        )}

                        {displayData?.address && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4" />
                              <span>Address</span>
                            </label>
                            <p className="text-gray-900">{displayData.address}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span>Verification Status</span>
                          </label>
                          <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            displayData?.verification_status === 'approved' || displayData?.is_verified
                              ? 'bg-green-100 text-green-800'
                              : displayData?.verification_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {displayData?.verification_status || 'pending'}
                          </p>
                        </div>

                        {displayData?.created_at && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">Partner Since</label>
                            <p className="text-gray-900">{formatDate(displayData.created_at)}</p>
                          </div>
                        )}

                        {displayData?.agree_on_terms !== undefined && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">Terms Agreed</label>
                            <p className="text-gray-900">
                              {displayData.agree_on_terms ? (
                                <span className="text-green-600 font-semibold">✓ Yes</span>
                              ) : (
                                <span className="text-red-600 font-semibold">✗ No</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Document */}
                    {displayData?.verification_document && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>Verification Document</span>
                        </h3>
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {typeof displayData.verification_document === 'string' 
                                ? displayData.verification_document 
                                : displayData.verification_document?.name || 'Document uploaded'}
                            </p>
                            <p className="text-xs text-gray-500">Verification document</p>
                          </div>
                          {typeof displayData.verification_document === 'string' && (
                            <a
                              href={displayData.verification_document}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Car Listings ({totalListings})</h3>
                    {listings.length === 0 ? (
                      <div className="text-center py-12">
                        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No listings found</p>
                        <p className="text-gray-400 text-sm mt-1">This partner hasn't created any car listings yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {listings.map((listing) => (
                          <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {listing.make} {listing.model} {listing.year}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    listing.availability !== false
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {listing.availability !== false ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Location:</span>
                                    <span className="ml-2 text-gray-900">{listing.location || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Price:</span>
                                    <span className="ml-2 text-gray-900 font-semibold">
                                      {formatCurrency(listing.price_per_day)}/day
                                    </span>
                                  </div>
                                  {listing.rating && (
                                    <div>
                                      <span className="text-gray-500">Rating:</span>
                                      <span className="ml-2 text-gray-900">
                                        <Star className="h-3 w-3 inline text-yellow-500" /> {listing.rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Business Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Listings</span>
                            <span className="font-semibold text-gray-900">{totalListings}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Available Listings</span>
                            <span className="font-semibold text-green-600">{availableListings}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Bookings</span>
                            <span className="font-semibold text-blue-600">{totalBookings}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Financial Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Earnings</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totalEarnings)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Average Rating</span>
                            <span className="font-semibold text-yellow-600">
                              {averageRating > 0 ? (
                                <>
                                  <Star className="h-4 w-4 inline text-yellow-500" /> {averageRating.toFixed(1)}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal Info Tab */}
                {activeTab === 'legal' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {displayData?.tax_id && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Tax ID</label>
                          <p className="text-gray-900 font-mono text-lg">{displayData.tax_id}</p>
                        </div>
                      )}

                      {displayData?.license_number && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">License Number</label>
                          <p className="text-gray-900 font-mono text-lg">{displayData.license_number}</p>
                        </div>
                      )}

                      {displayData?.business_license && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Business License</label>
                          <p className="text-gray-900 font-mono text-lg">{displayData.business_license}</p>
                        </div>
                      )}
                    </div>

                    {!displayData?.tax_id && !displayData?.license_number && !displayData?.business_license && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No legal information available</p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Partner ID:</span>
                          <span className="text-gray-900 font-mono">{displayData?.id || 'N/A'}</span>
                        </div>
                        {displayData?.created_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="text-gray-900">{formatDate(displayData.created_at)}</span>
                          </div>
                        )}
                        {displayData?.updated_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="text-gray-900">{formatDate(displayData.updated_at)}</span>
                          </div>
                        )}
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
              {!(displayData?.is_verified || displayData?.verification_status === 'approved') ? (
                <>
                  <button
                    onClick={() => {
                      onApprove?.(displayData.id);
                      onClose();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to reject ${userName}?`)) {
                        onReject?.(displayData.id);
                        onClose();
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to unverify ${userName}?`)) {
                      onUnverify?.(displayData.id);
                      onClose();
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Unverify</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onEdit?.(displayData);
                  onClose();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
                    onDelete?.(displayData.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
