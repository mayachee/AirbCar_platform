'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/features/reviews';
import { ReviewCard } from '@/features/reviews';
import { Star, Loader2, AlertTriangle, CheckCircle, XCircle, Search, Filter, TrendingUp, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminReviewsManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filterRating, setFilterRating] = useState('all');
  const [filterPublished, setFilterPublished] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  useEffect(() => {
    loadAllReviews();
    loadAnalytics();
  }, []);

  const loadAllReviews = async () => {
    try {
      setLoading(true);
      // For admin, fetch all reviews without filtering by listing
      const response = await reviewService.getReviewsWithFilters(null, {});
      const reviewsList = Array.isArray(response) ? response : (response?.results || response?.data || []);
      
      // Deduplicate reviews by ID
      const reviewsMap = new Map();
      reviewsList.forEach(review => {
        if (review && review.id && !reviewsMap.has(review.id)) {
          reviewsMap.set(review.id, review);
        }
      });
      
      setReviews(Array.from(reviewsMap.values()));
    } catch (err) {
      console.error('Error loading reviews:', err);
      addToast('Failed to load reviews', 'error');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Admin analytics endpoint - might need to create this
      // For now, calculate from loaded reviews
      const totalReviews = reviews.length;
      const publishedReviews = reviews.filter(r => r.is_published).length;
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';
      
      const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
      });

      setAnalytics({
        totalReviews,
        publishedReviews,
        unpublishedReviews: totalReviews - publishedReviews,
        averageRating: avgRating,
        ratingDistribution: ratingDist,
        reviewsWithResponses: reviews.filter(r => r.owner_response).length,
        totalHelpfulVotes: reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0)
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  useEffect(() => {
    if (reviews.length > 0) {
      loadAnalytics();
    }
  }, [reviews]);

  const handlePublishToggle = async (reviewId, isPublished) => {
    try {
      await reviewService.publishReview(reviewId, isPublished);
      addToast(
        isPublished ? 'Review published' : 'Review unpublished',
        'success'
      );
      await loadAllReviews();
    } catch (err) {
      console.error('Error updating review:', err);
      addToast('Failed to update review', 'error');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);
      addToast('Review deleted successfully', 'success');
      await loadAllReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      addToast('Failed to delete review', 'error');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) return false;
    if (filterPublished === 'published' && !review.is_published) return false;
    if (filterPublished === 'unpublished' && review.is_published) return false;
    if (searchTerm && !review.comment?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.averageRating}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all reviews</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalReviews}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics.publishedReviews} published
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Helpful Votes</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalHelpfulVotes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Community engagement</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Unpublished</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.unpublishedReviews}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Needs moderation</p>
          </motion.div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Reviews</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Reviews ({filteredReviews.length})
          </h3>
          <button
            onClick={loadAllReviews}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Refresh
          </button>
        </div>
        
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <ReviewCard review={review} showActions={false} />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    {review.is_published ? (
                      <button
                        onClick={() => handlePublishToggle(review.id, false)}
                        className="p-2 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                        title="Unpublish review"
                      >
                        <XCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublishToggle(review.id, true)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                        title="Publish review"
                      >
                        <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
