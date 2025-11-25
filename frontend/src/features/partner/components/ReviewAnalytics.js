'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/features/reviews';
import { Star, TrendingUp, MessageSquare, TrendingDown, BarChart3, ThumbsUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';

export default function ReviewAnalytics({ reviews: reviewsData }) {
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use reviews data from props if available (from backend)
    if (reviewsData) {
      // Calculate additional analytics from reviews data
      const reviews = reviewsData.reviews || [];
      const recent30Days = new Date();
      recent30Days.setDate(recent30Days.getDate() - 30);
      
      const recentReviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt || r.created_at);
        return reviewDate >= recent30Days;
      });
      
      setAnalytics({
        averageRating: reviewsData.averageRating || 0,
        totalReviews: reviewsData.totalReviews || reviews.length || 0,
        ratingDistribution: reviewsData.ratingDistribution || {},
        reviewsByVehicle: reviewsData.reviewsByVehicle || [],
        recentReviews30Days: recentReviews.length,
        totalHelpfulVotes: 0, // Not available in current data
        reviewsWithResponses: 0 // Not available in current data
      });
      setLoading(false);
    } else {
      // No reviews data available, show empty state
      setLoading(false);
      setAnalytics(null);
    }
  }, [reviewsData]);

  const loadAnalytics = async () => {
    // Don't try to load from non-existent endpoint
    // Reviews data should come from props (partnerService.getReviews())
    setLoading(false);
    setAnalytics(null);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!analytics || loading) {
    if (loading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No analytics data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Reviews will appear here once customers start leaving reviews</p>
        </div>
      </div>
    );
  }

  const ratingPercentage = (rating) => {
    const ratingDist = analytics.ratingDistribution || analytics.rating_distribution || {};
    const count = ratingDist[rating] || 0;
    const total = analytics.totalReviews || analytics.total_reviews || 1;
    return (count / total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between mb-2">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.averageRating || analytics.average_rating || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Out of 5.0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalReviews || analytics.total_reviews || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.recentReviews30Days || analytics.recent_reviews_30_days || 0} in last 30 days
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center justify-between mb-2">
            <ThumbsUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Helpful Votes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalHelpfulVotes || analytics.total_helpful_votes || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Community engagement</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">With Responses</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.reviewsWithResponses || analytics.reviews_with_responses || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You've responded to</p>
        </motion.div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Rating Distribution</h3>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((rating) => {
            const ratingDist = analytics.ratingDistribution || analytics.rating_distribution || {};
            const count = ratingDist[rating] || 0;
            const percentage = ratingPercentage(rating);
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: rating * 0.1 }}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Reviewed Vehicles */}
      {analytics.reviewsByVehicle && analytics.reviewsByVehicle.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Reviewed Vehicles</h3>
          <div className="space-y-3">
            {analytics.reviewsByVehicle
              .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
              .slice(0, 5)
              .map((vehicle, index) => (
                <motion.div
                  key={vehicle.vehicleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {vehicle.vehicleName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vehicle.reviewCount || 0} review{vehicle.reviewCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {vehicle.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
