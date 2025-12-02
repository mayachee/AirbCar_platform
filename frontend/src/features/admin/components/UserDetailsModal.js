'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Phone, User, Calendar, CheckCircle, XCircle, Edit, Trash2, Shield, Building, Clock, Award, Activity, Ban, Key, ExternalLink, Car, DollarSign, MapPin, Globe, CreditCard, FileText, Image, Flag, Home, Cake, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';
import UserBookingsTab from './UserBookingsTab';

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

export default function UserDetailsModal({ user, isOpen, onClose, onEdit, onDelete, onToggleActive }) {
  // ALL STATE HOOKS MUST BE CALLED FIRST
  const [fullUserData, setFullUserData] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Wrap loadFullUserData in useCallback to ensure stable reference
  const loadFullUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔄 Loading user details from database for ID:', user.id);

      const response = await adminService.getUserById(user.id);

      console.log('📦 User Details API Response:', {
        responseType: typeof response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataType: typeof response?.data,
        dataKeys: response?.data && typeof response?.data === 'object' ? Object.keys(response.data) : [],
        userId: user.id
      });

      // Extract data from API client response structure: { data: {...}, success: true }
      // Handle different response structures:
      let userData = null;

      if (response) {
        // API client wraps response: { data: {...}, success: true }
        if (response.data) {
          userData = response.data;
        } else if (response.result) {
          userData = response.result;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          // Response might be the data itself
          userData = response;
        }
      }

      // Fallback to passed user if API call failed or returned no data
      if (!userData) {
        console.warn('⚠️ No data from API, using passed user data');
        userData = user;
      } else {
        console.log('✅ Successfully loaded user details:', {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          isActive: userData.is_active,
          role: userData.role
        });
      }

      setFullUserData(userData);
    } catch (error) {
      console.error('❌ Error loading full user data from database:', {
        error: error.message,
        errorType: error.constructor?.name,
        userId: user?.id,
        isNetworkError: error?.isNetworkError,
        isTimeoutError: error?.isTimeoutError
      });

      // Use passed user as fallback
      console.warn('⚠️ Using fallback user data due to API error');
      setFullUserData(user);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Hook 1: Load user data when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadFullUserData();
    } else {
      setFullUserData(null);
      setUserBookings([]);
      setActiveTab('overview');
    }
  }, [isOpen, user?.id, loadFullUserData]);

  // Wrap loadUserBookings in useCallback
  const loadUserBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setBookingsLoading(true);
      console.log('🔄 Loading user bookings for ID:', user.id);
      
      // Fetch all bookings and filter by user ID
      const response = await adminService.getBookings();
      
      console.log('📦 User Bookings API Response:', {
        responseType: typeof response,
        hasData: !!response?.data,
        userId: user.id
      });
      
      const bookingsData = response?.data || response?.results || response || [];
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : [];
      
      // Filter bookings for this user
      const filteredBookings = bookingsList.filter(booking => 
        booking.user === user.id || 
        booking.user?.id === user.id ||
        booking.user_id === user.id ||
        booking.customer === user.id ||
        booking.customer?.id === user.id ||
        booking.customer_id === user.id
      );
      
      console.log(`✅ Found ${filteredBookings.length} bookings for user ${user.id}`);
      
      // Sort by most recent first
      filteredBookings.sort((a, b) => {
        const dateA = new Date(a.requested_at || a.created_at || a.date || 0);
        const dateB = new Date(b.requested_at || b.created_at || b.date || 0);
        return dateB - dateA;
      });
      
      setUserBookings(filteredBookings);
    } catch (error) {
      console.error('❌ Error loading user bookings:', error);
      setUserBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [user]);

  // Hook 2: Load user bookings when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserBookings();
    }
  }, [isOpen, user?.id, loadUserBookings]);

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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Normalize user data from multiple sources - handle different field name variations
  const normalizeUserData = (data) => {
    if (!data) return {};
    
    return {
      id: data.id || data.pk || data.user_id || null,
      email: data.email || data.email_address || null,
      username: data.username || data.user_name || data.user || null,
      first_name: data.first_name || data.firstName || data.firstname || data.given_name || null,
      last_name: data.last_name || data.lastName || data.lastname || data.family_name || data.surname || null,
      phone_number: data.phone_number || data.phoneNumber || data.phone || data.mobile || data.telephone || null,
      address: data.address || data.street_address || data.full_address || null,
      city: data.city || data.city_name || null,
      postal_code: data.postal_code || data.postalCode || data.zip_code || data.zip || null,
      country_of_residence: data.country_of_residence || data.countryOfResidence || data.country || data.residence_country || null,
      nationality: data.nationality || data.nationality_country || null,
      default_currency: data.default_currency || data.defaultCurrency || data.currency || null,
      date_of_birth: data.date_of_birth || data.dateOfBirth || data.birthday || data.birth_date || null,
      profile_picture: data.profile_picture || data.profilePicture || data.profile_picture_url || data.avatar || data.profile_image || null,
      license_number: data.license_number || data.licenseNumber || data.driving_license_number || data.dl_number || null,
      license_origin_country: data.license_origin_country || data.licenseOriginCountry || data.dl_country || null,
      issue_date: data.issue_date || data.issueDate || data.license_issue_date || null,
      id_verification_status: data.id_verification_status || data.idVerificationStatus || data.verification_status || data.verificationStatus || data.id_status || null,
      id_front_document_url: data.id_front_document_url || data.idFrontDocumentUrl || data.id_front || data.front_document || data.id_document_front || null,
      id_back_document_url: data.id_back_document_url || data.idBackDocumentUrl || data.id_back || data.back_document || data.id_document_back || null,
      is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : (data.active !== undefined ? data.active : true)),
      is_superuser: data.is_superuser || data.isSuperuser || data.superuser || false,
      is_staff: data.is_staff || data.isStaff || data.staff || false,
      is_partner: data.is_partner || data.isPartner || data.partner || false,
      role: data.role || data.user_role || data.account_type || null,
      date_joined: data.date_joined || data.dateJoined || data.created_at || data.created || data.registration_date || null,
      last_login: data.last_login || data.lastLogin || data.last_logged_in || data.last_session || null,
      email_verified: data.email_verified !== undefined ? data.email_verified : (data.emailVerified !== undefined ? data.emailVerified : (data.verified !== undefined ? data.verified : false)),
      is_verified: data.is_verified !== undefined ? data.is_verified : (data.isVerified !== undefined ? data.isVerified : false),
      partner: data.partner || data.partner_info || data.partnerInfo || null,
      // Keep all original data for reference
      _raw: data
    };
  };

  // Debug logging hook - MUST be before early return
  useEffect(() => {
    if (isOpen && user?.id) {
      const currentRawData = fullUserData || user;
      const currentNormalizedData = normalizeUserData(currentRawData);
      console.log('👤 User Details - Data Source:', {
        dataSource: fullUserData ? '✅ Database (Fresh)' : '⚠️ Cache (Fallback)',
        userId: currentNormalizedData.id,
        email: currentNormalizedData.email,
        username: currentNormalizedData.username,
        firstName: currentNormalizedData.first_name,
        lastName: currentNormalizedData.last_name,
        isActive: currentNormalizedData.is_active,
        role: currentNormalizedData.role
      });
    }
  }, [isOpen, user?.id, fullUserData?.id]);

  // Early return AFTER all hooks - all hooks above are always called
  if (!isOpen || !user) return null;

  // Normalize data for display - handle different field names
  const rawData = fullUserData || user;
  const displayData = normalizeUserData(rawData);
  
  // Debug logging for raw and normalized data
  if (rawData) {
    console.log('🔍 Raw User Data:', {
      rawDataType: typeof rawData,
      rawDataKeys: Object.keys(rawData || {}),
      rawDataSample: {
        id: rawData.id,
        email: rawData.email,
        first_name: rawData.first_name,
        last_name: rawData.last_name
      }
    });
  }
  
  if (displayData && Object.keys(displayData).length > 0) {
    console.log('✅ Normalized User Data:', {
      id: displayData.id,
      email: displayData.email,
      username: displayData.username,
      firstName: displayData.first_name,
      lastName: displayData.last_name,
      isActive: displayData.is_active,
      role: displayData.role
    });
  }
  const userName = displayData?.first_name && displayData?.last_name
    ? `${displayData.first_name} ${displayData.last_name}`
    : displayData?.username || displayData?.email || 'User';
  
  const userRole = displayData?.is_superuser ? 'Super Admin' :
                   displayData?.is_staff ? 'Staff' :
                   displayData?.is_partner ? 'Partner' :
                   displayData?.role || 'User';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: `Bookings (${userBookings.length})`, icon: Car },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Activity },
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
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3 flex-1">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {userName[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
                  {fullUserData && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1" title="Data loaded from database">
                      <Activity className="h-3 w-3" />
                      <span>Live</span>
                    </span>
                  )}
                  {!fullUserData && user && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center space-x-1" title="Using cached data">
                      <Clock className="h-3 w-3" />
                      <span>Cached</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{displayData?.email}</p>
                {displayData?.username && (
                  <p className="text-xs text-gray-500 mt-1">@{displayData.username}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                displayData?.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {displayData?.is_active ? (
                  <>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <Ban className="h-3 w-3 inline mr-1" />
                    Inactive
                  </>
                )}
              </span>
              <button
                onClick={loadFullUserData}
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading user data...</span>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Role</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">{userRole}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Member Since</span>
                        </div>
                        <p className="text-lg font-bold text-green-900">
                          {displayData?.date_joined ? formatDate(displayData.date_joined) : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Last Login</span>
                        </div>
                        <p className="text-lg font-bold text-purple-900">
                          {displayData?.last_login ? formatDate(displayData.last_login) : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Personal Information</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Details</h4>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                              <Mail className="h-3 w-3" />
                              <span>Email Address</span>
                            </label>
                            <p className="text-sm text-gray-900 font-medium">{displayData?.email || 'N/A'}</p>
                          </div>

                          {displayData?.username && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Username</label>
                              <p className="text-sm text-gray-900 font-medium">@{displayData.username}</p>
                            </div>
                          )}

                          {displayData?.first_name && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">First Name</label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.first_name}</p>
                            </div>
                          )}

                          {displayData?.last_name && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Last Name</label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.last_name}</p>
                            </div>
                          )}

                          {displayData?.phone_number && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Phone className="h-3 w-3" />
                                <span>Phone Number</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.phone_number}</p>
                            </div>
                          )}

                          {displayData?.date_of_birth && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Cake className="h-3 w-3" />
                                <span>Date of Birth</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">
                                {formatDate(displayData.date_of_birth)}
                              </p>
                            </div>
                          )}

                          {displayData?.profile_picture && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Image className="h-3 w-3" />
                                <span>Profile Picture</span>
                              </label>
                              <div className="mt-2">
                                <img 
                                  src={displayData.profile_picture} 
                                  alt="Profile" 
                                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <a 
                                href={displayData.profile_picture} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center space-x-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>View Full Image</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Address & Location</h4>
                          
                          {displayData?.address && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Home className="h-3 w-3" />
                                <span>Address</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.address}</p>
                            </div>
                          )}

                          {displayData?.city && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <MapPin className="h-3 w-3" />
                                <span>City</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.city}</p>
                            </div>
                          )}

                          {displayData?.postal_code && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Postal Code</label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.postal_code}</p>
                            </div>
                          )}

                          {displayData?.country_of_residence && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Globe className="h-3 w-3" />
                                <span>Country of Residence</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.country_of_residence}</p>
                            </div>
                          )}

                          {displayData?.nationality && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Flag className="h-3 w-3" />
                                <span>Nationality</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.nationality}</p>
                            </div>
                          )}

                          {displayData?.default_currency && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <CreditCard className="h-3 w-3" />
                                <span>Default Currency</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{displayData.default_currency}</p>
                            </div>
                          )}
                        </div>

                        {/* License & Verification */}
                        <div className="space-y-4 md:col-span-3">
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">License & Verification</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {displayData?.license_number && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                  <FileText className="h-3 w-3" />
                                  <span>License Number</span>
                                </label>
                                <p className="text-sm text-gray-900 font-medium font-mono">{displayData.license_number}</p>
                              </div>
                            )}

                            {displayData?.license_origin_country && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                  <Flag className="h-3 w-3" />
                                  <span>License Origin Country</span>
                                </label>
                                <p className="text-sm text-gray-900 font-medium">{displayData.license_origin_country}</p>
                              </div>
                            )}

                            {displayData?.issue_date && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>License Issue Date</span>
                                </label>
                                <p className="text-sm text-gray-900 font-medium">
                                  {formatDate(displayData.issue_date)}
                                </p>
                              </div>
                            )}

                            {displayData?.id_verification_status !== undefined && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">ID Verification Status</label>
                                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  displayData.id_verification_status === 'verified' || displayData.id_verification_status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : displayData.id_verification_status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {displayData.id_verification_status || 'pending'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* ID Documents Display */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayData?.id_front_document_url && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 mb-2 block">ID Front Document</label>
                                <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-blue-400 transition-colors">
                                  <div className="bg-white rounded-lg p-2 flex items-center justify-center min-h-[200px] max-h-[400px] overflow-hidden">
                                    <img 
                                      src={displayData.id_front_document_url} 
                                      alt="ID Front Document" 
                                      className="w-full h-auto rounded-lg object-contain max-h-[350px] cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(displayData.id_front_document_url, '_blank')}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const errorDiv = e.target.nextElementSibling;
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                      }}
                                    />
                                    <div className="hidden flex-col items-center justify-center text-center text-sm text-gray-500 p-4">
                                      <FileText className="h-12 w-12 text-gray-400 mb-2" />
                                      <p className="mb-2">Document preview unavailable</p>
                                      <a 
                                        href={displayData.id_front_document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Open Document</span>
                                      </a>
                                    </div>
                                  </div>
                                  <a 
                                    href={displayData.id_front_document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center space-x-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>View Full Size in New Tab</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {displayData?.id_back_document_url && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 mb-2 block">ID Back Document</label>
                                <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-blue-400 transition-colors">
                                  <div className="bg-white rounded-lg p-2 flex items-center justify-center min-h-[200px] max-h-[400px] overflow-hidden">
                                    <img 
                                      src={displayData.id_back_document_url} 
                                      alt="ID Back Document" 
                                      className="w-full h-auto rounded-lg object-contain max-h-[350px] cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(displayData.id_back_document_url, '_blank')}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const errorDiv = e.target.nextElementSibling;
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                      }}
                                    />
                                    <div className="hidden flex-col items-center justify-center text-center text-sm text-gray-500 p-4">
                                      <FileText className="h-12 w-12 text-gray-400 mb-2" />
                                      <p className="mb-2">Document preview unavailable</p>
                                      <a 
                                        href={displayData.id_back_document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Open Document</span>
                                      </a>
                                    </div>
                                  </div>
                                  <a 
                                    href={displayData.id_back_document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center space-x-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>View Full Size in New Tab</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {!displayData?.id_front_document_url && !displayData?.id_back_document_url && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No ID documents uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-6 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Account Information</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
                            <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              displayData?.is_superuser
                                ? 'bg-red-100 text-red-800'
                                : displayData?.is_staff
                                ? 'bg-blue-100 text-blue-800'
                                : displayData?.is_partner
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userRole}
                            </p>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                            <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              displayData?.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {displayData?.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>

                          {displayData?.role && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Role Type</label>
                              <p className="text-sm text-gray-900 font-medium capitalize">{displayData.role}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {displayData?.date_joined && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                                <Calendar className="h-3 w-3" />
                                <span>Joined Date</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{formatDate(displayData.date_joined)}</p>
                            </div>
                          )}

                          {displayData?.last_login && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>Last Login</span>
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{formatDate(displayData.last_login)}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {displayData?.email_verified !== undefined && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Email Verified</label>
                              <p className="text-sm text-gray-900">
                                {displayData.email_verified ? (
                                  <span className="text-green-600 font-semibold">✓ Verified</span>
                                ) : (
                                  <span className="text-red-600 font-semibold">✗ Not Verified</span>
                                )}
                              </p>
                            </div>
                          )}

                          {displayData?.is_verified !== undefined && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Account Verified</label>
                              <p className="text-sm text-gray-900">
                                {displayData.is_verified ? (
                                  <span className="text-green-600 font-semibold">✓ Verified</span>
                                ) : (
                                  <span className="text-red-600 font-semibold">✗ Not Verified</span>
                                )}
                              </p>
                            </div>
                          )}

                          {displayData?.is_partner !== undefined && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Is Partner</label>
                              <p className="text-sm text-gray-900">
                                {displayData.is_partner ? (
                                  <span className="text-green-600 font-semibold">✓ Yes</span>
                                ) : (
                                  <span className="text-gray-600 font-semibold">✗ No</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Partner Information */}
                    {displayData?.is_partner && displayData?.partner && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>Partner Information</span>
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {displayData.partner.company_name && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-500">Company: </span>
                              <span className="text-gray-900">{displayData.partner.company_name}</span>
                            </div>
                          )}
                          {displayData.partner.verification_status && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Verification: </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                displayData.partner.verification_status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {displayData.partner.verification_status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">User ID</label>
                          <p className="text-gray-900 font-mono text-sm">{displayData?.id || 'N/A'}</p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Account Status</label>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              displayData?.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {displayData?.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => onToggleActive?.(displayData.id, !displayData.is_active)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {displayData?.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </div>

                        {displayData?.is_superuser && (
                          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Super Admin</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">This user has full system access</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Permissions</label>
                          <div className="space-y-2">
                            {displayData?.is_superuser && (
                              <div className="flex items-center space-x-2">
                                <Key className="h-3 w-3 text-red-600" />
                                <span className="text-sm text-gray-900">Super User Access</span>
                              </div>
                            )}
                            {displayData?.is_staff && (
                              <div className="flex items-center space-x-2">
                                <Shield className="h-3 w-3 text-blue-600" />
                                <span className="text-sm text-gray-900">Staff Access</span>
                              </div>
                            )}
                            {displayData?.is_partner && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-3 w-3 text-green-600" />
                                <span className="text-sm text-gray-900">Partner Access</span>
                              </div>
                            )}
                            {!displayData?.is_superuser && !displayData?.is_staff && !displayData?.is_partner && (
                              <div className="flex items-center space-x-2">
                                <User className="h-3 w-3 text-gray-600" />
                                <span className="text-sm text-gray-900">Standard User</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Last Activity</label>
                          <p className="text-gray-900 text-sm">
                            {displayData?.last_login ? formatDate(displayData.last_login) : 'Never logged in'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">User Bookings ({userBookings.length})</h3>
                    </div>
                    <UserBookingsTab bookings={userBookings} loading={bookingsLoading} />
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Activity</h3>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Account Created</p>
                            <p className="text-sm text-gray-500">{formatDate(displayData?.date_joined)}</p>
                          </div>
                        </div>
                      </div>

                      {displayData?.last_login && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Activity className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">Last Login</p>
                              <p className="text-sm text-gray-500">{formatDate(displayData.last_login)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!displayData?.last_login && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="font-medium text-gray-900">No Login Activity</p>
                              <p className="text-sm text-gray-500">This user has never logged in</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Booking Activity Summary */}
                      {userBookings.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Car className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900">Total Bookings</p>
                              <p className="text-sm text-gray-500">{userBookings.length} booking{userBookings.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Accepted: </span>
                              <span className="font-semibold text-green-600">
                                {userBookings.filter(b => b.status === 'accepted' || b.status === 'confirmed').length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Pending: </span>
                              <span className="font-semibold text-yellow-600">
                                {userBookings.filter(b => b.status === 'pending').length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Completed: </span>
                              <span className="font-semibold text-blue-600">
                                {userBookings.filter(b => b.status === 'completed').length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Cancelled: </span>
                              <span className="font-semibold text-red-600">
                                {userBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              {onToggleActive && (
                <button
                  onClick={() => {
                    onToggleActive(displayData.id, !displayData.is_active);
                    onClose();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    displayData?.is_active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {displayData?.is_active ? (
                    <>
                      <Ban className="h-4 w-4" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Activate</span>
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

