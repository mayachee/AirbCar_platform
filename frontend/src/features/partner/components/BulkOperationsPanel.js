'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Download, 
  Trash2, 
  Car, 
  BarChart3, 
  FileText, 
  Settings, 
  MessageCircle,
  CheckSquare,
  Square,
  Loader2,
  AlertTriangle,
  X,
  Zap
} from 'lucide-react';
import { partnerService } from '@/features/partner/services/partnerService';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function BulkOperationsPanel({ vehicles = [], onRefresh }) {
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { formatPrice } = useCurrency();

  const handleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map(v => v.id));
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleBulkOperation = async () => {
    if (!operation || selectedVehicles.length === 0) return;
    
    // Show confirmation for destructive operations
    if (operation === 'delete' || operation === 'deactivate') {
      setShowConfirm(true);
      return;
    }
    
    await executeOperation();
  };

  const executeOperation = async () => {
    setLoading(true);
    setShowConfirm(false);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const vehicleIds = selectedVehicles;
      let results = { success: 0, failed: 0, errors: [] };

      switch (operation) {
        case 'activate':
          // Activate vehicles (set is_available to true)
          for (const vehicleId of vehicleIds) {
            try {
              await partnerService.patchVehicle(vehicleId, { is_available: true });
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({ id: vehicleId, error: error.message || 'Failed to activate' });
            }
          }
          setSuccessMessage(`Successfully activated ${results.success} vehicle(s)`);
          break;

        case 'deactivate':
          // Deactivate vehicles (set is_available to false)
          for (const vehicleId of vehicleIds) {
            try {
              await partnerService.patchVehicle(vehicleId, { is_available: false });
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({ id: vehicleId, error: error.message || 'Failed to deactivate' });
            }
          }
          setSuccessMessage(`Successfully deactivated ${results.success} vehicle(s)`);
          break;

        case 'update_pricing':
          // Show pricing modal instead of executing directly
          setShowPricingModal(true);
          setLoading(false);
          return;

        case 'export_data':
          // Export vehicle data to CSV
          await exportVehiclesToCSV(vehicleIds);
          setSuccessMessage(`Successfully exported ${vehicleIds.length} vehicle(s) data`);
          break;

        case 'delete':
          // Delete vehicles
          for (const vehicleId of vehicleIds) {
            try {
              await partnerService.deleteVehicle(vehicleId);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({ id: vehicleId, error: error.message || 'Failed to delete' });
            }
          }
          setSuccessMessage(`Successfully deleted ${results.success} vehicle(s)`);
          break;

        default:
          throw new Error('Unknown operation');
      }

      // Reset selections if operation completed
      if (operation !== 'update_pricing') {
        setSelectedVehicles([]);
        setOperation('');
      }

      // Show error message if some operations failed
      if (results.failed > 0) {
        setErrorMessage(`${results.failed} vehicle(s) failed. Check console for details.`);
        console.error('Bulk operation errors:', results.errors);
      }

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('Error performing bulk operation:', error);
      setErrorMessage(error.message || 'Error performing bulk operation. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPricingUpdate = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
      setErrorMessage('Please enter a valid price (positive number)');
      return;
    }

    setLoading(true);
    setShowPricingModal(false);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const price = parseFloat(newPrice);
      const vehicleIds = selectedVehicles;
      let results = { success: 0, failed: 0, errors: [] };

      for (const vehicleId of vehicleIds) {
        try {
          await partnerService.patchVehicle(vehicleId, { price_per_day: price });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ id: vehicleId, error: error.message || 'Failed to update price' });
        }
      }

      setSuccessMessage(`Successfully updated pricing for ${results.success} vehicle(s) to ${formatPrice(price)}/day`);

      if (results.failed > 0) {
        setErrorMessage(`${results.failed} vehicle(s) failed. Check console for details.`);
        console.error('Bulk pricing update errors:', results.errors);
      }

      // Reset selections and form
      setSelectedVehicles([]);
      setOperation('');
      setNewPrice('');

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error updating pricing:', error);
      setErrorMessage(error.message || 'Error updating pricing. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const exportVehiclesToCSV = async (vehicleIds) => {
    try {
      // Get selected vehicles data
      const selectedVehiclesData = vehicles.filter(v => vehicleIds.includes(v.id));
      
      // Create CSV content
      const headers = ['ID', 'Make', 'Model', 'Year', 'Color', 'Transmission', 'Fuel Type', 'Seats', 'Price/Day (MAD)', 'Location', 'Available', 'Verified'];
      const rows = selectedVehiclesData.map(vehicle => [
        vehicle.id,
        vehicle.make || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.color || '',
        vehicle.transmission || '',
        vehicle.fuel_type || '',
        vehicle.seating_capacity || vehicle.seats || '',
        vehicle.price_per_day || '',
        vehicle.location || '',
        vehicle.is_available ? 'Yes' : 'No',
        vehicle.is_verified ? 'Yes' : 'No'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  };

  const t = useTranslations('partner');
  
  const operations = [
    { 
      value: 'activate', 
      label: t('activate_vehicles'), 
      icon: CheckCircle2,
      color: 'green',
      description: t('make_available')
    },
    { 
      value: 'deactivate', 
      label: t('deactivate_vehicles'), 
      icon: XCircle,
      color: 'orange',
      description: t('hide_vehicles')
    },
    { 
      value: 'update_pricing', 
      label: t('update_pricing'), 
      icon: DollarSign,
      color: 'blue',
      description: t('bulk_update_prices')
    },
    { 
      value: 'export_data', 
      label: t('export_data'), 
      icon: Download,
      color: 'purple',
      description: t('export_to_csv')
    },
    { 
      value: 'delete', 
      label: t('delete_vehicles'), 
      icon: Trash2,
      color: 'red',
      description: t('permanently_remove')
    }
  ];

  const selectedOperation = operations.find(op => op.value === operation);
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
  };
  
  const iconColorClasses = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  if (vehicles.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Vehicles Available</h3>
          <p className="text-gray-600 dark:text-gray-400">Add vehicles to your fleet to perform bulk operations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Bulk Operations Panel */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-5 border-b border-blue-800 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bulk Operations</h2>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-0.5">Manage multiple vehicles at once</p>
              </div>
            </div>
            {selectedVehicles.length > 0 && (
              <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30">
                <span className="text-sm font-semibold text-white">
                  {selectedVehicles.length} Selected
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Select Vehicles
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose vehicles to perform bulk operations on
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                {selectedVehicles.length === vehicles.length ? (
                  <>
                    <Square className="h-4 w-4" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicles.includes(vehicle.id);
                return (
                  <label 
                    key={vehicle.id} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 shadow-md' 
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectVehicle(vehicle.id)}
                      className="hidden"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {vehicle.year}
                        </p>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                          {vehicle.price_per_day ? formatPrice(vehicle.price_per_day) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedVehicles.length}</span> of{' '}
                <span className="text-gray-900 dark:text-white font-bold">{vehicles.length}</span> vehicles selected
              </p>
              {selectedVehicles.length > 0 && (
                <button
                  onClick={() => setSelectedVehicles([])}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Operation Selection */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Choose Operation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select the action you want to perform on selected vehicles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operations.map((op) => {
                const IconComponent = op.icon;
                const isSelected = operation === op.value;
                return (
                  <label 
                    key={op.value} 
                    className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? `${colorClasses[op.color]} shadow-lg scale-105` 
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="operation"
                      value={op.value}
                      checked={isSelected}
                      onChange={(e) => setOperation(e.target.value)}
                      className="absolute opacity-0"
                    />
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          isSelected 
                            ? iconColorClasses[op.color]
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          {op.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {op.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Execute Button */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {selectedVehicles.length > 0 && operation && selectedOperation && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        Ready to {selectedOperation.label.toLowerCase()}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This will affect {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleBulkOperation}
                disabled={!operation || selectedVehicles.length === 0 || loading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 hover:from-green-700 hover:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Execute Operation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="font-semibold flex-1">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 max-w-md">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="font-semibold flex-1">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedOperation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                selectedOperation.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  selectedOperation.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('confirm_operation')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('action_cannot_undo')}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('are_you_sure', { 
                action: selectedOperation.label.toLowerCase(), 
                count: selectedVehicles.length 
              })}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={executeOperation}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  selectedOperation.color === 'red' 
                    ? 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800' 
                    : 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-800'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Update Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Pricing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Set new price for selected vehicles</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPricingModal(false);
                  setNewPrice('');
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                New Price Per Day (MAD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter price in MAD"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This will update {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPricingModal(false);
                  setNewPrice('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPricingUpdate}
                disabled={loading || !newPrice}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </span>
                ) : (
                  'Update Price'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
