'use client';

import { useState, useMemo } from 'react';
import { CarFront, Edit, Trash2, Eye, Plus, Search, Filter, ArrowUpDown, MapPin, DollarSign, Users, Fuel, Calendar, Star, RefreshCw } from 'lucide-react';

export default function VehiclesList({ 
  vehicles, 
  loading, 
  onAddVehicle, 
  onEditVehicle, 
  onDeleteVehicle, 
  onViewVehicle,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Handle undefined or null vehicles array
  const vehiclesList = vehicles || [];
  
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
              <p className="text-blue-100 text-sm font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <CarFront className="h-10 w-10 text-blue-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Available</p>
              <p className="text-3xl font-bold mt-1">{stats.available}</p>
            </div>
            <Users className="h-10 w-10 text-green-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Average Rate</p>
              <p className="text-3xl font-bold mt-1">${stats.avgPrice.toFixed(0)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-yellow-200 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Rented</p>
              <p className="text-3xl font-bold mt-1">{stats.rented}</p>
            </div>
            <Calendar className="h-10 w-10 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">My Vehicles</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your rental vehicles
            </p>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onAddVehicle}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by make, model, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Vehicles</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {filteredVehicles.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Showing {sortedVehicles.length} of {vehiclesList.length} vehicles
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white group"
            >
              {/* Vehicle Image */}
              <div className="relative mb-4 h-48 rounded-lg overflow-hidden bg-gray-100">
                {vehicle.pictures && vehicle.pictures.length > 0 ? (
                  <>
                    <img 
                      src={vehicle.pictures[0]} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center bg-gray-100">
                      <CarFront className="h-12 w-12 text-gray-400" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <CarFront className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Rating Badge */}
                {vehicle.rating && vehicle.rating > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-semibold">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span>{vehicle.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Availability Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  vehicle.availability === true || vehicle.availability === 'available'
                    ? 'bg-green-500 text-white'
                    : vehicle.availability === 'rented'
                    ? 'bg-blue-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {vehicle.availability === true ? 'Available' : 
                   vehicle.availability === 'available' ? 'Available' :
                   vehicle.availability === 'rented' ? 'Rented' :
                   vehicle.availability === 'maintenance' ? 'Maintenance' : 'Unavailable'}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-sm text-gray-600">{vehicle.year}</p>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-semibold text-gray-900">${vehicle.price_per_day}</span>
                    <span className="text-gray-500 ml-1">/day</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{vehicle.location || 'Location not set'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {vehicle.fuel_type && (
                      <div className="flex items-center">
                        <Fuel className="h-4 w-4 mr-1 text-orange-600" />
                        <span className="capitalize">{vehicle.fuel_type}</span>
                      </div>
                    )}
                    {vehicle.seating_capacity && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-purple-600" />
                        <span>{vehicle.seating_capacity} seats</span>
                      </div>
                    )}
                  </div>
                  
                  {vehicle.transmission && (
                    <div className="text-xs text-gray-500 capitalize">
                      {vehicle.transmission} transmission
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onViewVehicle(vehicle)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onEditVehicle(vehicle)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) {
                      onDeleteVehicle(vehicle);
                    }
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedVehicles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <CarFront className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {vehiclesList.length === 0 
                ? "No vehicles yet" 
                : "No vehicles match your filters"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {vehiclesList.length === 0 
                ? "Get started by adding your first vehicle to start renting it out to customers."
                : "Try adjusting your search or filter criteria to find what you're looking for."}
            </p>
            <button
              onClick={onAddVehicle}
              className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>{vehiclesList.length === 0 ? "Add Your First Vehicle" : "Add Vehicle"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
