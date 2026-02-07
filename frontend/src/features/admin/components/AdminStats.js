'use client';

import { UserRound, Handshake, CarFront, Album, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminStats({ stats }) {
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UserRound,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      growth: stats?.usersGrowth,
      recentCount: stats?.recentUsers,
      description: 'Registered users'
    },
    {
      title: 'Total Partners',
      value: stats?.totalPartners || 0,
      icon: Handshake,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      growth: stats?.partnersGrowth,
      recentCount: stats?.recentPartners,
      description: stats?.verifiedPartners ? `${stats.verifiedPartners} verified` : 'Car rental partners'
    },
    {
      title: 'Total Listings',
      value: stats?.totalListings || 0,
      icon: CarFront,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      growth: null,
      recentCount: stats?.recentListings,
      description: stats?.availableListings ? `${stats.availableListings} available` : 'Vehicle listings'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Album,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      growth: stats?.bookingsGrowth,
      recentCount: stats?.recentBookings,
      description: stats?.pendingBookings ? `${stats.pendingBookings} pending` : 'Total reservations'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group relative bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            {/* Gradient accent on hover */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-full -mr-16 -mt-16 transition-opacity duration-300`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.iconBg} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                {stat.growth != null && stat.growth !== 0 && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    stat.growth >= 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {stat.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stat.growth)}%</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
                >
                  {stat.value.toLocaleString()}
                </motion.p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
