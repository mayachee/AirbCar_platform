'use client';

import { useState, useEffect } from 'react';

export default function EarningsOverview({ stats, detailed = false }) {
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    averagePerBooking: 0,
    growthRate: 0
  });

  useEffect(() => {
    if (stats) {
      setEarningsData({
        totalEarnings: stats.totalEarnings || 0,
        monthlyEarnings: stats.monthlyEarnings || 0,
        pendingPayouts: stats.pendingPayouts || 0,
        completedPayouts: stats.completedPayouts || 0,
        averagePerBooking: stats.averagePerBooking || 0,
        growthRate: stats.growthRate || 0
      });
    }
  }, [stats]);

  const earningsCards = [
    {
      title: 'Total Earnings',
      value: `$${earningsData.totalEarnings.toLocaleString()}`,
      icon: '💰',
      color: 'green',
      change: `+${earningsData.growthRate}%`
    },
    {
      title: 'This Month',
      value: `$${earningsData.monthlyEarnings.toLocaleString()}`,
      icon: '📅',
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Pending Payouts',
      value: `$${earningsData.pendingPayouts.toLocaleString()}`,
      icon: '⏳',
      color: 'yellow',
      change: 'Next payout: 3 days'
    },
    {
      title: 'Avg per Booking',
      value: `$${earningsData.averagePerBooking.toLocaleString()}`,
      icon: '📊',
      color: 'purple',
      change: '+5%'
    }
  ];

  if (detailed) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Earnings Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {earningsCards.map((card, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    card.color === 'green' ? 'bg-green-100 text-green-800' :
                    card.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    card.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {card.change}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{card.title}</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            ))}
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
        {earningsCards.slice(0, 2).map((card, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                card.color === 'green' ? 'bg-green-100 text-green-800' :
                card.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {card.change}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">{card.title}</h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
