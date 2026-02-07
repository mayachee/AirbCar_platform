'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Download, Eye, UserCheck, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw, Shield, Building2, Mail, Phone, MapPin, Car, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import PartnerDetailsModal from './PartnerDetailsModal';
import { adminService } from '@/features/admin/services/adminService';
import { SelectField } from '@/components/ui/select-field';

export default function PartnersTable({ partners, loading, error, onApprove, onReject, onUnverify, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);

  // Helpers
  const getPartnerName = (p) => {
    if (p.user?.first_name && p.user?.last_name) return `${p.user.first_name} ${p.user.last_name}`;
    if (p.name) return p.name;
    if (p.user?.first_name) return p.user.first_name;
    return p.company_name || p.business_name || 'Unknown';
  };

  const getPartnerEmail = (p) => p.email || p.user?.email || 'N/A';

  const getPartnerPhone = (p) => p.phone || p.user?.phone_number || p.user?.phone || null;

  const getCompanyName = (p) => p.company_name || p.business_name || null;

  const isVerified = (p) => p.is_verified === true || p.verification_status === 'approved' || p.verification_status === 'verified';

  const getInitials = (p) => {
    const name = getPartnerName(p);
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0]?.toUpperCase() || 'P';
  };

  const getLogoUrl = (p) => p.logo_url || p.logo || null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
    return `${Math.floor(diff / 365)}y ago`;
  };

  // Stats
  const stats = useMemo(() => {
    const total = partnersList.length;
    const verified = partnersList.filter(p => isVerified(p)).length;
    const pending = total - verified;
    const totalListings = partnersList.reduce((sum, p) => sum + (parseInt(p.listings_count || p.total_listings || 0)), 0);
    const avgRating = total > 0
      ? partnersList.filter(p => p.rating > 0).reduce((sum, p) => sum + parseFloat(p.rating || 0), 0) / (partnersList.filter(p => p.rating > 0).length || 1)
      : 0;
    return { total, verified, pending, totalListings, avgRating };
  }, [partnersList]);

  // Filtering & Sorting
  const filteredPartners = useMemo(() => {
    if (!Array.isArray(partnersList) || partnersList.length === 0) return [];

    let filtered = partnersList.filter(partner => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        getPartnerName(partner).toLowerCase().includes(term) ||
        getPartnerEmail(partner).toLowerCase().includes(term) ||
        getCompanyName(partner)?.toLowerCase().includes(term) ||
        partner.tax_id?.toLowerCase().includes(term) ||
        partner.location?.toLowerCase().includes(term);

      let matchesStatus = true;
      if (statusFilter === "verified") matchesStatus = isVerified(partner);
      else if (statusFilter === "pending") matchesStatus = !isVerified(partner);

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortConfig.key) {
          case 'name':
            aVal = getPartnerName(a).toLowerCase();
            bVal = getPartnerName(b).toLowerCase();
            break;
          case 'created_at':
            aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
            bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          case 'listings_count':
            aVal = parseInt(a.listings_count || a.total_listings || 0);
            bVal = parseInt(b.listings_count || b.total_listings || 0);
            break;
          case 'rating':
            aVal = parseFloat(a.rating || 0);
            bVal = parseFloat(b.rating || 0);
            break;
          default:
            aVal = a[sortConfig.key] || '';
            bVal = b[sortConfig.key] || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [partnersList, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPartners = filteredPartners.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // Handlers
  const handleViewPartner = async (partnerId) => {
    try {
      const response = await adminService.getPartnerById(partnerId);
      const data = response?.data || response?.result?.data || response?.result || response;
      const cached = partnersList.find(p => p.id === partnerId);
      setSelectedPartner(cached || data);
      setShowDetailsModal(true);
    } catch (error) {
      const cached = partnersList.find(p => p.id === partnerId);
      if (cached) {
        setSelectedPartner(cached);
        setShowDetailsModal(true);
      } else {
        addToast(`Failed to load partner: ${error?.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleEditPartner = (partner) => {
    addToast(`Edit feature for ${getPartnerName(partner)} — coming soon`, 'info');
  };

  const handleDeletePartner = async (partnerId) => {
    const partner = partnersList.find(p => p.id === partnerId);
    const name = partner ? getPartnerName(partner) : `Partner #${partnerId}`;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
      setActionLoading(true);
      await adminService.deletePartner(partnerId);
      addToast(`${name} deleted`, 'success');
      if (onRefresh) await onRefresh();
    } catch (error) {
      addToast(`Failed to delete: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (partnerId) => {
    try {
      setActionLoading(true);
      const success = await onApprove?.(partnerId);
      if (success !== false) {
        addToast('Partner verified', 'success');
        if (onRefresh) await onRefresh();
      } else {
        addToast('Failed to verify partner', 'error');
      }
    } catch (error) {
      addToast(`Error: ${error?.message || 'Failed to verify'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (partnerId) => {
    const partner = partnersList.find(p => p.id === partnerId);
    const name = partner ? getPartnerName(partner) : 'this partner';
    if (!window.confirm(`Reject ${name}?`)) return;

    try {
      setActionLoading(true);
      const success = await onReject?.(partnerId);
      if (success !== false) {
        addToast('Partner rejected', 'success');
        if (onRefresh) await onRefresh();
      } else {
        addToast('Failed to reject partner', 'error');
      }
    } catch (error) {
      addToast(`Error: ${error?.message || 'Failed to reject'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnverify = async (partnerId) => {
    const partner = partnersList.find(p => p.id === partnerId);
    const name = partner ? getPartnerName(partner) : 'this partner';
    if (!window.confirm(`Unverify ${name}?`)) return;

    try {
      setActionLoading(true);
      const success = await onUnverify?.(partnerId);
      if (success !== false) {
        addToast('Partner unverified', 'success');
        if (onRefresh) await onRefresh();
      } else {
        addToast('Failed to unverify partner', 'error');
      }
    } catch (error) {
      addToast(`Error: ${error?.message || 'Failed to unverify'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    addToast('Partners refreshed', 'success');
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Name', 'Email', 'Phone', 'Company', 'Type', 'Status', 'Listings', 'Rating', 'Location', 'Joined'].join(','),
        ...filteredPartners.map(p => [
          p.id || '',
          `"${getPartnerName(p).replace(/"/g, '""')}"`,
          `"${getPartnerEmail(p).replace(/"/g, '""')}"`,
          `"${(getPartnerPhone(p) || '').replace(/"/g, '""')}"`,
          `"${(getCompanyName(p) || '').replace(/"/g, '""')}"`,
          p.partner_type || '',
          isVerified(p) ? 'Verified' : 'Pending',
          p.listings_count || p.total_listings || 0,
          p.rating || 0,
          `"${(p.location || '').replace(/"/g, '""')}"`,
          p.created_at ? new Date(p.created_at).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partners_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Exported successfully', 'success');
    } catch (error) {
      addToast('Export failed', 'error');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Partners</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Verified</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Listings</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalListings}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Partners Management</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredPartners.length} of {partnersList.length} partners
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'Pending' },
              ]}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error ? (
            <div className="text-center py-16">
              <XCircle className="h-16 w-16 text-red-300 dark:text-red-600 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium text-lg mb-2">Error loading partners</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                {partnersList.length === 0 ? 'No partners registered yet' : 'No partners match your filters'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {partnersList.length === 0
                  ? 'Partners will appear here once they register'
                  : 'Try adjusting your search or filters'}
              </p>
              {partnersList.length > 0 && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Partner</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Company
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 hidden lg:table-cell"
                        onClick={() => handleSort('listings_count')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Listings</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedPartners.map((partner, index) => {
                      const verified = isVerified(partner);
                      const logo = getLogoUrl(partner);

                      return (
                        <motion.tr
                          key={partner.id || partner.pk || `partner-${index}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => handleViewPartner(partner.id)}
                        >
                          {/* Partner */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                {logo ? (
                                  <img
                                    src={logo}
                                    alt={getPartnerName(partner)}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                    onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                ) : null}
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${verified ? 'from-green-400 to-green-600' : 'from-yellow-400 to-yellow-600'} ${logo ? 'hidden' : ''}`}>
                                  {getInitials(partner)}
                                </div>
                                {verified && (
                                  <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {getPartnerName(partner)}
                                </p>
                                {/* Mobile: show email + company inline */}
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden">
                                  {getPartnerEmail(partner)}
                                </p>
                                {partner.partner_type && (
                                  <span className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                                    {partner.partner_type === 'company' ? <Building2 className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                                    {partner.partner_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{getPartnerEmail(partner)}</span>
                              </div>
                              {getPartnerPhone(partner) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span>{getPartnerPhone(partner)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Company */}
                          <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                            <div>
                              {getCompanyName(partner) ? (
                                <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="truncate max-w-[150px]">{getCompanyName(partner)}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                              )}
                              {partner.location && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{partner.location}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Listings */}
                          <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                                <Car className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium">{partner.listings_count || partner.total_listings || 0}</span>
                              </div>
                              {partner.rating > 0 && (
                                <div className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{parseFloat(partner.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              verified
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Verify / Unverify */}
                              {!verified ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(partner.id); }}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                                  title="Verify"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUnverify(partner.id); }}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                                  title="Unverify"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                              {!verified && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReject(partner.id); }}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewPartner(partner.id); }}
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePartner(partner.id); }}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <SelectField
                      value={String(itemsPerPage)}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      options={[
                        { value: '10', label: '10' },
                        { value: '25', label: '25' },
                        { value: '50', label: '50' },
                      ]}
                      className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Partner Details Modal */}
      <PartnerDetailsModal
        partner={selectedPartner}
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedPartner(null); }}
        onEdit={handleEditPartner}
        onDelete={handleDeletePartner}
        onApprove={handleApprove}
        onReject={handleReject}
        onUnverify={handleUnverify}
      />
    </div>
  );
}
