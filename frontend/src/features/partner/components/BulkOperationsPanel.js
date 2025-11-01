'use client';

import { useState } from 'react';

export default function BulkOperationsPanel({ vehicles, onRefresh }) {
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    setLoading(true);
    try {
      // Mock bulk operation - replace with real API calls
      console.log(`Performing ${operation} on vehicles:`, selectedVehicles);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset selections
      setSelectedVehicles([]);
      setOperation('');
      
      // Refresh data
      onRefresh();
      
      alert(`Successfully performed ${operation} on ${selectedVehicles.length} vehicles`);
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      alert('Error performing bulk operation');
    } finally {
      setLoading(false);
    }
  };

  const operations = [
    { value: 'activate', label: 'Activate Vehicles', icon: '✅' },
    { value: 'deactivate', label: 'Deactivate Vehicles', icon: '❌' },
    { value: 'update_pricing', label: 'Update Pricing', icon: '💰' },
    { value: 'export_data', label: 'Export Data', icon: '📤' },
    { value: 'delete', label: 'Delete Vehicles', icon: '🗑️' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bulk Operations</h2>
        
        {/* Vehicle Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Vehicles</h3>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
            >
              {selectedVehicles.length === vehicles.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <label key={vehicle.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVehicles.includes(vehicle.id)}
                  onChange={() => handleSelectVehicle(vehicle.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.year} • ${vehicle.price_per_day}/day
                  </p>
                </div>
              </label>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {selectedVehicles.length} of {vehicles.length} vehicles selected
          </p>
        </div>

        {/* Operation Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose Operation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {operations.map((op) => (
              <label key={op.value} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="operation"
                  value={op.value}
                  checked={operation === op.value}
                  onChange={(e) => setOperation(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">{op.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{op.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedVehicles.length > 0 && operation && (
              <span>
                Ready to {operation.replace('_', ' ')} {selectedVehicles.length} vehicle(s)
              </span>
            )}
          </div>
          
          <button
            onClick={handleBulkOperation}
            disabled={!operation || selectedVehicles.length === 0 || loading}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Execute Operation'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">📊</span>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Analytics</p>
            </div>
          </button>
          
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">📈</span>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Reports</p>
            </div>
          </button>
          
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">⚙️</span>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Settings</p>
            </div>
          </button>
          
          <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">💬</span>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Support</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
