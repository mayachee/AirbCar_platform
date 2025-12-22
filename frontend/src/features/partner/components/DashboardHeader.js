'use client';

import { Suspense, lazy } from 'react';
import { Moon, Sun, Bell, CheckCircle, AlertCircle, Clock, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationCenter = lazy(() => import('@/features/partner/components/NotificationCenter'));
const PartnerVerificationStatus = lazy(() => import('@/features/partner/components/PartnerVerificationStatus'));

const ComponentLoader = ({ children, fallback = null }) => (
  <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>}>
    {children}
  </Suspense>
);

export default function DashboardHeader({
  navigationItems,
  currentView,
  partnerData,
  user,
  theme,
  toggleTheme,
  notifications,
  onMarkAsRead,
  onClearAll,
  onToggleSidebar
}) {
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const currentNavItem = navigationItems.find(item => item.id === currentView);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          {onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className="lg:hidden p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {currentNavItem?.label || 'Dashboard'}
            </h1>
            {currentNavItem?.icon && (
              <span className="text-gray-400">{currentNavItem.icon}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Welcome back, <span className="font-semibold text-gray-900 dark:text-white">
              {partnerData?.company_name || user?.first_name || user?.email || 'Partner'}
            </span>
            {partnerData?.verification_status && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                {partnerData.verification_status === 'approved' && (
                  <span className="flex items-center space-x-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                )}
                {partnerData.verification_status === 'pending' && (
                  <span className="flex items-center space-x-1 text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Clock className="h-3 w-3" />
                    <span>Pending Verification</span>
                  </span>
                )}
                {partnerData.verification_status === 'rejected' && (
                  <span className="flex items-center space-x-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Verification Required</span>
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </motion.button>

          <ComponentLoader>
            <div className="relative">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onClearAll={onClearAll}
              />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </div>
          </ComponentLoader>

          <ComponentLoader>
            <PartnerVerificationStatus partnerData={partnerData} />
          </ComponentLoader>
        </div>
      </div>
    </motion.div>
  );
}
