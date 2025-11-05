'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/features/reviews';
import { ReviewCard } from '@/features/reviews';
import { Star, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';

export default function CustomerReviewsManagement({ vehicles }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Get reviews for partner's listings using my_listings parameter
      const response = await reviewService.getReviewsWithFilters(null, { my_listings: true });
      const reviewsList = Array.isArray(response) ? response : (response?.results || response?.data || []);
      
      // Deduplicate reviews
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

  const handlePublish = async (reviewId, isPublished) => {
    try {
      await reviewService.publishReview(reviewId, isPublished);
      addToast(
        isPublished ? 'Review published' : 'Review unpublished',
        'success'
      );
      await loadReviews();
    } catch (err) {
      console.error('Error publishing review:', err);
      addToast('Failed to update review', 'error');
    }
  };

  const publishedReviews = reviews.filter(r => r.is_published);
  const unpublishedReviews = reviews.filter(r => !r.is_published);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

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
      {/* Reviews Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📝</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Unpublished</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {unpublishedReviews.length}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Reviews</h3>
          <button
            onClick={loadReviews}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Refresh
          </button>
        </div>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="relative">
                  <ReviewCard review={review} showActions={true} />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    {review.is_published ? (
                      <button
                        onClick={() => handlePublish(review.id, false)}
                        className="p-2 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                        title="Unpublish review"
                      >
                        <EyeOff className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(review.id, true)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                        title="Publish review"
                      >
                        <Eye className="h-4 w-4 text-green-700 dark:text-green-400" />
                      </button>
                    )}
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
