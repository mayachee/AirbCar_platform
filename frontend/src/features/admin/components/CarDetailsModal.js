'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Car, MapPin, DollarSign, Calendar, CheckCircle, XCircle, Edit, Trash2, Building, Clock, Star, Gauge, Settings, Users, Image as ImageIcon, Tag, Eye, ExternalLink, User, Info, Mail, Phone, Globe, Award, Shield, TrendingUp, Activity, CreditCard, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';
import { useCurrency } from '@/contexts/CurrencyContext';

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

// formatCurrency is now defined inside the component using useCurrency hook

export default function CarDetailsModal({ listing, isOpen, onClose, onEdit, onDelete, onToggleAvailability }) {
  const { formatPrice } = useCurrency();
  const [fullListingData, setFullListingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return 'N/A';
    return formatPrice(num);
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Wrap loadFullListingData in useCallback to ensure stable reference
  const loadFullListingData = useCallback(async () => {
    if (!listing?.id) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading vehicle details from database for ID:', listing.id);
      
      const response = await adminService.getListingById(listing.id);
      
      console.log('📦 Vehicle Details API Response:', {
        responseType: typeof response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataType: typeof response?.data,
        dataKeys: response?.data && typeof response?.data === 'object' ? Object.keys(response?.data) : [],
        listingId: listing.id
      });
      
      // Extract data from API client response structure: { data: {...}, success: true }
      // Handle different response structures:
      let listingData = null;
      
      if (response) {
        // API client wraps response: { data: {...}, success: true }
        if (response.data) {
          listingData = response.data;
        } else if (response.result) {
          listingData = response.result;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          // Response might be the data itself
          listingData = response;
        }
      }
      
      // Fallback to passed listing if API call failed or returned no data
      if (!listingData) {
        console.warn('⚠️ No data from API, using passed listing data');
        listingData = listing;
      } else {
        console.log('✅ Successfully loaded vehicle details:', {
          id: listingData.id,
          make: listingData.make,
          model: listingData.model,
          hasPartner: !!listingData.partner,
          hasImages: !!(listingData.images || listingData.pictures),
          imagesCount: Array.isArray(listingData.images) ? listingData.images.length : (Array.isArray(listingData.pictures) ? listingData.pictures.length : 0)
        });
      }
      
      setFullListingData(listingData);
    } catch (error) {
      console.error('❌ Error loading full listing data from database:', {
        error: error.message,
        errorType: error.constructor?.name,
        listingId: listing?.id,
        isNetworkError: error?.isNetworkError,
        isTimeoutError: error?.isTimeoutError
      });
      
      // Use passed listing as fallback
      console.warn('⚠️ Using fallback listing data due to API error');
      setFullListingData(listing);
    } finally {
      setLoading(false);
    }
  }, [listing]);

  // Hook 1: Load listing data when modal opens
  useEffect(() => {
    if (isOpen && listing?.id) {
      loadFullListingData();
    } else {
      setFullListingData(null);
      setActiveTab('overview');
    }
  }, [isOpen, listing?.id, loadFullListingData]);

  // Hook 2: Debug logging - MUST be before early return
  useEffect(() => {
    if (isOpen && listing?.id) {
      const currentDisplayData = fullListingData || listing;
      if (currentDisplayData) {
        const picsArray = Array.isArray(currentDisplayData?.images) 
          ? currentDisplayData.images.filter(Boolean)
          : (Array.isArray(currentDisplayData?.pictures) ? currentDisplayData.pictures.filter(Boolean) : []);
        
        const featuresArray = Array.isArray(currentDisplayData?.features)
          ? currentDisplayData.features.filter(Boolean)
          : (currentDisplayData?.features ? [currentDisplayData.features] : []);
        
        console.log('🚗 Vehicle Details - Data Source:', {
          dataSource: fullListingData ? '✅ Database (Fresh)' : '⚠️ Cache (Fallback)',
          listingId: currentDisplayData.id,
          make: currentDisplayData.make,
          model: currentDisplayData.model,
          year: currentDisplayData.year,
          hasPartner: !!currentDisplayData.partner,
          partnerId: currentDisplayData.partner?.id,
          partnerEmail: currentDisplayData.partner?.user?.email,
          picturesCount: picsArray.length,
          featuresCount: featuresArray.length,
          location: currentDisplayData.location,
          price: currentDisplayData.price_per_day,
          availability: currentDisplayData.availability
        });
      }
    }
  }, [isOpen, listing?.id, fullListingData?.id]);

  // Normalize data from multiple sources - handle different field name variations
  // Moved before early return since it's just a function definition
  const normalizeListingData = (data) => {
    if (!data) return {};
    
    // Extract images - backend uses "images" field (JSONField array)
    let pictures = [];
    if (data.images && Array.isArray(data.images)) {
      pictures = data.images;
    } else if (data.pictures && Array.isArray(data.pictures)) {
      pictures = data.pictures;
    } else if (data.image_urls && Array.isArray(data.image_urls)) {
      pictures = data.image_urls;
    } else if (data.photo && Array.isArray(data.photo)) {
      pictures = data.photo;
    } else if (data.image) {
      pictures = Array.isArray(data.image) ? data.image : [data.image];
    } else if (data.picture) {
      pictures = Array.isArray(data.picture) ? data.picture : [data.picture];
    }
    
    // Extract features with safe JSON parsing
    let features = [];
    if (data.features) {
      if (Array.isArray(data.features)) {
        features = data.features;
      } else if (typeof data.features === 'string') {
        try {
          const parsed = JSON.parse(data.features);
          features = Array.isArray(parsed) ? parsed : [data.features];
        } catch {
          features = [data.features];
        }
      }
    } else if (data.amenities && Array.isArray(data.amenities)) {
      features = data.amenities;
    } else if (data.feature_list) {
      if (Array.isArray(data.feature_list)) {
        features = data.feature_list;
      } else if (typeof data.feature_list === 'string') {
        try {
          features = JSON.parse(data.feature_list);
          if (!Array.isArray(features)) features = [];
        } catch {
          features = [];
        }
      }
    }
    
    // Extract price with fallbacks
    const price = data.price_per_day || data.price || data.daily_rate || data.rate || data.price_per_day || null;
    
    // Extract make/model with fallbacks
    const make = data.make || data.vehicle_make || data.brand || data.car_make || null;
    const model = data.model || data.vehicle_model || data.car_model || null;
    
    return {
      id: data.id || data.listing_id || data.pk || null,
      make: make,
      model: model,
      year: data.year || data.vehicle_year || data.car_year || null,
      vehicle_name: data.vehicle_name || data.name || (make && model ? `${make} ${model}` : null) || null,
      location: data.location || data.pickup_location || data.city || data.address || null,
      price_per_day: price,
      rating: data.rating || data.vehicle_rating || data.average_rating || data.avg_rating || null,
      availability: data.availability !== undefined ? data.availability : (data.status === 'available' || data.status !== 'unavailable'),
      status: data.status || (data.availability !== false ? 'available' : 'unavailable'),
      description: data.vehicle_description || data.description || data.about || null,
      fuel_type: data.fuel_type || data.fuel || null,
      transmission: data.transmission || null,
      seating_capacity: data.seating_capacity || data.seats || data.capacity || data.num_seats || null,
      vehicle_condition: data.vehicle_condition || data.condition || null,
      pictures: pictures,
      features: features,
      partner: data.partner || data.owner || data.host || null,
      created_at: data.created_at || data.created || data.date_created || null,
      updated_at: data.updated_at || data.updated || data.last_modified || null,
      listing_id: data.listing_id || data.id || null,
      // Keep all original data for reference
      _raw: data
    };
  };


  // Early return AFTER all hooks - all hooks above are always called
  if (!isOpen || !listing) return null;

  // Compute data AFTER early return (these are not hooks, just variables)
  const rawData = fullListingData || listing;
  const displayData = normalizeListingData(rawData);
  
  // Debug logging (not hooks, just console.log)
  if (rawData) {
    console.log('🔍 Raw Listing Data:', {
      rawDataType: typeof rawData,
      rawDataKeys: Object.keys(rawData || {}),
      rawDataSample: {
        id: rawData.id,
        make: rawData.make,
        model: rawData.model,
        price_per_day: rawData.price_per_day,
        price: rawData.price,
        pictures: rawData.pictures,
        images: rawData.images
      }
    });
  }
  
  if (displayData && Object.keys(displayData).length > 0) {
    console.log('✅ Normalized Display Data:', {
      id: displayData.id,
      make: displayData.make,
      model: displayData.model,
      year: displayData.year,
      price_per_day: displayData.price_per_day,
      location: displayData.location,
      picturesCount: Array.isArray(displayData.pictures) ? displayData.pictures.length : 0,
      hasPartner: !!displayData.partner
    });
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper to calculate days ago
  const getDaysAgo = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const carName = `${displayData?.make || ''} ${displayData?.model || ''} ${displayData?.year || ''}`.trim() || displayData?.vehicle_name || 'Vehicle Listing';
  
  // Enhanced data extraction with better handling for database responses
  const pictures = (() => {
    if (!displayData?.pictures) return [];
    if (Array.isArray(displayData.pictures)) return displayData.pictures.filter(Boolean);
    if (typeof displayData.pictures === 'string') return [displayData.pictures];
    return [];
  })();
  
  const features = (() => {
    if (!displayData?.features) return [];
    if (Array.isArray(displayData.features)) return displayData.features.filter(Boolean);
    if (typeof displayData.features === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(displayData.features);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [displayData.features];
      } catch {
        return [displayData.features];
      }
    }
    return [];
  })();

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
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{carName || 'Vehicle Listing'}</h2>
                  {fullListingData && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1" title="Data loaded from database">
                      <Activity className="h-3 w-3" />
                      <span>Live</span>
                    </span>
                  )}
                  {!fullListingData && listing && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center space-x-1" title="Using cached data">
                      <Clock className="h-3 w-3" />
                      <span>Cached</span>
                    </span>
                  )}
                </div>
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
              {onToggleAvailability && displayData?.id && (
                <button
                  onClick={async () => {
                    if (!displayData?.id || togglingAvailability || loading) return;
                    
                    try {
                      setTogglingAvailability(true);
                      await onToggleAvailability(displayData.id, displayData.availability !== false);
                      
                      // Reload the listing data to show updated availability
                      setTimeout(() => {
                        loadFullListingData();
                        setTogglingAvailability(false);
                      }, 800);
                    } catch (error) {
                      console.error('Error toggling availability:', error);
                      setTogglingAvailability(false);
                    }
                  }}
                  disabled={loading || togglingAvailability || !displayData?.id}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    displayData?.availability !== false
                      ? 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  }`}
                  title={displayData?.availability !== false ? 'Mark as unavailable' : 'Mark as available'}
                >
                  {togglingAvailability ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : displayData?.availability !== false ? (
                    <>
                      <XCircle className="h-3 w-3" />
                      <span>Mark Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span>Mark Available</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={loadFullListingData}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh from database"
              >
                <Activity className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
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
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-gray-600 font-medium">Loading vehicle details from database...</span>
                <span className="text-xs text-gray-500 mt-2">Fetching ID: {listing.id}</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Enhanced Car Images Gallery */}
                    {pictures.length > 0 ? (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                            <span>Vehicle Gallery</span>
                          </h4>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {pictures.length} {pictures.length === 1 ? 'Image' : 'Images'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {pictures.map((picture, idx) => (
                            <motion.div 
                              key={idx} 
                              className="relative group cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                              onClick={() => window.open(picture, '_blank')}
                            >
                              <div className="relative h-32 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-all">
                                <img 
                                  src={picture} 
                                  alt={`${carName} - Image ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const errorDiv = e.target.nextElementSibling;
                                    if (errorDiv) errorDiv.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">Image {idx + 1}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gradient-to-br from-gray-50 to-gray-100 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No images available for this vehicle</p>
                        <p className="text-xs text-gray-500 mt-1">Images can be added through the edit function</p>
                      </div>
                    )}

                    {/* Enhanced Quick Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.div 
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <DollarSign className="h-5 w-5 opacity-90" />
                          <TrendingUp className="h-4 w-4 opacity-75" />
                        </div>
                        <p className="text-xs font-medium opacity-90 mb-1">Daily Rate</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(displayData?.price_per_day)}
                        </p>
                        <p className="text-xs opacity-75 mt-1">per day</p>
                      </motion.div>

                      {displayData?.rating && displayData.rating > 0 ? (
                        <motion.div 
                          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white shadow-lg"
                          whileHover={{ scale: 1.05, y: -2 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Star className="h-5 w-5 opacity-90 fill-white" />
                            <Activity className="h-4 w-4 opacity-75" />
                          </div>
                          <p className="text-xs font-medium opacity-90 mb-1">Rating</p>
                          <p className="text-2xl font-bold">
                            {displayData.rating.toFixed(1)}
                          </p>
                          <div className="flex space-x-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < Math.round(displayData.rating) ? 'fill-white opacity-100' : 'opacity-30'}`} 
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-gray-100 rounded-xl p-5 border-2 border-dashed border-gray-300">
                          <Star className="h-5 w-5 text-gray-400 mb-2" />
                          <p className="text-xs font-medium text-gray-500 mb-1">Rating</p>
                          <p className="text-lg font-semibold text-gray-400">No rating yet</p>
                        </div>
                      )}

                      <motion.div 
                        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Calendar className="h-5 w-5 opacity-90" />
                          <Clock className="h-4 w-4 opacity-75" />
                        </div>
                        <p className="text-xs font-medium opacity-90 mb-1">Listed Since</p>
                        <p className="text-lg font-bold">
                          {displayData?.created_at ? new Date(displayData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          {displayData?.created_at ? `${Math.floor((new Date() - new Date(displayData.created_at)) / (1000 * 60 * 60 * 24))} days ago` : ''}
                        </p>
                      </motion.div>

                      <motion.div 
                        className={`rounded-xl p-5 text-white shadow-lg ${
                          displayData?.availability !== false
                            ? 'bg-gradient-to-br from-green-500 to-green-600'
                            : 'bg-gradient-to-br from-red-500 to-red-600'
                        }`}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {displayData?.availability !== false ? (
                            <CheckCircle className="h-5 w-5 opacity-90" />
                          ) : (
                            <XCircle className="h-5 w-5 opacity-90" />
                          )}
                          <Activity className="h-4 w-4 opacity-75" />
                        </div>
                        <p className="text-xs font-medium opacity-90 mb-1">Status</p>
                        <p className="text-xl font-bold">
                          {displayData?.availability !== false ? 'Available' : 'Unavailable'}
                        </p>
                        <p className="text-xs opacity-75 mt-1">for booking</p>
                      </motion.div>
                    </div>

                    {/* Enhanced Vehicle Information Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Vehicle Details Card */}
                      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-5">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Car className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Vehicle Details</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span>Make</span>
                            </span>
                            <p className="text-sm font-semibold text-gray-900">{displayData?.make || 'N/A'}</p>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span>Model</span>
                            </span>
                            <p className="text-sm font-semibold text-gray-900">{displayData?.model || 'N/A'}</p>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Year</span>
                            </span>
                            <p className="text-sm font-semibold text-gray-900">{displayData?.year || 'N/A'}</p>
                          </div>

                          {displayData?.location && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>Location</span>
                              </span>
                              <p className="text-sm font-semibold text-gray-900">{displayData.location}</p>
                            </div>
                          )}

                          {displayData?.vehicle_name && (
                            <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                              <span className="text-sm font-medium text-gray-500">Vehicle Name</span>
                              <p className="text-sm font-semibold text-gray-900">{displayData.vehicle_name}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Listing Info Card */}
                      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-5">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Pricing & Listing</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Daily Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(displayData?.price_per_day)}
                                </p>
                              </div>
                              <DollarSign className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Listing ID</span>
                            <p className="text-sm font-semibold text-gray-900">#{displayData?.id || 'N/A'}</p>
                          </div>

                          {displayData?.created_at && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Created</span>
                              </span>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(displayData.created_at)}
                              </p>
                            </div>
                          )}

                          {displayData?.updated_at && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                                <Activity className="h-4 w-4" />
                                <span>Last Updated</span>
                              </span>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(displayData.updated_at)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Description */}
                    {displayData?.vehicle_description && (
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-100 rounded-xl p-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Info className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {displayData.vehicle_description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Specifications Tab */}
                {activeTab === 'specs' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">Vehicle Specifications</h4>
                          <p className="text-sm text-gray-500">Complete technical details and features</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Technical Specifications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayData?.fuel_type && (
                        <motion.div 
                          className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-5"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                              <Gauge className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Fuel Type</p>
                              <p className="text-lg font-bold text-gray-900 capitalize mt-1">
                                {displayData.fuel_type}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {displayData?.transmission && (
                        <motion.div 
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Settings className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Transmission</p>
                              <p className="text-lg font-bold text-gray-900 capitalize mt-1">
                                {displayData.transmission}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {displayData?.seating_capacity && (
                        <motion.div 
                          className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Seating Capacity</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {displayData.seating_capacity} {displayData.seating_capacity === 1 ? 'Person' : 'People'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {displayData?.vehicle_condition && (
                        <motion.div 
                          className={`rounded-xl p-5 border-2 ${
                            displayData.vehicle_condition === 'excellent' || displayData.vehicle_condition === 'good'
                              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                              : displayData.vehicle_condition === 'fair'
                              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                              : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                          }`}
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              displayData.vehicle_condition === 'excellent' || displayData.vehicle_condition === 'good'
                                ? 'bg-green-500'
                                : displayData.vehicle_condition === 'fair'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}>
                              <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Condition</p>
                              <p className={`text-lg font-bold mt-1 ${
                                displayData.vehicle_condition === 'excellent' || displayData.vehicle_condition === 'good'
                                  ? 'text-green-800'
                                  : displayData.vehicle_condition === 'fair'
                                  ? 'text-yellow-800'
                                  : 'text-red-800'
                              }`}>
                                {displayData.vehicle_condition.charAt(0).toUpperCase() + displayData.vehicle_condition.slice(1)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {displayData?.rating && displayData.rating > 0 && (
                        <motion.div 
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-5"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-yellow-500 rounded-lg">
                              <Star className="h-5 w-5 text-white fill-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Customer Rating</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-lg font-bold text-gray-900">
                                  {displayData.rating.toFixed(1)}
                                </p>
                                <div className="flex space-x-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < Math.round(displayData.rating) 
                                          ? 'text-yellow-500 fill-yellow-500' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {displayData?.make && displayData?.model && (
                        <motion.div 
                          className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-5"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                              <Car className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Vehicle</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {displayData.make} {displayData.model}
                              </p>
                              {displayData.year && (
                                <p className="text-xs text-gray-500">{displayData.year}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Enhanced Features Section */}
                    {features.length > 0 ? (
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Tag className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Vehicle Features</h4>
                              <p className="text-xs text-gray-500">{features.length} {features.length === 1 ? 'feature' : 'features'} available</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {features.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {features.map((feature, idx) => (
                            <motion.span 
                              key={idx}
                              className="px-4 py-2 bg-white border-2 border-purple-200 text-purple-800 rounded-lg text-sm font-medium text-center shadow-sm hover:shadow-md transition-shadow"
                              whileHover={{ scale: 1.05 }}
                            >
                              {feature}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 text-center">
                        <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">No features listed</p>
                        <p className="text-xs text-gray-500 mt-1">Features can be added when editing this vehicle</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Partner Info Tab */}
                {activeTab === 'partner' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                          <Building className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">Partner Information</h4>
                          <p className="text-sm text-gray-500">Owner and business details</p>
                        </div>
                      </div>
                    </div>
                    
                    {displayData?.partner ? (
                      <div className="space-y-6">
                        {/* Partner Profile Card */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                          <div className="flex items-start space-x-4 mb-6">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {displayData.partner?.user?.first_name?.[0]?.toUpperCase() || displayData.partner?.user?.email?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-xl font-bold text-gray-900 mb-1">
                                {displayData.partner?.user?.first_name && displayData.partner?.user?.last_name
                                  ? `${displayData.partner.user.first_name} ${displayData.partner.user.last_name}`
                                  : displayData.partner?.user?.email || 'Partner'}
                              </h5>
                              {displayData.partner?.user?.email && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{displayData.partner.user.email}</span>
                                </div>
                              )}
                              {displayData.partner?.verification_status && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  displayData.partner.verification_status === 'approved'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : displayData.partner.verification_status === 'rejected'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                }`}>
                                  {displayData.partner.verification_status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {displayData.partner.verification_status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                  {displayData.partner.verification_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {displayData.partner.verification_status.charAt(0).toUpperCase() + displayData.partner.verification_status.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Partner Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayData.partner?.company_name && (
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Building className="h-4 w-4 text-green-600" />
                                  <label className="text-xs font-medium text-gray-500">Company Name</label>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{displayData.partner.company_name}</p>
                              </div>
                            )}

                            {displayData.partner?.is_verified !== undefined && (
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <label className="text-xs font-medium text-gray-500">Verification</label>
                                </div>
                                <p className={`text-sm font-semibold ${
                                  displayData.partner.is_verified ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {displayData.partner.is_verified ? 'Verified Partner' : 'Not Verified'}
                                </p>
                              </div>
                            )}

                            {displayData.partner?.user?.phone_number && (
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <label className="text-xs font-medium text-gray-500">Phone</label>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{displayData.partner.user.phone_number}</p>
                              </div>
                            )}

                            {displayData.partner?.business_address && (
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <label className="text-xs font-medium text-gray-500">Business Address</label>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{displayData.partner.business_address}</p>
                              </div>
                            )}
                          </div>

                          {/* Additional Partner Information */}
                          {(displayData.partner?.business_license || displayData.partner?.tax_id) && (
                            <div className="mt-4 pt-4 border-t border-green-200">
                              <h6 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <Award className="h-4 w-4" />
                                <span>Business Information</span>
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayData.partner?.business_license && (
                                  <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Business License</p>
                                    <p className="text-sm font-semibold text-gray-900">{displayData.partner.business_license}</p>
                                  </div>
                                )}
                                {displayData.partner?.tax_id && (
                                  <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Tax ID</p>
                                    <p className="text-sm font-semibold text-gray-900">{displayData.partner.tax_id}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Partner information not available</p>
                        <p className="text-xs text-gray-500">This vehicle may not be associated with a partner account</p>
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
              {onToggleAvailability && displayData?.id && (
                <button
                  onClick={async () => {
                    if (!displayData?.id || togglingAvailability || loading) return;
                    
                    try {
                      setTogglingAvailability(true);
                      const newAvailability = !(displayData.availability !== false);
                      
                      await onToggleAvailability(displayData.id, displayData.availability !== false);
                      
                      // Reload the listing data to show updated availability
                      setTimeout(() => {
                        loadFullListingData();
                        setTogglingAvailability(false);
                      }, 800);
                    } catch (error) {
                      console.error('Error toggling availability:', error);
                      setTogglingAvailability(false);
                    }
                  }}
                  disabled={loading || togglingAvailability || !displayData?.id}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                    displayData?.availability !== false
                      ? 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  }`}
                  title={displayData?.availability !== false ? 'Mark this vehicle as unavailable for booking' : 'Mark this vehicle as available for booking'}
                >
                  {togglingAvailability ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : displayData?.availability !== false ? (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span>Mark Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
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

