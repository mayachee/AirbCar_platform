'use client';

export default function RecentActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking_created': return '📅';
      case 'payment_received': return '💰';
      case 'vehicle_added': return '🚗';
      case 'review_received': return '⭐';
      case 'booking_cancelled': return '❌';
      default: return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking_created': return 'text-blue-600';
      case 'payment_received': return 'text-green-600';
      case 'vehicle_added': return 'text-purple-600';
      case 'review_received': return 'text-yellow-600';
      case 'booking_cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-lg flex-shrink-0">{getActivityIcon(activity.type)}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
              {activity.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-2">
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View all activity
        </button>
      </div>
    </div>
  );
}
