'use client';

import { useState, useMemo } from 'react';
import { CarFront, Edit, Trash2, Eye, Plus, Search, Filter, ArrowUpDown, MapPin, DollarSign, Users, Fuel, Calendar, Star, RefreshCw, Grid3x3, List, Copy, MoreVertical, CheckCircle2, XCircle, Wrench, TrendingUp, Eye as EyeIcon, Download } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VehiclesList({ 
  vehicles, 
  loading, 
  onAddVehicle, 
  onEditVehicle, 
  onDeleteVehicle, 
  onViewVehicle,
  onRefresh
}) {
  const { addToast } = useToast();
  const t = useTranslations('partner');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Handle undefined or null vehicles array
  const vehiclesList = vehicles || [];

  // Get vehicle image URL (handle different formats)
  const getVehicleImage = (vehicle) => {
    return getVehicleImageUrl(vehicle);
    
    // Try pictures field (alternative name)
    if (vehicle.pictures && Array.isArray(vehicle.pictures) && vehicle.pictures.length > 0) {
      const pic = vehicle.pictures[0];
      
      if (typeof pic === 'object' && pic !== null && pic.url) {
        const url = pic.url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        if (url.startsWith('/media/')) {
          const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
          return `${apiUrl}${url}`;
        }
        return url;
      }
      
      if (typeof pic === 'string') {
        if (pic.startsWith('http://') || pic.startsWith('https://')) {
          return pic;
        }
        if (pic.startsWith('/media/')) {
          const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
          return `${apiUrl}${pic}`;
        }
        if (pic.startsWith('/')) {
          return pic;
        }
        const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
        return `${apiUrl}/media/${pic}`;
      }
    }
    
    // Try direct image field
    if (vehicle.image) {
      const img = vehicle.image;
      if (typeof img === 'string') {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        if (img.startsWith('/media/')) {
          const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
          return `${apiUrl}${img}`;
        }
      }
      return img;
    }
    
    return '/carsymbol.jpg';
  };

  // Toggle vehicle selection
  const toggleVehicleSelection = (vehicleId) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  // Select all vehicles
  const selectAllVehicles = () => {
    if (selectedVehicles.length === sortedVehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(sortedVehicles.map(v => v.id));
    }
  };
  
  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehiclesList.filter(vehicle => {
      const matchesSearch = vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.vehicle_description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "available" && (vehicle.availability === true || vehicle.availability === 'available')) ||
                           (statusFilter === "rented" && vehicle.availability === 'rented') ||
                           (statusFilter === "maintenance" && vehicle.availability === 'maintenance');
      
      return matchesSearch && matchesStatus;
    });
  }, [vehiclesList, searchTerm, statusFilter]);

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const sorted = [...filteredVehicles];
    
    switch(sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateA - dateB;
        });
      case 'price-high':
        return sorted.sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0));
      case 'price-low':
        return sorted.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0));
      case 'name-asc':
        return sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'name-desc':
        return sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameB.localeCompare(nameA);
        });
      default:
        return sorted;
    }
  }, [filteredVehicles, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = vehiclesList.length;
    const available = vehiclesList.filter(v => v.availability === true || v.availability === 'available').length;
    const rented = vehiclesList.filter(v => v.availability === 'rented').length;
    const maintenance = vehiclesList.filter(v => v.availability === 'maintenance').length;
    const avgPrice = vehiclesList.length > 0
      ? vehiclesList.reduce((sum, v) => sum + (parseFloat(v.price_per_day) || 0), 0) / vehiclesList.length
      : 0;
    
    return { total, available, rented, maintenance, avgPrice };
  }, [vehiclesList]);

  // Enhanced loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          
          {/* Filters skeleton */}
          <div className="flex space-x-4">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-48 h-10 bg-gray-200 rounded"></div>
            <div className="w-48 h-10 bg-gray-200 rounded"></div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('total_vehicles')}</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <CarFront className="h-10 w-10 text-blue-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('available')}</p>
              <p className="text-3xl font-bold mt-1">{stats.available}</p>
            </div>
            <Users className="h-10 w-10 text-green-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">{t('stat_average_price')}</p>
              <p className="text-3xl font-bold mt-1">${stats.avgPrice.toFixed(0)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-yellow-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t('active_bookings')}</p>
              <p className="text-3xl font-bold mt-1">{stats.rented}</p>
            </div>
            <Calendar className="h-10 w-10 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('vehicles_list')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('manage_and_track_vehicles')}
            </p>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <button
                onClick={() => {
                  onRefresh();
                  addToast(t('refreshed_vehicle_list'), 'info');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={t('refresh')}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onAddVehicle}
              className="flex items-center space-x-2 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>{t('add_vehicle')}</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('search_by_make_model_location')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <SelectField
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_vehicles') },
                  { value: 'available', label: t('available') },
                  { value: 'rented', label: t('rented') },
                  { value: 'maintenance', label: t('maintenance') },
                ]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <SelectField
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'newest', label: t('newest_first') },
                  { value: 'oldest', label: t('oldest_first') },
                  { value: 'price-high', label: t('price_high_to_low') },
                  { value: 'price-low', label: t('price_low_to_high') },
                  { value: 'name-asc', label: t('name_a_to_z') },
                  { value: 'name-desc', label: t('name_z_to_a') },
                ]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* View Mode Toggle and Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-blue-500 dark:bg-blue-600 text-white" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={t('grid_view')}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-blue-500 dark:bg-blue-600 text-white" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={t('list_view')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {selectedVehicles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('selected_count', { count: selectedVehicles.length })}
                </span>
                <button
                  onClick={() => setSelectedVehicles([])}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('clear_selection')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        {filteredVehicles.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('showing_results', { visible: sortedVehicles.length, total: vehiclesList.length })}
            {searchTerm && ` ${t('matching_search', { term: searchTerm })}`}
          </p>
        )}

        {/* Bulk Actions Bar */}
        {selectedVehicles.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium text-blue-900 dark:text-blue-200">
                {t('vehicles_selected', { count: selectedVehicles.length })}
              </span>
              <button
                onClick={selectAllVehicles}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {selectedVehicles.length === sortedVehicles.length ? t('deselect_all') : t('select_all')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                {t('bulk_edit')}
              </button>
              <button className="px-3 py-1 text-sm bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700">
                {t('delete_selected')}
              </button>
            </div>
          </div>
        )}

        {/* Vehicle Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {sortedVehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className={`border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 group ${
                viewMode === "grid" ? "p-5" : "p-4 flex gap-4"
              }`}
            >
              {/* Vehicle Image */}
              <div className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer ${
                viewMode === "grid" ? "mb-4 h-48" : "w-48 h-32 flex-shrink-0"
              }`} onClick={() => onViewVehicle(vehicle)}>
                <img 
                  src={getVehicleImage(vehicle)} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/carsymbol.jpg';
                  }}
                />
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedVehicles.includes(vehicle.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleVehicleSelection(vehicle.id);
                    }}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-800"
                  />
                </div>
                
                {/* Rating Badge */}
                {vehicle.rating && vehicle.rating > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-semibold text-gray-900 dark:text-white z-10">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span>{vehicle.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Availability Badge */}
                <div className={`absolute ${vehicle.rating && vehicle.rating > 0 ? 'top-10' : 'top-2'} right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10 ${
                  vehicle.is_available === true || vehicle.is_available === 'available' || vehicle.availability === true || vehicle.availability === 'available'
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : vehicle.availability === 'rented'
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : 'bg-red-500 dark:bg-red-600 text-white'
                }`}>
                  {vehicle.is_available === true || vehicle.availability === true || vehicle.availability === 'available' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{t('available')}</span>
                    </>
                  ) : vehicle.availability === 'rented' ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      <span>{t('rented')}</span>
                    </>
                  ) : vehicle.availability === 'maintenance' ? (
                    <>
                      <Wrench className="h-3 w-3" />
                      <span>{t('maintenance')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      <span>{t('unavailable')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className={`${viewMode === "grid" ? "mb-4" : "flex-1"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                      {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.year}</p>
                  </div>
                  {viewMode === "list" && (
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${parseFloat(vehicle.price_per_day || vehicle.price || 0).toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('per_day')}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-gray-900 dark:text-white text-lg">${parseFloat(vehicle.price_per_day || vehicle.price || 0).toFixed(0)}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">{t('day')}</span>
                    </div>
                    {vehicle.instant_booking && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                        {t('instant')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="truncate">{vehicle.location || t('location_not_set')}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    {vehicle.fuel_type && (
                      <div className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                        <Fuel className="h-4 w-4 mr-1 text-orange-600 dark:text-orange-400" />
                        <span className="capitalize text-xs">{vehicle.fuel_type}</span>
                      </div>
                    )}
                    {vehicle.seating_capacity && (
                      <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                        <Users className="h-4 w-4 mr-1 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs">{vehicle.seating_capacity} {t('seats')}</span>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                        <span className="text-xs capitalize">{vehicle.transmission}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance metrics */}
                  {(vehicle.review_count > 0 || vehicle.total_bookings > 0) && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {vehicle.review_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{vehicle.review_count} {t('reviews')}</span>
                        </div>
                      )}
                      {vehicle.total_bookings > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
                          <span>{vehicle.total_bookings} {t('bookings')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={`flex space-x-2 border-t border-gray-100 dark:border-gray-700 ${
                viewMode === "grid" ? "pt-4" : "pt-3 mt-auto"
              }`}>
                <button
                  onClick={() => onViewVehicle(vehicle)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
                  title={t('view_details')}
                >
                  <Eye className="h-4 w-4" />
                  {viewMode === "grid" && <span>{t('view')}</span>}
                </button>
                <button
                  onClick={() => onEditVehicle(vehicle)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors font-medium"
                  title={t('edit')}
                >
                  <Edit className="h-4 w-4" />
                  {viewMode === "grid" && <span>{t('edit')}</span>}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVehicleToDelete(vehicle);
                  }}
                  disabled={deletingVehicleId === vehicle.id || loading}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed group/delete"
                  title={t('delete')}
                >
                  {deletingVehicleId === vehicle.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {viewMode === "grid" && <span>{t('processing')}</span>}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 transition-transform group-hover/delete:scale-110" />
                      {viewMode === "grid" && <span>{t('delete')}</span>}
                    </>
                  )}
                </button>
                {viewMode === "list" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Duplicate vehicle functionality
                      if (window.confirm(t('duplicate_vehicle', { make: vehicle.make, model: vehicle.model }))) {
                        // This would need to be implemented
                        console.log('Duplicate vehicle:', vehicle);
                      }
                    }}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={t('duplicate_vehicle_title')}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedVehicles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <CarFront className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {vehiclesList.length === 0 
                ? t('no_vehicles_found')
                : t('no_vehicles_found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {vehiclesList.length === 0 
                ? t('no_vehicles_message')
                : t('no_vehicles_message')}
            </p>
            <button
              onClick={onAddVehicle}
              className="inline-flex items-center space-x-2 bg-blue-500 dark:bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>{vehiclesList.length === 0 ? t('add_first_vehicle') : t('add_vehicle')}</span>
            </button>
          </div>
        )}
      </div>

      <Dialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t('delete')}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {t('are_you_sure', { 
                action: t('delete').toLowerCase(), 
                count: 1 
              }).replace('1 vehicles', 'this vehicle')}
              <br className="mb-2" />
              {t('action_cannot_undo')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              onClick={() => setVehicleToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={async () => {
                if (!vehicleToDelete) return;
                setDeletingVehicleId(vehicleToDelete.id);
                const vehicle = vehicleToDelete;
                setVehicleToDelete(null); // Close modal
                
                try {
                  await onDeleteVehicle(vehicle, true);
                  addToast(`${vehicle.make} ${vehicle.model} ${t('booking_success', { action: t('booking_cancelled') })}`, 'success');
                } catch (error) {
                  console.error('Delete error:', error);
                  addToast(t('failed_to_delete'), 'error');
                } finally {
                  setDeletingVehicleId(null);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
            >
              {t('delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
