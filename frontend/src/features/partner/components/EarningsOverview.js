'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle
};

export default function EarningsOverview({ earnings, stats, detailed = false }) {
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    averagePerBooking: 0,
    growthRate: 0
  });

  useEffect(() => {
    // Use earnings from backend if available, otherwise fall back to stats
    if (earnings) {
      setEarningsData({
        totalEarnings: earnings.totalEarnings || 0,
        monthlyEarnings: earnings.monthlyEarnings || 0,
        pendingPayouts: earnings.pendingPayouts || 0,
        completedPayouts: earnings.completedPayouts || 0,
        averagePerBooking: earnings.averagePerBooking || 0,
        growthRate: earnings.growthRate || 0
      });
    } else if (stats) {
      setEarningsData({
        totalEarnings: stats.totalEarnings || 0,
        monthlyEarnings: stats.monthlyEarnings || 0,
        pendingPayouts: stats.pendingPayouts || 0,
        completedPayouts: stats.completedPayouts || 0,
        averagePerBooking: stats.averagePerBooking || 0,
        growthRate: stats.growthRate || 0
      });
    }
  }, [earnings, stats]);

  const earningsCards = [
    {
      title: 'Total Earnings',
      value: `$${earningsData.totalEarnings.toLocaleString()}`,
      icon: 'DollarSign',
      color: 'green',
      change: `+${earningsData.growthRate}%`,
      changeType: 'positive'
    },
    {
      title: 'This Month',
      value: `$${earningsData.monthlyEarnings.toLocaleString()}`,
      icon: 'Calendar',
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pending Payouts',
      value: `$${earningsData.pendingPayouts.toLocaleString()}`,
      icon: 'Clock',
      color: 'yellow',
      change: 'Next payout: 3 days',
      changeType: 'neutral'
    },
    {
      title: 'Avg per Booking',
      value: `$${earningsData.averagePerBooking.toLocaleString()}`,
      icon: 'TrendingUp',
      color: 'purple',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  if (detailed) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Earnings Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {earningsCards.map((card, index) => {
              const Icon = iconMap[card.icon] || DollarSign;
              const colorClasses = {
                green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              };
              const iconColorClasses = {
                green: 'text-green-600 dark:text-green-400',
                blue: 'text-blue-600 dark:text-blue-400',
                yellow: 'text-yellow-600 dark:text-yellow-400',
                purple: 'text-purple-600 dark:text-purple-400'
              };
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-lg border p-5 ${colorClasses[card.color]}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colorClasses[card.color].replace('50', '100')}`}>
                      <Icon className={`h-5 w-5 ${iconColorClasses[card.color]}`} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      card.changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      card.changeType === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Earnings Chart Placeholder */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Earnings chart will be displayed here</p>
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payout History</h3>
          <div className="space-y-3">
            {[
              { date: '2024-01-15', amount: 1250, status: 'completed' },
              { date: '2024-01-01', amount: 980, status: 'completed' },
              { date: '2023-12-15', amount: 1100, status: 'completed' }
            ].map((payout, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">${payout.amount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{payout.date}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  payout.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Earnings Overview</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {earningsCards.slice(0, 2).map((card, index) => {
          const Icon = iconMap[card.icon] || DollarSign;
          const colorClasses = {
            green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
          };
          const iconColorClasses = {
            green: 'text-green-600 dark:text-green-400',
            blue: 'text-blue-600 dark:text-blue-400',
            yellow: 'text-yellow-600 dark:text-yellow-400',
            purple: 'text-purple-600 dark:text-purple-400'
          };
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`rounded-lg border p-4 ${colorClasses[card.color]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[card.color].replace('50', '100')}`}>
                  <Icon className={`h-5 w-5 ${iconColorClasses[card.color]}`} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  card.changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  card.changeType === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {card.change}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h4>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
