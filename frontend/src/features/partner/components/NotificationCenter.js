'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, CheckCircle, AlertCircle, Clock, DollarSign, Car, 
  UserPlus, MessageSquare, Star, ShieldCheck, ShieldX, Inbox,
  Check, Trash2
} from 'lucide-react';

export default function NotificationCenter({ notifications = [], onMarkAsRead, onClearAll, onNotificationClick }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read && !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      'new_booking': <Clock className="h-5 w-5 text-blue-400" />,
      'booking_confirmed': <CheckCircle className="h-5 w-5 text-green-400" />,
      'booking_accepted': <CheckCircle className="h-5 w-5 text-green-400" />,
      'booking_rejected': <AlertCircle className="h-5 w-5 text-red-400" />,
      'booking_cancelled': <X className="h-5 w-5 text-red-400" />,
      'payment_received': <DollarSign className="h-5 w-5 text-emerald-400" />,
      'vehicle_issue': <Car className="h-5 w-5 text-orange-400" />,
      'new_review': <Star className="h-5 w-5 text-yellow-400" />,
      'review_reply': <MessageSquare className="h-5 w-5 text-purple-400" />,
      'partner_approved': <ShieldCheck className="h-5 w-5 text-green-400" />,
      'partner_rejected': <ShieldX className="h-5 w-5 text-red-400" />,
      'welcome': <UserPlus className="h-5 w-5 text-blue-400" />,
      'success': <CheckCircle className="h-5 w-5 text-green-400" />,
      'error': <AlertCircle className="h-5 w-5 text-red-400" />,
      'info': <Bell className="h-5 w-5 text-blue-400" />,
    };
    return iconMap[type] || <Bell className="h-5 w-5 text-gray-400" />;
  };

  const getNotificationAccent = (type) => {
    const accentMap = {
      'new_booking': 'border-l-blue-500',
      'booking_confirmed': 'border-l-green-500',
      'booking_accepted': 'border-l-green-500',
      'booking_rejected': 'border-l-red-500',
      'booking_cancelled': 'border-l-red-500',
      'payment_received': 'border-l-emerald-500',
      'vehicle_issue': 'border-l-orange-500',
      'new_review': 'border-l-yellow-500',
      'review_reply': 'border-l-purple-500',
      'partner_approved': 'border-l-green-500',
      'partner_rejected': 'border-l-red-500',
      'welcome': 'border-l-blue-500',
      'success': 'border-l-green-500',
      'error': 'border-l-red-500',
      'info': 'border-l-blue-500',
    };
    return accentMap[type] || 'border-l-gray-500';
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkSingleRead = (e, id) => {
    e.stopPropagation();
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read on click
    if (!(notification.is_read || notification.read) && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) onNotificationClick(notification);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/30"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => { if (onMarkAsRead) onMarkAsRead(); }}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Mark all as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Read all</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearAll}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[55vh] sm:max-h-80">
                {notifications.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                      <Inbox className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {notifications.map((notification, idx) => {
                      const isUnread = !(notification.is_read || notification.read);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-5 py-4 border-l-[3px] cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 ${getNotificationAccent(notification.type)} ${
                            isUnread 
                              ? 'bg-blue-50/40 dark:bg-blue-900/10' 
                              : 'bg-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-tight ${
                                isUnread 
                                  ? 'font-semibold text-gray-900 dark:text-white' 
                                  : 'font-medium text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                {formatTimeAgo(notification.created_at || notification.timestamp)}
                              </p>
                            </div>
                            {isUnread && (
                              <button 
                                onClick={(e) => handleMarkSingleRead(e, notification.id)}
                                className="flex-shrink-0 mt-1 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group" 
                                title="Mark as read"
                              >
                                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
