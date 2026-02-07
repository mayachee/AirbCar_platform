'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Handshake, 
  Car, 
  Calendar, 
  DollarSign,
  Menu,
  X,
  Home,
  LogOut,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'users', label: 'Users', icon: Users, color: 'text-purple-500' },
  { id: 'partners', label: 'Partners', icon: Handshake, color: 'text-green-500' },
  { id: 'cars', label: 'Vehicles', icon: Car, color: 'text-orange-500' },
  { id: 'bookings', label: 'Bookings', icon: Calendar, color: 'text-indigo-500' },
  { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-yellow-500' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, color: 'text-emerald-500' },
];

export default function AdminSidebar({ currentView, onViewChange, isMobileOpen, setIsMobileOpen }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleNavigation = (viewId) => {
    onViewChange(viewId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/auth/signin');
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{
            x: isMobileOpen || isDesktop ? 0 : -280
          }}
          className={`
            fixed lg:sticky top-0 left-0 h-screen w-64 
            bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40
            flex flex-col shadow-lg lg:shadow-none
          `}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Control Center</p>
                </div>
              </div>
              {/* Close button on mobile */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* User info and actions */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            
            <div className="space-y-0.5">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                <Home className="h-4 w-4" />
                <span className="font-medium">Back to Site</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}

