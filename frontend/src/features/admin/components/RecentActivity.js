'use client';

import { motion } from 'framer-motion';
import { Clock, User, Car, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
// Simple time formatter - replace with date-fns if available
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const activityIcons = {
  user: User,
  car: Car,
  booking: Calendar,
  payment: DollarSign,
  approved: CheckCircle,
  rejected: XCircle,
  pending: AlertCircle,
};

export default function RecentActivity({ activities = [] }) {
  const displayActivities = activities;

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest platform activities</p>
        </div>
        <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="space-y-4">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No recent activity</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Activity will appear here as events happen</p>
          </div>
        ) : (
          displayActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || AlertCircle;
          const StatusIcon = activityIcons[activity.status] || Clock;
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getStatusColor(activity.status)}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.user || 'System'}</p>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time ? formatTimeAgo(activity.time) : 'Just now'}
                  </p>
                </div>
              </div>

              {activity.status && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </div>
              )}
            </motion.div>
          );
        })
        )}
      </div>
    </div>
  );
}

