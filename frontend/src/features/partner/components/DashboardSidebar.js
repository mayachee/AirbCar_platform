'use client';

import { Suspense, lazy } from 'react';
import { ChevronLeft, ChevronRight, Wifi, WifiOff, Server, ServerOff, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

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
  onRefreshData,
  isMobile = false
}) {
  const t = useTranslations('partner');
  const mobileVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  const desktopVariants = {
    open: { width: 256 },
    closed: { width: 64 }
  };

  return (
    <motion.div 
      initial={false}
      animate={sidebarCollapsed ? 'closed' : 'open'}
      variants={isMobile ? mobileVariants : desktopVariants}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className={`bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
        isMobile
          ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full border-r border-gray-200 dark:border-gray-700'
          : 'sticky top-0 h-screen border-r border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          {!sidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('partner_hub')}</h2>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        {/* Status Indicators */}
        <div className={`space-y-2 mb-6 ${sidebarCollapsed && !isMobile ? 'flex flex-col items-center' : ''}`}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700`}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
            )}
            {!sidebarCollapsed && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {isOnline ? t('online') : t('offline')}
              </span>
            )}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700`}
          >
            {backendAvailable ? (
              <Server className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
            ) : (
              <ServerOff className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mr-2" />
            )}
            {!sidebarCollapsed && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {backendAvailable ? t('api_connected') : t('demo_mode')}
              </span>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'} ${
                  currentView === item.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className={`font-medium ${
                    currentView === item.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && item.badge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    currentView === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500 dark:bg-blue-600 text-white'
                  }`}
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          ))}
        </nav>
      </div>
    </motion.div>
  );
}
