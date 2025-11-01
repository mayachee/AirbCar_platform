'use client';

import { Suspense, lazy } from 'react';

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
  onClearAll
}) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {partnerData?.company_name || user?.firstName || 'Partner'}!
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-300">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>

          <ComponentLoader>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onClearAll={onClearAll}
            />
          </ComponentLoader>

          <ComponentLoader>
            <PartnerVerificationStatus partnerData={partnerData} />
          </ComponentLoader>
        </div>
      </div>
    </div>
  );
}
