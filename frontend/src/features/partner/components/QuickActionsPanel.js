'use client';

import { Car, RefreshCw, BarChart3, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickActionsPanel({ onAddVehicle, onRefreshData }) {
  const quickActions = [
    {
      id: 'add_vehicle',
      label: 'Add Vehicle',
      icon: Car,
      color: 'blue',
      action: onAddVehicle
    },
    {
      id: 'refresh_data',
      label: 'Refresh Data',
      icon: RefreshCw,
      color: 'green',
      action: onRefreshData
    },
    {
      id: 'view_analytics',
      label: 'View Analytics',
      icon: BarChart3,
      color: 'purple',
      action: () => console.log('View Analytics')
    },
    {
      id: 'export_data',
      label: 'Export Data',
      icon: Download,
      color: 'orange',
      action: () => console.log('Export Data')
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30';
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action}
            className={`w-full p-3 rounded-lg border transition-all ${getColorClasses(action.color)}`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {action.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
