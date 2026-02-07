'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Phone, Building, MapPin, Calendar, CheckCircle, XCircle, Edit, Trash2, User, FileText, Car, Award, Clock, ExternalLink, Star, TrendingUp, Activity, Shield, Globe, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/features/admin/services/adminService';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateString; }
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateString; }
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  const num = parseFloat(amount) || 0;
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
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
    } catch {
      setFullPartnerData(partner);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !partner) return null;

  const displayData = fullPartnerData || partner;
  const userData = displayData?.user || displayData?.user_data || {};

  const listings = Array.isArray(displayData?.listings) ? displayData.listings : [];
  const totalListings = displayData?.total_listings || displayData?.listings_count || listings?.length || 0;
  const availableListings = listings?.filter(l => l.availability !== false)?.length || 0;
  const totalBookings = displayData?.total_bookings || displayData?.bookings_count || 0;
  const totalEarnings = displayData?.total_earnings || displayData?.total_revenue || displayData?.earnings || 0;
  const averageRating = parseFloat(displayData?.average_rating || displayData?.rating || 0);

  const userName = userData?.first_name && userData?.last_name
    ? `${userData.first_name} ${userData.last_name}`
    : userData?.username || displayData?.name || partner?.name || 'N/A';
  const userEmail = userData?.email || displayData?.email || partner?.email || 'N/A';
  const userPhone = userData?.phone_number || displayData?.phone || partner?.phone || null;
  const companyName = displayData?.company_name || displayData?.business_name || null;
  const isVerified = displayData?.is_verified || displayData?.verification_status === 'approved';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'listings', label: `Listings (${totalListings})`, icon: Car },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'legal', label: 'Legal Info', icon: FileText },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-gradient-to-br ${isVerified ? 'from-green-400 to-green-600' : 'from-yellow-400 to-yellow-600'}`}>
                {userName[0]?.toUpperCase() || 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{userName}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{userEmail}</p>
                {companyName && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">{companyName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isVerified
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : displayData?.verification_status === 'rejected'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
              }`}>
                {isVerified ? (
                  <><CheckCircle className="h-3 w-3 inline mr-1" />Verified</>
                ) : displayData?.verification_status === 'rejected' ? (
                  <><XCircle className="h-3 w-3 inline mr-1" />Rejected</>
                ) : (
                  <><Clock className="h-3 w-3 inline mr-1" />Pending</>
                )}
              </span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex space-x-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading partner data...</span>
              </div>
            ) : (
              <>
                {/* ===== Overview Tab ===== */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-center space-x-2 mb-1">
                          <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Listings</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{totalListings}</p>
                        {listings.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{availableListings} available</p>
                        )}
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/40">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Bookings</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-300">{totalBookings}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/40">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Earnings</span>
                        </div>
                        <p className="text-xl font-bold text-amber-900 dark:text-amber-300">{formatCurrency(totalEarnings)}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/40">
                        <div className="flex items-center space-x-2 mb-1">
                          <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Rating</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* User Information + Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>User Information</span>
                        </h3>

                        <InfoRow icon={Mail} label="Email" value={userEmail} />
                        {userPhone && <InfoRow icon={Phone} label="Phone" value={userPhone} />}
                        {userData?.username && <InfoRow icon={User} label="Username" value={userData.username} />}
                        {userData?.date_joined && <InfoRow icon={Calendar} label="Member Since" value={formatDate(userData.date_joined)} />}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Company Information</span>
                        </h3>

                        {companyName && <InfoRow icon={Building} label="Company" value={companyName} />}
                        {displayData?.address && <InfoRow icon={MapPin} label="Address" value={displayData.address} />}
                        {displayData?.city && <InfoRow icon={Globe} label="City" value={displayData.city} />}
                        {displayData?.partner_type && <InfoRow icon={Shield} label="Type" value={displayData.partner_type} capitalize />}

                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center space-x-2 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Status</span>
                          </label>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            isVerified
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : displayData?.verification_status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {displayData?.verification_status || (isVerified ? 'approved' : 'pending')}
                          </span>
                        </div>

                        {displayData?.created_at && <InfoRow icon={Calendar} label="Partner Since" value={formatDate(displayData.created_at)} />}

                        {displayData?.agree_on_terms !== undefined && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Terms Agreed</label>
                            <p className={`font-semibold ${displayData.agree_on_terms ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {displayData.agree_on_terms ? '✓ Yes' : '✗ No'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Document */}
                    {displayData?.verification_document && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Verification Document</span>
                        </h3>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {typeof displayData.verification_document === 'string'
                                ? displayData.verification_document
                                : displayData.verification_document?.name || 'Document uploaded'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Verification document</p>
                          </div>
                          {typeof displayData.verification_document === 'string' && (
                            <a
                              href={displayData.verification_document}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== Listings Tab ===== */}
                {activeTab === 'listings' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Car Listings ({totalListings})</h3>
                    {listings.length === 0 ? (
                      <div className="text-center py-12">
                        <Car className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">No listings found</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">This partner hasn't created any car listings yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {listings.map((listing) => (
                          <div key={listing.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md dark:hover:shadow-gray-800/30 transition-shadow bg-white dark:bg-gray-800/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {listing.make} {listing.model} {listing.year}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    listing.availability !== false
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                  }`}>
                                    {listing.availability !== false ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                                    <span className="ml-1.5 text-gray-900 dark:text-white">{listing.location || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                                    <span className="ml-1.5 text-gray-900 dark:text-white font-semibold">
                                      {formatCurrency(listing.price_per_day)}/jour
                                    </span>
                                  </div>
                                  {listing.rating > 0 && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                                      <span className="ml-1.5 text-gray-900 dark:text-white">
                                        <Star className="h-3 w-3 inline text-yellow-500 fill-yellow-500" /> {parseFloat(listing.rating).toFixed(1)}
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

                {/* ===== Statistics Tab ===== */}
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Performance Statistics</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Business Metrics</h4>
                        <div className="space-y-3">
                          <StatRow label="Total Listings" value={totalListings} color="text-gray-900 dark:text-white" />
                          <StatRow label="Available Listings" value={availableListings} color="text-green-600 dark:text-green-400" />
                          <StatRow label="Total Bookings" value={totalBookings} color="text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Financial Metrics</h4>
                        <div className="space-y-3">
                          <StatRow label="Total Earnings" value={formatCurrency(totalEarnings)} color="text-green-600 dark:text-green-400" />
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Average Rating</span>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {averageRating > 0 ? (
                                <><Star className="h-4 w-4 inline text-yellow-500 fill-yellow-500" /> {averageRating.toFixed(1)}</>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== Legal Info Tab ===== */}
                {activeTab === 'legal' && (
                  <div className="space-y-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Legal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayData?.tax_id && (
                        <LegalCard icon={Hash} label="Tax ID" value={displayData.tax_id} />
                      )}
                      {displayData?.license_number && (
                        <LegalCard icon={FileText} label="License Number" value={displayData.license_number} />
                      )}
                      {displayData?.business_license && (
                        <LegalCard icon={Shield} label="Business License" value={displayData.business_license} />
                      )}
                    </div>

                    {!displayData?.tax_id && !displayData?.license_number && !displayData?.business_license && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">No legal information available</p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Partner ID:</span>
                          <span className="text-gray-900 dark:text-white font-mono">{displayData?.id || 'N/A'}</span>
                        </div>
                        {displayData?.created_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Created:</span>
                            <span className="text-gray-900 dark:text-white">{formatDateTime(displayData.created_at)}</span>
                          </div>
                        )}
                        {displayData?.updated_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                            <span className="text-gray-900 dark:text-white">{formatDateTime(displayData.updated_at)}</span>
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
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              {!isVerified ? (
                <>
                  <button
                    onClick={() => { onApprove?.(displayData.id); onClose(); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Reject ${userName}?`)) { onReject?.(displayData.id); onClose(); } }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { if (window.confirm(`Unverify ${userName}?`)) { onUnverify?.(displayData.id); onClose(); } }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Unverify</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { onEdit?.(displayData); onClose(); }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => { if (window.confirm(`Delete ${userName}? This cannot be undone.`)) { onDelete?.(displayData.id); onClose(); } }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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

/* ─── Helper Sub-Components ─── */

function InfoRow({ icon: Icon, label, value, capitalize }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center space-x-2 mb-1">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </label>
      <p className={`text-gray-900 dark:text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function LegalCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800/50">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
      </div>
      <p className="text-gray-900 dark:text-white font-mono text-lg">{value}</p>
    </div>
  );
}
