'use client';

import { useState, useEffect } from 'react';
import { X, Car, MapPin, DollarSign, Calendar, CheckCircle, XCircle, Edit, Trash2, Building, Clock, Star, Gauge, Settings, Users, Image as ImageIcon, Tag, Eye, ExternalLink, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';

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

export default function CarDetailsModal({ listing, isOpen, onClose, onEdit, onDelete, onToggleAvailability }) {
  const [fullListingData, setFullListingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && listing?.id) {
      loadFullListingData();
    } else {
      setFullListingData(null);
      setActiveTab('overview');
    }
  }, [isOpen, listing?.id]);

  const loadFullListingData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getListingById(listing.id);
      const listingData = response?.data || response?.result || response || listing;
      setFullListingData(listingData);
    } catch (error) {
      console.error('Error loading full listing data:', error);
      setFullListingData(listing);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !listing) return null;

  const displayData = fullListingData || listing;
  const carName = `${displayData?.make || ''} ${displayData?.model || ''} ${displayData?.year || ''}`.trim();
  const pictures = Array.isArray(displayData?.pictures) ? displayData.pictures : 
                  (displayData?.pictures ? [displayData.pictures] : []);
  const features = Array.isArray(displayData?.features) ? displayData.features : 
                  (displayData?.features ? [displayData.features] : []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Car },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'partner', label: 'Partner Info', icon: Building },
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
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{carName || 'Car Listing'}</h2>
                <p className="text-sm text-gray-600">Listing #{displayData?.id}</p>
                {displayData?.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{displayData.location}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                displayData?.availability !== false
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {displayData?.availability !== false ? (
                  <>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 inline mr-1" />
                    Unavailable
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
                <span className="ml-3 text-gray-600">Loading car details...</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Car Images */}
                    {pictures.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4" />
                          <span>Car Images ({pictures.length})</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {pictures.map((picture, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={picture} 
                                alt={`${carName} - Image ${idx + 1}`}
                                className="w-full h-40 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(picture, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.nextElementSibling;
                                  if (errorDiv) errorDiv.style.display = 'flex';
                                }}
                              />
                              <div className="hidden absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No images available</p>
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Price per Day</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(displayData?.price_per_day)}
                        </p>
                      </div>
                      {displayData?.rating && displayData.rating > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-600">Rating</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-900">
                            {displayData.rating.toFixed(1)} ⭐
                          </p>
                        </div>
                      )}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Listed Since</span>
                        </div>
                        <p className="text-lg font-bold text-green-900">
                          {displayData?.created_at ? formatDate(displayData.created_at) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Vehicle Information</h4>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Make</label>
                          <p className="text-sm text-gray-900 font-medium">{displayData?.make || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Model</label>
                          <p className="text-sm text-gray-900 font-medium">{displayData?.model || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Year</label>
                          <p className="text-sm text-gray-900 font-medium">{displayData?.year || 'N/A'}</p>
                        </div>

                        {displayData?.location && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <MapPin className="h-3 w-3" />
                              <span>Location</span>
                            </label>
                            <p className="text-sm text-gray-900 font-medium">{displayData.location}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Pricing & Status</h4>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Price per Day</span>
                          </label>
                          <p className="text-lg text-gray-900 font-bold">
                            {formatCurrency(displayData?.price_per_day)}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Availability</label>
                          <p className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            displayData?.availability !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {displayData?.availability !== false ? 'Available' : 'Unavailable'}
                          </p>
                        </div>

                        {displayData?.created_at && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <Clock className="h-3 w-3" />
                              <span>Created At</span>
                            </label>
                            <p className="text-sm text-gray-900 font-medium">
                              {formatDate(displayData.created_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {displayData?.vehicle_description && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{displayData.vehicle_description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Specifications Tab */}
                {activeTab === 'specs' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Specifications</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {displayData?.fuel_type && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-2">
                              <Gauge className="h-4 w-4" />
                              <span>Fuel Type</span>
                            </label>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {displayData.fuel_type}
                            </p>
                          </div>
                        )}

                        {displayData?.transmission && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-2">
                              <Settings className="h-4 w-4" />
                              <span>Transmission</span>
                            </label>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {displayData.transmission}
                            </p>
                          </div>
                        )}

                        {displayData?.seating_capacity && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-2">
                              <Users className="h-4 w-4" />
                              <span>Seating Capacity</span>
                            </label>
                            <p className="text-lg font-semibold text-gray-900">
                              {displayData.seating_capacity} {displayData.seating_capacity === 1 ? 'Person' : 'People'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {displayData?.vehicle_condition && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-500 mb-2 block">Vehicle Condition</label>
                            <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              displayData.vehicle_condition === 'excellent' || displayData.vehicle_condition === 'good'
                                ? 'bg-green-100 text-green-800'
                                : displayData.vehicle_condition === 'fair'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {displayData.vehicle_condition.charAt(0).toUpperCase() + displayData.vehicle_condition.slice(1)}
                            </p>
                          </div>
                        )}

                        {displayData?.rating && displayData.rating > 0 && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-2">
                              <Star className="h-4 w-4" />
                              <span>Rating</span>
                            </label>
                            <p className="text-lg font-semibold text-gray-900">
                              {displayData.rating.toFixed(1)} ⭐
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span>Features ({features.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {features.map((feature, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Partner Tab */}
                {activeTab === 'partner' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Partner Information</h4>
                    
                    {displayData?.partner ? (
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                              {displayData.partner?.user?.first_name?.[0] || displayData.partner?.user?.email?.[0] || 'P'}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                {displayData.partner?.user?.first_name && displayData.partner?.user?.last_name
                                  ? `${displayData.partner.user.first_name} ${displayData.partner.user.last_name}`
                                  : displayData.partner?.user?.email || 'Partner'}
                              </h5>
                              {displayData.partner?.user?.email && (
                                <p className="text-sm text-gray-600">{displayData.partner.user.email}</p>
                              )}
                            </div>
                          </div>

                          {displayData.partner?.company_name && (
                            <div className="mb-3">
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Building className="h-3 w-3" />
                                <span>Company Name</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.partner.company_name}</p>
                            </div>
                          )}

                          {displayData.partner?.verification_status && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Verification Status</label>
                              <p className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                displayData.partner.verification_status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : displayData.partner.verification_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {displayData.partner.verification_status}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Partner information not available</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              {onToggleAvailability && (
                <button
                  onClick={() => {
                    onToggleAvailability(displayData.id, displayData.availability !== false);
                    onClose();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    displayData?.availability !== false
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {displayData?.availability !== false ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Mark Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark Available</span>
                    </>
                  )}
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
                  if (window.confirm(`Are you sure you want to delete ${carName}? This action cannot be undone.`)) {
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

