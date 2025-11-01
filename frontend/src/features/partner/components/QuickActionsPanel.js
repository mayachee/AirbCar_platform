'use client';

export default function QuickActionsPanel({ onAddVehicle, onRefreshData }) {
  const quickActions = [
    {
      id: 'add_vehicle',
      label: 'Add Vehicle',
      icon: '🚗',
      color: 'blue',
      action: onAddVehicle
    },
    {
      id: 'refresh_data',
      label: 'Refresh Data',
      icon: '🔄',
      color: 'green',
      action: onRefreshData
    },
    {
      id: 'view_analytics',
      label: 'View Analytics',
      icon: '📊',
      color: 'purple',
      action: () => console.log('View Analytics')
    },
    {
      id: 'export_data',
      label: 'Export Data',
      icon: '📤',
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
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={action.action}
          className={`w-full p-3 rounded-lg border transition-colors ${getColorClasses(action.color)}`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {action.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
