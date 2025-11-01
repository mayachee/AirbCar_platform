'use client';

import { Suspense, lazy } from 'react';

const QuickActionsPanel = lazy(() => import('@/features/partner/components/QuickActionsPanel'));

const ComponentLoader = ({ children, fallback = null }) => (
  <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>}>
    {children}
  </Suspense>
);

export default function DashboardSidebar({
  sidebarCollapsed,
  toggleSidebar,
  navigationItems,
  currentView,
  setCurrentView,
  isOnline,
  backendAvailable,
  onAddVehicle,
  onRefreshData
}) {
  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!sidebarCollapsed && (
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Partner Hub</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-300">
              {sidebarCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className={`space-y-2 mb-4 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {!sidebarCollapsed && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${backendAvailable ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
            {!sidebarCollapsed && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {backendAvailable ? 'API Connected' : 'Demo Mode'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">{item.icon}</span>
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Quick Actions</h3>
            <ComponentLoader>
              <QuickActionsPanel 
                onAddVehicle={onAddVehicle}
                onRefreshData={onRefreshData}
              />
            </ComponentLoader>
          </div>
        )}
      </div>
    </div>
  );
}
