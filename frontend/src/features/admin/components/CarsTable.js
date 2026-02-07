'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Car, MapPin, CheckCircle, XCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Star, Users, RefreshCw, Grid3X3, List, Fuel, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';
import CarDetailsModal from './CarDetailsModal';
import { SelectField } from '@/components/ui/select-field';

export default function CarsTable({ listings, loading, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure listings is always an array
  const listingsList = Array.isArray(listings) ? listings : (listings?.results || listings?.data || []);

  // Get unique makes and locations for filters
  const uniqueMakes = useMemo(() => {
    if (!Array.isArray(listingsList)) return [];
    return [...new Set(listingsList.map(l => l.make).filter(Boolean))].sort();
  }, [listingsList]);

  const uniqueLocations = useMemo(() => {
    if (!Array.isArray(listingsList)) return [];
    return [...new Set(listingsList.map(l => l.location).filter(Boolean))].sort();
  }, [listingsList]);

  const filteredListings = useMemo(() => {
    if (!Array.isArray(listingsList)) return [];

    let filtered = listingsList.filter(listing => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        listing.make?.toLowerCase().includes(term) ||
        listing.model?.toLowerCase().includes(term) ||
        listing.location?.toLowerCase().includes(term) ||
        listing.vehicle_description?.toLowerCase().includes(term) ||
        listing.year?.toString().includes(term) ||
        listing.color?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && listing.availability !== false && listing.is_available !== false) ||
        (statusFilter === "unavailable" && (listing.availability === false || listing.is_available === false));

      const matchesMake = makeFilter === "all" || listing.make === makeFilter;
      const matchesLocation = locationFilter === "all" || listing.location === locationFilter;

      return matchesSearch && matchesStatus && matchesMake && matchesLocation;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'created_at') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (['price_per_day', 'year', 'rating'].includes(sortConfig.key)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [listingsList, searchTerm, statusFilter, makeFilter, locationFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, makeFilter, locationFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = listingsList.length;
    const available = listingsList.filter(l => l.availability !== false && l.is_available !== false).length;
    const avgPrice = total > 0 ? listingsList.reduce((sum, l) => sum + (parseFloat(l.price_per_day) || 0), 0) / total : 0;
    const ratedListings = listingsList.filter(l => l.rating > 0);
    const avgRating = ratedListings.length > 0 ? ratedListings.reduce((sum, l) => sum + (parseFloat(l.rating) || 0), 0) / ratedListings.length : 0;
    return { total, available, unavailable: total - available, avgPrice, avgRating };
  }, [listingsList]);

  const handleViewListing = async (listingId) => {
    try {
      const response = await adminService.getListingById(listingId);
      const listingData = response?.data || response?.result || response;
      const existingListing = listingsList.find(l => l.id === listingId);
      setSelectedListing(existingListing || listingData);
      setShowDetailsModal(true);
    } catch (error) {
      const existingListing = listingsList.find(l => l.id === listingId);
      if (existingListing) {
        setSelectedListing(existingListing);
        setShowDetailsModal(true);
      } else {
        addToast(`Failed to load listing: ${error?.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleEditListing = async (listing) => {
    addToast(`Edit feature for ${listing.make} ${listing.model} — coming soon`, 'info');
  };

  const handleDeleteListing = async (listingId) => {
    const listing = listingsList.find(l => l.id === listingId);
    const name = listing ? `${listing.make} ${listing.model} ${listing.year}` : `Listing #${listingId}`;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
      setActionLoading(true);
      await adminService.deleteListing(listingId);
      addToast(`${name} deleted`, 'success');
      if (onRefresh) await onRefresh();
    } catch (error) {
      addToast(`Failed to delete: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async (listingId, currentAvailability) => {
    try {
      setActionLoading(true);
      await adminService.updateListing(listingId, { availability: !currentAvailability });
      addToast(`Listing ${currentAvailability ? 'marked unavailable' : 'marked available'}`, 'success');
      if (onRefresh) await onRefresh();
    } catch (error) {
      addToast(`Failed to update: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    addToast('Listings refreshed', 'success');
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Make', 'Model', 'Year', 'Color', 'Location', 'Price/Day (MAD)', 'Status', 'Fuel', 'Transmission', 'Seats', 'Rating', 'Partner', 'Created'].join(','),
        ...filteredListings.map(listing => [
          listing.id || '',
          `"${(listing.make || '').replace(/"/g, '""')}"`,
          `"${(listing.model || '').replace(/"/g, '""')}"`,
          listing.year || '',
          `"${(listing.color || '').replace(/"/g, '""')}"`,
          `"${(listing.location || '').replace(/"/g, '""')}"`,
          listing.price_per_day || '0',
          (listing.availability !== false && listing.is_available !== false) ? 'Available' : 'Unavailable',
          listing.fuel_type || '',
          listing.transmission || '',
          listing.seating_capacity || '',
          listing.rating || '0',
          `"${(listing.partner_name || listing.partner?.business_name || '').replace(/"/g, '""')}"`,
          listing.created_at ? new Date(listing.created_at).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Exported successfully', 'success');
    } catch (error) {
      addToast('Export failed', 'error');
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return 'N/A';
    return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' MAD';
  };

  // Get the first image from the listing — backend uses "images" field (JSONField array)
  const getListingImage = (listing) => {
    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      return listing.images[0];
    }
    if (listing.image) return listing.image;
    // Fallback for any legacy "pictures" field
    if (listing.pictures && Array.isArray(listing.pictures) && listing.pictures.length > 0) {
      return listing.pictures[0];
    }
    return null;
  };

  const isAvailable = (listing) => listing.availability !== false && listing.is_available !== false;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-44 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
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
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Available</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Price / Day</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.avgPrice)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Rating</p>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        {/* Header + Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicles Management</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredListings.length} of {listingsList.length} vehicles
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

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search make, model, location..."
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
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            {uniqueMakes.length > 0 && (
              <SelectField
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Makes' },
                  ...uniqueMakes.map(m => ({ value: m, label: m })),
                ]}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            )}

            {uniqueLocations.length > 0 && (
              <SelectField
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Locations' },
                  ...uniqueLocations.map(l => ({ value: l, label: l })),
                ]}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Car className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No vehicles found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {paginatedListings.map((listing, index) => {
                    const mainImage = getListingImage(listing);
                    const available = isAvailable(listing);

                    return (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all bg-white dark:bg-gray-800 group cursor-pointer"
                        onClick={() => handleViewListing(listing.id)}
                      >
                        {/* Image */}
                        <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden relative">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={`${listing.make} ${listing.model}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          {/* Fallback icon */}
                          <div className={`absolute inset-0 flex items-center justify-center ${mainImage ? 'hidden' : ''}`}>
                            <Car className="h-14 w-14 text-gray-300 dark:text-gray-600" />
                          </div>
                          {/* Unavailable overlay */}
                          {!available && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                                Unavailable
                              </span>
                            </div>
                          )}
                          {/* Rating badge */}
                          {listing.rating > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{parseFloat(listing.rating).toFixed(1)}</span>
                            </div>
                          )}
                          {/* Status badge */}
                          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold ${
                            available ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                          }`}>
                            {available ? 'Available' : 'Unavailable'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="mb-2">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                              {listing.make} {listing.model}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{listing.year || 'N/A'}</span>
                              {listing.color && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{listing.color}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Detail chips */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {listing.transmission && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <Settings2 className="h-3 w-3" />
                                {listing.transmission}
                              </span>
                            )}
                            {listing.fuel_type && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <Fuel className="h-3 w-3" />
                                {listing.fuel_type}
                              </span>
                            )}
                            {listing.seating_capacity && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <Users className="h-3 w-3" />
                                {listing.seating_capacity}
                              </span>
                            )}
                          </div>

                          {listing.location && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{listing.location}</span>
                            </div>
                          )}

                          {/* Price + Partner */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Per day</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(listing.price_per_day)}
                              </p>
                            </div>
                            {(listing.partner_name || listing.partner?.business_name) && (
                              <div className="text-right">
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">Partner</p>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                                  {listing.partner_name || listing.partner?.business_name}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-around">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewListing(listing.id); }}
                              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditListing(listing); }}
                              className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleAvailability(listing.id, available); }}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                available
                                  ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              title={available ? 'Disable' : 'Enable'}
                            >
                              {available ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteListing(listing.id); }}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                          onClick={() => handleSort('make')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Make / Model</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Details
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                          onClick={() => handleSort('price_per_day')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Price/Day</span>
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
                      {paginatedListings.map((listing) => {
                        const mainImage = getListingImage(listing);
                        const available = isAvailable(listing);

                        return (
                          <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {mainImage ? (
                                  <img
                                    src={mainImage}
                                    alt={`${listing.make} ${listing.model}`}
                                    className="h-10 w-14 object-cover rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="h-10 w-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <Car className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {listing.make} {listing.model}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{listing.year}</span>
                                  {listing.color && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <span className="capitalize">{listing.color}</span>
                                    </>
                                  )}
                                  {listing.rating > 0 && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <span className="flex items-center gap-0.5">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                        {parseFloat(listing.rating).toFixed(1)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate max-w-[150px]">{listing.location || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                {listing.transmission && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                                    {listing.transmission}
                                  </span>
                                )}
                                {listing.fuel_type && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                                    {listing.fuel_type}
                                  </span>
                                )}
                                {listing.seating_capacity && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {listing.seating_capacity} seats
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(listing.price_per_day)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                available
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {available ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewListing(listing.id)}
                                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditListing(listing)}
                                  className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleAvailability(listing.id, available)}
                                  disabled={actionLoading}
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                    available
                                      ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                      : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  }`}
                                  title={available ? 'Disable' : 'Enable'}
                                >
                                  {available ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <SelectField
                      value={String(itemsPerPage)}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      options={[
                        { value: '6', label: '6' },
                        { value: '12', label: '12' },
                        { value: '24', label: '24' },
                        { value: '48', label: '48' },
                      ]}
                      className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
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

      {/* Car Details Modal */}
      <CarDetailsModal
        listing={selectedListing}
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedListing(null); }}
        onEdit={handleEditListing}
        onDelete={handleDeleteListing}
        onToggleAvailability={handleToggleAvailability}
      />
    </div>
  );
}
