'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/features/reviews';
import { ReviewCard } from '@/features/reviews';
import { Star, Loader2, Eye, EyeOff, FileText, Search, Filter, TrendingUp, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { SelectField } from '@/components/ui/select-field';

export default function CustomerReviewsManagement({ vehicles, reviews: reviewsData }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, unpublished
  const [filterRating, setFilterRating] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Use reviews from props if available (from backend), otherwise load from service
    if (reviewsData?.reviews) {
      setReviews(reviewsData.reviews || []);
      setLoading(false);
    } else {
      loadReviews();
    }
  }, [reviewsData]);

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

  // Filter reviews based on search, status, and rating
  const filteredReviews = reviews.filter(review => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        review.comment?.toLowerCase().includes(query) ||
        review.user?.first_name?.toLowerCase().includes(query) ||
        review.user?.last_name?.toLowerCase().includes(query) ||
        review.user?.email?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus === 'published' && !review.is_published) return false;
    if (filterStatus === 'unpublished' && review.is_published) return false;

    // Rating filter
    if (filterRating && review.rating !== filterRating) return false;

    return true;
  });

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
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

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Customer Reviews</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage and monitor all customer feedback</p>
          </div>
          <button
            onClick={loadReviews}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Based on {reviews.length} reviews</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Total Reviews</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{publishedReviews.length} published</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Unpublished</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {unpublishedReviews.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Pending review</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">With Response</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reviews.filter(r => r.owner_response).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Replied to</p>
          </div>
        </div>

        {/* Rating Distribution */}
        {reviews.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating] || 0;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Reviews {filteredReviews.length !== reviews.length && `(${filteredReviews.length} of ${reviews.length})`}
          </h3>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <SelectField
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'unpublished', label: 'Unpublished' },
              ]}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Rating Filter */}
            <SelectField
              value={filterRating ?? ''}
              placeholder="All Ratings"
              showPlaceholderOption
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              options={[
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' },
              ]}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No reviews match your filters</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterRating(null);
              }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => (
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
