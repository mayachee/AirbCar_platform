'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Download, Eye, UserCheck, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw, Shield, Building2, Mail, Phone, MapPin, Car, Star, Calendar, LayoutGrid, LayoutList, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import PartnerDetailsModal from './PartnerDetailsModal';
import { adminService } from '@/features/admin/services/adminService';

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M MAD`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K MAD`;
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)} MAD`;
};

export default function PartnersTable({ partners, loading, error, onApprove, onReject, onUnverify, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [viewMode, setViewMode] = useState('table');

  const partnersList = useMemo(() => {
    if (Array.isArray(partners)) return partners;
    return partners?.results || partners?.data || [];
  }, [partners]);

  // ── Helpers ──
  const getPartnerName = (p) => {
    if (p.user?.first_name && p.user?.last_name) return `${p.user.first_name} ${p.user.last_name}`;
    if (p.name) return p.name;
    if (p.user?.first_name) return p.user.first_name;
    return p.company_name || p.business_name || 'Unknown';
  };
  const getPartnerEmail = (p) => p.email || p.user?.email || 'N/A';
  const getPartnerPhone = (p) => p.phone || p.user?.phone_number || p.user?.phone || null;
  const getCompanyName = (p) => p.company_name || p.business_name || null;
  const getCity = (p) => p.city || p.location || p.address || null;
  const isVerified = (p) => p.is_verified === true || p.verification_status === 'approved' || p.verification_status === 'verified';
  const getLogoUrl = (p) => p.logo_url || p.logo || null;
  const getListingsCount = (p) => parseInt(p.listings_count || p.total_listings || p.listing_count || 0);
  const getRevenue = (p) => parseFloat(p.total_revenue || p.earnings || 0);
  const getRating = (p) => parseFloat(p.rating || p.average_rating || 0);

  const getInitials = (p) => {
    const name = getPartnerName(p);
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0]?.toUpperCase() || 'P';
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
    return `${Math.floor(diff / 365)}y ago`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const total = partnersList.length;
    const verified = partnersList.filter(p => isVerified(p)).length;
    const pending = total - verified;
    const totalListings = partnersList.reduce((sum, p) => sum + getListingsCount(p), 0);
    const totalRevenue = partnersList.reduce((sum, p) => sum + getRevenue(p), 0);
    const ratedPartners = partnersList.filter(p => getRating(p) > 0);
    const avgRating = ratedPartners.length > 0
      ? ratedPartners.reduce((sum, p) => sum + getRating(p), 0) / ratedPartners.length
      : 0;
    return { total, verified, pending, totalListings, totalRevenue, avgRating };
  }, [partnersList]);

  // ── Filter & Sort ──
  const filteredPartners = useMemo(() => {
    if (!partnersList.length) return [];

    let filtered = partnersList.filter(partner => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        getPartnerName(partner).toLowerCase().includes(term) ||
        getPartnerEmail(partner).toLowerCase().includes(term) ||
        (getCompanyName(partner) || '').toLowerCase().includes(term) ||
        (partner.tax_id || '').toLowerCase().includes(term) ||
        (getCity(partner) || '').toLowerCase().includes(term);

      let matchesStatus = true;
      if (statusFilter === 'verified') matchesStatus = isVerified(partner);
      else if (statusFilter === 'pending') matchesStatus = !isVerified(partner);

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortConfig.key) {
          case 'name': aVal = getPartnerName(a).toLowerCase(); bVal = getPartnerName(b).toLowerCase(); break;
          case 'created_at': aVal = a.created_at ? new Date(a.created_at).getTime() : 0; bVal = b.created_at ? new Date(b.created_at).getTime() : 0; break;
          case 'listings': aVal = getListingsCount(a); bVal = getListingsCount(b); break;
          case 'revenue': aVal = getRevenue(a); bVal = getRevenue(b); break;
          case 'rating': aVal = getRating(a); bVal = getRating(b); break;
          default: aVal = a[sortConfig.key] || ''; bVal = b[sortConfig.key] || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [partnersList, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  // ── Pagination ──
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const paginatedPartners = filteredPartners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // ── Handlers ──
  const handleViewPartner = async (partnerId) => {
    try {
      const response = await adminService.getPartnerById(partnerId);
      const data = response?.data || response?.result?.data || response?.result || response;
      setSelectedPartner(data || partnersList.find(p => p.id === partnerId));
    } catch {
      setSelectedPartner(partnersList.find(p => p.id === partnerId) || null);
    }
    setShowDetailsModal(true);
  };

  const handleDeletePartner = async (partnerId) => {
    const p = partnersList.find(x => x.id === partnerId);
    const name = p ? getPartnerName(p) : `Partner #${partnerId}`;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      setActionLoading(partnerId);
      await adminService.deletePartner(partnerId);
      addToast(`${name} deleted`, 'success');
      if (onRefresh) await onRefresh();
    } catch (err) {
      addToast(`Failed to delete: ${err?.message || 'Unknown error'}`, 'error');
    } finally { setActionLoading(null); }
  };

  const handleAction = async (type, partnerId) => {
    const p = partnersList.find(x => x.id === partnerId);
    const name = p ? getPartnerName(p) : 'this partner';
    if (type !== 'approve' && !window.confirm(`${type === 'reject' ? 'Reject' : 'Unverify'} ${name}?`)) return;
    try {
      setActionLoading(partnerId);
      const handler = type === 'approve' ? onApprove : type === 'reject' ? onReject : onUnverify;
      const success = await handler?.(partnerId);
      if (success !== false) {
        addToast(`Partner ${type === 'approve' ? 'verified' : type === 'reject' ? 'rejected' : 'unverified'}`, 'success');
        if (onRefresh) await onRefresh();
      } else { addToast(`Failed to ${type} partner`, 'error'); }
    } catch (err) {
      addToast(`Error: ${err?.message || `Failed to ${type}`}`, 'error');
    } finally { setActionLoading(null); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    addToast('Partners refreshed', 'success');
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const csv = [
        ['ID', 'Name', 'Email', 'Phone', 'Company', 'City', 'Type', 'Status', 'Listings', 'Revenue (MAD)', 'Rating', 'Joined'].join(','),
        ...filteredPartners.map(p => [
          p.id || '', `"${getPartnerName(p).replace(/"/g, '""')}"`, `"${getPartnerEmail(p).replace(/"/g, '""')}"`,
          `"${(getPartnerPhone(p) || '').replace(/"/g, '""')}"`, `"${(getCompanyName(p) || '').replace(/"/g, '""')}"`,
          `"${(getCity(p) || '').replace(/"/g, '""')}"`, p.partner_type || '',
          isVerified(p) ? 'Verified' : 'Pending', getListingsCount(p), getRevenue(p), getRating(p),
          p.created_at ? new Date(p.created_at).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `partners_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Exported successfully', 'success');
    } catch { addToast('Export failed', 'error'); }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Shared Components ──
  const SortHeader = ({ label, sortKey, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === sortKey ? 'text-blue-500' : ''}`} />
      </div>
    </th>
  );

  const StatusBadge = ({ verified }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
      verified
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    }`}>
      {verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {verified ? 'Verified' : 'Pending'}
    </span>
  );

  const ActionButtons = ({ partner, verified }) => (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {!verified ? (
        <>
          <button onClick={() => handleAction('approve', partner.id)} disabled={actionLoading === partner.id}
            className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50" title="Verify">
            <CheckCircle className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('reject', partner.id)} disabled={actionLoading === partner.id}
            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title="Reject">
            <Shield className="h-4 w-4" />
          </button>
        </>
      ) : (
        <button onClick={() => handleAction('unverify', partner.id)} disabled={actionLoading === partner.id}
          className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50" title="Unverify">
          <XCircle className="h-4 w-4" />
        </button>
      )}
      <button onClick={() => handleViewPartner(partner.id)}
        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View Details">
        <Eye className="h-4 w-4" />
      </button>
      <button onClick={() => handleDeletePartner(partner.id)} disabled={actionLoading === partner.id}
        className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const PartnerAvatar = ({ partner, verified, size = 'md' }) => {
    const logo = getLogoUrl(partner);
    const sizeClass = size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-sm';
    return (
      <div className="relative flex-shrink-0">
        {logo ? (
          <img src={logo} alt={getPartnerName(partner)}
            className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${verified ? 'from-green-400 to-green-600' : 'from-yellow-400 to-yellow-600'} ${logo ? 'hidden' : ''}`}>
          {getInitials(partner)}
        </div>
        {verified && (
          <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Partners', value: stats.total, icon: Users, color: 'text-gray-900 dark:text-white' },
          { label: 'Verified', value: stats.verified, icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
          { label: 'Pending', value: stats.pending, icon: Shield, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Total Listings', value: stats.totalListings, icon: Car, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main Container ── */}
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
              {/* View Toggle */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Table view"><LayoutList className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Grid view"><LayoutGrid className="h-4 w-4" /></button>
              </div>
              <button onClick={handleRefresh} disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search name, email, company, city..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[{ v: 'all', l: 'All' }, { v: 'verified', l: 'Verified' }, { v: 'pending', l: 'Pending' }].map(f => (
                <button key={f.v} onClick={() => setStatusFilter(f.v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === f.v ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  {f.l} {f.v === 'all' ? `(${partnersList.length})` : f.v === 'verified' ? `(${stats.verified})` : `(${stats.pending})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error ? (
            <div className="text-center py-16">
              <XCircle className="h-16 w-16 text-red-300 dark:text-red-600 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium text-lg mb-2">Error loading partners</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
              <button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Retry</button>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                {partnersList.length === 0 ? 'No partners registered yet' : 'No partners match your filters'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {partnersList.length === 0 ? 'Partners will appear here once they register' : 'Try adjusting your search or filters'}
              </p>
              {partnersList.length > 0 && (
                <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Clear Filters</button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ══════ GRID VIEW ══════ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPartners.map((partner, idx) => {
                const verified = isVerified(partner);
                return (
                  <motion.div key={partner.id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md dark:hover:shadow-gray-800/30 transition-all cursor-pointer bg-white dark:bg-gray-800/50"
                    onClick={() => handleViewPartner(partner.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PartnerAvatar partner={partner} verified={verified} size="lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getPartnerName(partner)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getPartnerEmail(partner)}</p>
                          {getCompanyName(partner) && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{getCompanyName(partner)}</p>
                          )}
                        </div>
                      </div>
                      <StatusBadge verified={verified} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Car className="h-3.5 w-3.5 text-gray-400 mx-auto mb-0.5" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{getListingsCount(partner)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Listings</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400 mx-auto mb-0.5" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(getRevenue(partner))}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Revenue</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mx-auto mb-0.5" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{getRating(partner) > 0 ? getRating(partner).toFixed(1) : '—'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Rating</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {getCity(partner) && <><MapPin className="h-3 w-3" /><span className="truncate max-w-[80px]">{getCity(partner)}</span><span className="mx-1">·</span></>}
                        <Calendar className="h-3 w-3" /><span>{formatRelativeDate(partner.created_at)}</span>
                      </div>
                      <ActionButtons partner={partner} verified={verified} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ══════ TABLE VIEW ══════ */
            <>
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <SortHeader label="Partner" sortKey="name" />
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Company / City</th>
                      <SortHeader label="Listings" sortKey="listings" className="hidden md:table-cell" />
                      <SortHeader label="Revenue" sortKey="revenue" className="hidden xl:table-cell" />
                      <SortHeader label="Joined" sortKey="created_at" className="hidden lg:table-cell" />
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedPartners.map((partner, idx) => {
                      const verified = isVerified(partner);
                      return (
                        <motion.tr key={partner.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => handleViewPartner(partner.id)}>
                          {/* Partner */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <PartnerAvatar partner={partner} verified={verified} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getPartnerName(partner)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden">{getPartnerEmail(partner)}</p>
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
                          {/* Company / City */}
                          <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                            <div>
                              {getCompanyName(partner) ? (
                                <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="truncate max-w-[140px]">{getCompanyName(partner)}</span>
                                </div>
                              ) : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                              {getCity(partner) && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{getCity(partner)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Listings */}
                          <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                                <Car className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium">{getListingsCount(partner)}</span>
                              </div>
                              {getRating(partner) > 0 && (
                                <div className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{getRating(partner).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Revenue */}
                          <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(getRevenue(partner))}</span>
                          </td>
                          {/* Joined */}
                          <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">{formatRelativeDate(partner.created_at)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(partner.created_at)}</p>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap"><StatusBadge verified={verified} /></td>
                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <ActionButtons partner={partner} verified={verified} />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Partner Details Modal ── */}
      <PartnerDetailsModal
        partner={selectedPartner}
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedPartner(null); }}
        onEdit={() => addToast('Edit feature coming soon', 'info')}
        onDelete={handleDeletePartner}
        onApprove={(id) => handleAction('approve', id)}
        onReject={(id) => handleAction('reject', id)}
        onUnverify={(id) => handleAction('unverify', id)}
      />
    </div>
  );
}
