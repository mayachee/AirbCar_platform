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
  // Generate mock activities if none provided
  const mockActivities = [
    { id: 1, type: 'user', action: 'New user registered', user: 'john.doe@example.com', time: new Date(Date.now() - 1000 * 60 * 5), status: 'success' },
    { id: 2, type: 'booking', action: 'Booking completed', user: 'jane.smith@example.com', time: new Date(Date.now() - 1000 * 60 * 15), status: 'success' },
    { id: 3, type: 'car', action: 'New listing added', user: 'partner@example.com', time: new Date(Date.now() - 1000 * 60 * 30), status: 'info' },
    { id: 4, type: 'booking', action: 'Booking pending approval', user: 'user@example.com', time: new Date(Date.now() - 1000 * 60 * 45), status: 'pending' },
    { id: 5, type: 'payment', action: 'Payment received', user: 'customer@example.com', time: new Date(Date.now() - 1000 * 60 * 60), status: 'success' },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600 mt-1">Latest platform activities</p>
        </div>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || AlertCircle;
          const StatusIcon = activityIcons[activity.status] || Clock;
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 rounded-lg bg-gray-100 ${getStatusColor(activity.status)}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">{activity.user || 'System'}</p>
                  <span className="text-gray-300">•</span>
                  <p className="text-xs text-gray-500">
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
        })}
      </div>

      {displayActivities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No recent activity</p>
          <p className="text-gray-400 text-sm mt-1">Activity will appear here as things happen</p>
        </div>
      )}
    </div>
  );
}

