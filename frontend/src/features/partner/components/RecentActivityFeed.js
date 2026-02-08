'use client';

import { Calendar, DollarSign, Car, Star, X, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RecentActivityFeed({ activities }) {
  const t = useTranslations('partner');
  const getActivityIcon = (type) => {
    const iconProps = { className: "h-5 w-5" };
    switch (type) {
      case 'booking':
      case 'booking_created': return <Calendar {...iconProps} />;
      case 'payment_received': return <DollarSign {...iconProps} />;
      case 'vehicle_added': return <Car {...iconProps} />;
      case 'review':
      case 'review_received': return <Star {...iconProps} />;
      case 'booking_cancelled': return <X {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking':
      case 'booking_created': return 'text-blue-600 dark:text-blue-400';
      case 'payment_received': return 'text-green-600 dark:text-green-400';
      case 'vehicle_added': return 'text-purple-600 dark:text-purple-400';
      case 'review':
      case 'review_received': return 'text-yellow-600 dark:text-yellow-400';
      case 'booking_cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications_just_now');
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">{t('no_activity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <div className={`flex-shrink-0 ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            {activity.title && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {activity.title}
              </p>
            )}
            <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
              {activity.message || activity.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-2">
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {t('view_all')}
        </button>
      </div>
    </div>
  );
}
