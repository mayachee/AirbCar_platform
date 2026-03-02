'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Car, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function VehiclePerformanceInsights({ vehicles, earnings }) {
  const t = useTranslations('partner_dashboard');
  const { formatPrice } = useCurrency();
  const insights = useMemo(() => {
    // Use vehicle_earnings from earnings API if available
    const vehicleEarnings = earnings?.vehicle_earnings || [];

    // Build revenue data from real backend data or from vehicles
    let revenueByVehicle = [];
    if (vehicleEarnings.length > 0) {
      revenueByVehicle = vehicleEarnings.map(v => ({
        id: v.id,
        name: v.name,
        revenue: Number(v.revenue) || 0,
        bookings: v.bookings || 0,
        dailyRate: Number(v.daily_rate) || 0,
      }));
    } else if (vehicles?.length > 0) {
      revenueByVehicle = vehicles.map(v => ({
        id: v.id,
        name: `${v.make || ''} ${v.model || ''}`.trim(),
        revenue: Number(v.total_revenue) || 0,
        bookings: v.bookings_count || v.bookings || 0,
        dailyRate: Number(v.price_per_day) || 0,
      })).sort((a, b) => b.revenue - a.revenue);
    }

    const topPerformer = revenueByVehicle[0] || (vehicles?.[0] ? {
      name: `${vehicles[0].make || ''} ${vehicles[0].model || ''}`.trim(),
      bookings: vehicles[0].bookings_count || vehicles[0].bookings || 0,
      revenue: 0,
    } : null);

    const totalBookings = revenueByVehicle.reduce((s, v) => s + (v.bookings || 0), 0)
      || vehicles?.reduce((s, v) => s + (v.bookings_count || v.bookings || 0), 0) || 0;

    const averageRating = earnings?.average_rating
      || vehicles?.reduce((s, v) => s + (v.average_rating || 0), 0) / (vehicles?.length || 1)
      || 0;

    return { topPerformer, totalBookings, averageRating, revenueByVehicle };
  }, [vehicles, earnings]);

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 4.0) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('vehicle_performance')}</h3>
        <Car className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <div className="space-y-4">
        {/* Top Performer */}
        {insights.topPerformer && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">{t('top_performer')}</h4>
              </div>
              {insights.averageRating > 0 && (
                <span className={`text-sm font-medium ${getPerformanceColor(insights.averageRating)}`}>
                  {insights.averageRating.toFixed(1)} â˜…
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              {insights.topPerformer.name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-green-600 dark:text-green-400">
                {insights.topPerformer.bookings} {t('bookings')}
              </p>
              {insights.topPerformer.revenue > 0 && (
                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                  {formatPrice(insights.topPerformer.revenue)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">{t('avg_rating')}</span>
              <span className={`text-sm font-semibold ${getPerformanceColor(insights.averageRating)}`}>
                {insights.averageRating > 0 ? insights.averageRating.toFixed(1) : '.'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">{t('total_bookings')}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {insights.totalBookings}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue by Vehicle */}
        {insights.revenueByVehicle.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('revenue_by_vehicle')}</h4>
            <div className="space-y-2">
              {insights.revenueByVehicle.slice(0, 3).map((vehicle, index) => {
                const maxRev = insights.revenueByVehicle[0]?.revenue || 1;
                const pct = Math.round((vehicle.revenue / maxRev) * 100);
                return (
                  <motion.div
                    key={vehicle.id || index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{vehicle.name}</p>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2 whitespace-nowrap">
                        {formatPrice(vehicle.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{vehicle.bookings} {t('bookings')}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!vehicles?.length && (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('add_vehicles_message')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
