'use client';

import { CarFront, Calendar, DollarSign, CheckCircle, TrendingUp, Clock, Star, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PartnerStats({ stats, loading }) {
  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: CarFront,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+2 this month',
      changeType: 'positive'
    },
    {
      title: 'Active Bookings',
      value: stats?.activeBookings || 0,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+12% from last month',
      changeType: 'positive'
    },
    {
      title: 'Monthly Earnings',
      value: `$${stats?.monthlyEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+8% from last month',
      changeType: 'positive'
    },
    {
      title: 'Completed Rentals',
      value: stats?.completedRentals || 0,
      icon: CheckCircle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: '+5 this week',
      changeType: 'positive'
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      change: 'Needs attention',
      changeType: 'neutral'
    },
    {
      title: 'Average Rating',
      value: stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      change: '+0.2 this month',
      changeType: 'positive'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-gray-200 rounded-lg p-3">
                <div className="h-6 w-6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bgColor} dark:bg-gray-700 rounded-xl p-3`}>
                <IconComponent className={`h-6 w-6 ${stat.textColor} dark:text-gray-300`} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <div className={`flex items-center space-x-1 text-xs ${
                stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 
                'text-gray-500 dark:text-gray-400'
              }`}>
                {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                <span className="font-medium">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
