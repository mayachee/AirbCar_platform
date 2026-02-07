'use client';

import { motion } from 'framer-motion';
import { Plus, Download, Upload, Settings, UserPlus, Car, TrendingUp, FileText } from 'lucide-react';

const quickActions = [
  { 
    id: 'add-user', 
    label: 'Manage Users', 
    icon: UserPlus, 
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700'
  },
  { 
    id: 'add-listing', 
    label: 'Manage Vehicles', 
    icon: Car, 
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700'
  },
  { 
    id: 'generate-report', 
    label: 'Earnings Report', 
    icon: FileText, 
    color: 'from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700'
  },
  { 
    id: 'analytics', 
    label: 'View Analytics', 
    icon: TrendingUp, 
    color: 'from-indigo-500 to-indigo-600',
    hoverColor: 'hover:from-indigo-600 hover:to-indigo-700'
  },
];

export default function QuickActions({ onAction }) {
  const handleAction = (actionId) => {
    if (onAction) {
      onAction(actionId);
    }
    console.log('Quick action:', actionId);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Frequently used admin tasks</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(action.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg
                bg-gradient-to-br ${action.color} ${action.hoverColor}
                text-white transition-all duration-300 shadow-md hover:shadow-lg
                group relative overflow-hidden
              `}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <Icon className="h-6 w-6 mb-2 relative z-10" />
              <span className="text-xs font-medium text-center relative z-10">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

