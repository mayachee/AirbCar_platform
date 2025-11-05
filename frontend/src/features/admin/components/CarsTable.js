'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Car, MapPin, DollarSign, CheckCircle, XCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Star, Gauge, Settings, Users, Image as ImageIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';
import CarDetailsModal from './CarDetailsModal';

export default function CarsTable({ listings, loading, onRefresh }) {
  const { addToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const listingsApiUrl = `${apiUrl}/listings/`;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Ensure listings is always an array
  const listingsList = Array.isArray(listings) ? listings : (listings?.results || listings?.data || []);

  // Get unique makes and locations for filters
  const uniqueMakes = useMemo(() => {
    if (!Array.isArray(listingsList)) return [];
    const makes = [...new Set(listingsList.map(l => l.make).filter(Boolean))];
    return makes.sort();
  }, [listingsList]);

  const uniqueLocations = useMemo(() => {
    if (!Array.isArray(listingsList)) return [];
    const locations = [...new Set(listingsList.map(l => l.location).filter(Boolean))];
    return locations.sort();
  }, [listingsList]);

  const filteredListings = useMemo(() => {
    if (!Array.isArray(listingsList)) {
      return [];
    }
    let filtered = listingsList.filter(listing => {
      const matchesSearch = 
        listing.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.vehicle_description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "available" && listing.availability !== false) ||
        (statusFilter === "unavailable" && listing.availability === false);
      
      const matchesMake = 
        makeFilter === "all" ||
        listing.make === makeFilter;
      
      const matchesLocation = 
        locationFilter === "all" ||
        listing.location === locationFilter;
      
      return matchesSearch && matchesStatus && matchesMake && matchesLocation;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'created_at') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        // Handle number sorting
        if (sortConfig.key === 'price_per_day' || sortConfig.key === 'year' || sortConfig.key === 'rating') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }
        
        // Handle string sorting
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [listingsList, searchTerm, statusFilter, makeFilter, locationFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, makeFilter, locationFilter]);

  const handleViewListing = async (listingId) => {
    try {
      const response = await adminService.getListingById(listingId);
      const listingData = response?.data || response?.result || response;
      const existingListing = listingsList.find(l => l.id === listingId);
      if (existingListing) {
        setSelectedListing(existingListing);
      } else {
        setSelectedListing(listingData);
      }
      setShowDetailsModal(true);
    } catch (error) {
      const existingListing = listingsList.find(l => l.id === listingId);
      if (existingListing) {
        setSelectedListing(existingListing);
        setShowDetailsModal(true);
        addToast('Loaded listing from cache (API unavailable)', 'info');
      } else {
        addToast(`Failed to load listing details: ${error?.message || 'Unknown error'}`, 'error');
        console.error('Error loading listing:', error);
      }
    }
  };

  const handleEditListing = async (listing) => {
    addToast(`Edit listing feature for ${listing.make} ${listing.model} - Coming soon`, 'info');
    console.log('Edit listing:', listing);
  };

  const handleDeleteListing = async (listingId) => {
    const listing = listingsList.find(l => l.id === listingId);
    const listingName = listing ? `${listing.make} ${listing.model} ${listing.year}` : `Listing #${listingId}`;

    if (!window.confirm(`Are you sure you want to delete ${listingName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deleteListing(listingId);
      addToast(`Listing ${listingName} deleted successfully`, 'success');

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to delete listing. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to delete listing: ${errorMessage}`, 'error');
      }
      console.error('Error deleting listing:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async (listingId, currentAvailability) => {
    try {
      setActionLoading(true);
      await adminService.updateListing(listingId, { availability: !currentAvailability });
      addToast(`Listing ${currentAvailability ? 'marked as unavailable' : 'marked as available'}`, 'success');

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to update listing. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to update listing: ${errorMessage}`, 'error');
      }
      console.error('Error updating listing:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Make', 'Model', 'Year', 'Location', 'Price/Day', 'Status', 'Fuel Type', 'Transmission', 'Seating', 'Rating', 'Created At'].join(','),
        ...filteredListings.map(listing => [
          listing.id || 'N/A',
          `"${(listing.make || 'N/A').replace(/"/g, '""')}"`,
          `"${(listing.model || 'N/A').replace(/"/g, '""')}"`,
          listing.year || 'N/A',
          `"${(listing.location || 'N/A').replace(/"/g, '""')}"`,
          listing.price_per_day || '0',
          listing.availability !== false ? 'Available' : 'Unavailable',
          listing.fuel_type || 'N/A',
          listing.transmission || 'N/A',
          listing.seating_capacity || 'N/A',
          listing.rating || '0',
          listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listings_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('Listings exported successfully', 'success');
    } catch (error) {
      addToast(`Failed to export listings: ${error?.message || 'Unknown error'}`, 'error');
      console.error('Error exporting listings:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Cars Management</h3>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected to backend"></div>
              <span className="text-xs text-gray-500">API: {apiUrl}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredListings.length)} of {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
          </p>
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            <LinkIcon className="h-3 w-3" />
            <span>Endpoint: </span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{listingsApiUrl}</code>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Make Filter */}
          {uniqueMakes.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Makes</option>
                {uniqueMakes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
          )}

          {/* Location Filter */}
          {uniqueLocations.length > 0 && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No listings found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedListings.map((listing, index) => {
                const pictures = Array.isArray(listing.pictures) ? listing.pictures : 
                                (listing.pictures ? [listing.pictures] : []);
                const mainImage = pictures[0] || null;

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all bg-white group cursor-pointer"
                    onClick={() => handleViewListing(listing.id)}
                  >
                    {/* Image */}
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
                      {mainImage ? (
                        <img 
                          src={mainImage} 
                          alt={`${listing.make} ${listing.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Car className="h-16 w-16 text-gray-400" />
                      )}
                      {listing.availability === false && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                            Unavailable
                          </span>
                        </div>
                      )}
                      {listing.rating && listing.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{listing.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 line-clamp-1">
                            {listing.make} {listing.model}
                          </h4>
                          <p className="text-sm text-gray-600">{listing.year || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          listing.availability !== false
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {listing.availability !== false ? (
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
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        {listing.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{listing.location}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-500">Price per day</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(listing.price_per_day)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {listing.fuel_type && (
                              <span className="text-xs text-gray-500" title={`Fuel: ${listing.fuel_type}`}>
                                <Gauge className="h-4 w-4" />
                              </span>
                            )}
                            {listing.seating_capacity && (
                              <span className="text-xs text-gray-500" title={`Seats: ${listing.seating_capacity}`}>
                                <Users className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewListing(listing.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditListing(listing);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit listing"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAvailability(listing.id, listing.availability !== false);
                          }}
                          disabled={actionLoading}
                          className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            listing.availability !== false
                              ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={listing.availability !== false ? 'Mark unavailable' : 'Mark available'}
                        >
                          {listing.availability !== false ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteListing(listing.id);
                          }}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete listing"
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('make')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Make/Model</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price_per_day')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Price/Day</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedListings.map((listing) => {
                    const pictures = Array.isArray(listing.pictures) ? listing.pictures : 
                                    (listing.pictures ? [listing.pictures] : []);
                    const mainImage = pictures[0] || null;

                    return (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {mainImage ? (
                              <img 
                                src={mainImage} 
                                alt={`${listing.make} ${listing.model}`}
                                className="h-12 w-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Car className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {listing.year || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {listing.make} {listing.model}
                          </div>
                          {listing.rating && listing.rating > 0 && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{listing.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{listing.location || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(listing.price_per_day)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            listing.availability !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {listing.availability !== false ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewListing(listing.id)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditListing(listing)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit listing"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(listing.id, listing.availability !== false)}
                              disabled={actionLoading}
                              className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                listing.availability !== false
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={listing.availability !== false ? 'Mark unavailable' : 'Mark available'}
                            >
                              {listing.availability !== false ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete listing"
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
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Grid view"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Table view"
                >
                  <div className="w-4 h-4 border border-current"></div>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Car Details Modal */}
      <CarDetailsModal
        listing={selectedListing}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedListing(null);
        }}
        onEdit={handleEditListing}
        onDelete={handleDeleteListing}
        onToggleAvailability={handleToggleAvailability}
      />
    </div>
  );
}

