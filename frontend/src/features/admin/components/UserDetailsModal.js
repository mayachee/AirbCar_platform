'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Phone, User, Calendar, CheckCircle, XCircle, Edit, Trash2, Shield, Building, Clock, Award, Activity, Ban, Key, ExternalLink, Car, DollarSign, MapPin, Globe, CreditCard, FileText, Image, Flag, Home, Cake, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';
import UserBookingsTab from './UserBookingsTab';
import RentalPoliciesTab from './RentalPoliciesTab';
import UserOverviewTab from './UserOverviewTab';
import UserSecurityTab from './UserSecurityTab';
import UserActivityTab from './UserActivityTab';
import { formatDate, formatCurrency, normalizeUserData, getUserRole, getUserName, getStatusColor } from '../utils/userUtils';

export default function UserDetailsModal({ user, isOpen, onClose, onEdit, onDelete, onToggleActive }) {
  // ALL STATE HOOKS MUST BE CALLED FIRST
  const [fullUserData, setFullUserData] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
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
      setBookingsError(null);
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
      // Set user-friendly error message
      if (error?.response?.status === 500) {
        setBookingsError('Unable to load bookings due to a server error. Please try again later or contact support.');
      } else if (error?.response?.status === 503) {
        setBookingsError('Database temporarily unavailable. Please try again in a few moments.');
      } else {
        setBookingsError('Failed to load bookings. Please refresh the page or try again later.');
      }
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
  const userName = getUserName(displayData);
  const userRole = getUserRole(displayData);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: `Bookings (${userBookings.length})`, icon: Car },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'policies', label: 'Rental Policies & Terms', icon: FileText },
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
                  <UserOverviewTab displayData={displayData} userRole={userRole} />
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <UserSecurityTab displayData={displayData} onToggleActive={onToggleActive} />
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <UserActivityTab displayData={displayData} userBookings={userBookings} />
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">User Bookings ({userBookings.length})</h3>
                    </div>
                    {bookingsError ? (
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 mb-1">Error Loading Bookings</p>
                            <p className="text-sm text-red-700">{bookingsError}</p>
                            <button
                              onClick={loadUserBookings}
                              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <UserBookingsTab bookings={userBookings} loading={bookingsLoading} />
                    )}
                  </div>
                )}

                {/* Rental Policies & Terms Tab */}
                {activeTab === 'policies' && <RentalPoliciesTab />}
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
