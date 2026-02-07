'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { reviewService } from '../services/reviewService';
import { Star, Loader2, Filter, SortAsc, ChevronDown, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { SelectField } from '@/components/ui/select-field';

export default function ReviewList({ 
  listingId, 
  showAddForm = false, 
  onReviewAdded,
  onReviewUpdated,
  onReviewDeleted,
  refreshTrigger
}) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const filterRef = useRef(null);
  const statsListingRef = useRef(null); // Track which listing stats are loaded for
  const loadingRef = useRef(false); // Track if reviews are currently loading

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  useEffect(() => {
    if (!listingId) return;
    
    // Use AbortController to prevent duplicate requests
    const abortController = new AbortController();
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await loadReviews();
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error in loadReviews:', err);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, refreshTrigger, sortBy, filterRating]);

  // Load stats separately and only once per listing (non-blocking)
  useEffect(() => {
    if (listingId && statsListingRef.current !== listingId) {
      // Reset stats loaded flag when listing changes
      setStatsLoaded(false);
      statsListingRef.current = listingId;
      
      // Load stats asynchronously without blocking UI
      loadStats().catch(err => {
        console.warn('Failed to load stats:', err);
        // Set stats loaded even on error to prevent retry loops
        setStatsLoaded(true);
      });
    }
  }, [listingId]); // Only depend on listingId to avoid loops

  // Check if user can review this listing
  useEffect(() => {
    if (user && listingId) {
      reviewService.canReview(listingId)
        .then(response => setCanReview(response.can_review || false))
        .catch(() => setCanReview(false));
    } else {
      setCanReview(false);
    }
  }, [user, listingId, refreshTrigger]);

  const loadStats = async () => {
    try {
      // Use a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats load timeout')), 8000)
      );
      
      const allReviewsResponse = await Promise.race([
        reviewService.getReviewsByListing(listingId),
        timeoutPromise
      ]);
      
      const allReviews = Array.isArray(allReviewsResponse) 
        ? allReviewsResponse 
        : (allReviewsResponse?.results || allReviewsResponse?.data || []);
      
      if (allReviews.length > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
        
        setStats({
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: allReviews.length,
          ratingDistribution: distribution
        });
      } else {
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
      setStatsLoaded(true);
    } catch (err) {
      console.warn('Error loading stats:', err);
      // Don't fail the whole component if stats fail
      // Set empty stats and mark as loaded
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
      setStatsLoaded(true);
    }
  };

  const loadReviews = async () => {
    // Prevent duplicate concurrent requests
    if (loadingRef.current) {
      console.log('[ReviewList] Load already in progress, skipping...');
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Fetch filtered/sorted reviews only
      const options = { sort: sortBy };
      if (filterRating) options.rating = filterRating;
      
      const response = await reviewService.getReviewsWithFilters(listingId, options);
      const reviewsList = Array.isArray(response) ? response : (response?.results || response?.data || []);
      
      // Deduplicate reviews by ID to prevent duplicates (using Map for better performance)
      // Also check for duplicate content to catch edge cases
      const reviewsMap = new Map();
      const seenIds = new Set();
      
      reviewsList.forEach(review => {
        if (review && review.id) {
          // Skip if we've already seen this ID
          if (seenIds.has(review.id)) {
            console.warn(`[ReviewList] Duplicate review ID detected: ${review.id}`);
            return;
          }
          
          seenIds.add(review.id);
          reviewsMap.set(review.id, review);
        } else {
          console.warn('[ReviewList] Invalid review detected (no ID):', review);
        }
      });
      
      const uniqueReviews = Array.from(reviewsMap.values());
      
      if (reviewsList.length !== uniqueReviews.length) {
        console.warn(`[ReviewList] Found duplicates! Loaded ${reviewsList.length} reviews, ${uniqueReviews.length} unique after deduplication`);
      }
      
      setReviews(uniqueReviews);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      if (onReviewDeleted) onReviewDeleted(reviewId);
      addToast('Review deleted successfully', 'success');
      await loadReviews(); // Reload to update display
      await loadStats(); // Reload stats after deletion
    } catch (err) {
      console.error('Error deleting review:', err);
      addToast('Failed to delete review', 'error');
    }
  };

  const handleEdit = async (reviewData) => {
    try {
      await reviewService.updateReview(editingReview.id, reviewData);
      addToast('Review updated successfully!', 'success');
      setEditingReview(null);
      await loadReviews(); // Reload to update display
      await loadStats(); // Reload stats after update
      if (onReviewUpdated) onReviewUpdated();
    } catch (err) {
      console.error('Error updating review:', err);
      addToast(err.message || 'Failed to update review', 'error');
    }
  };

  const handleAddReview = async (reviewData) => {
    try {
      await reviewService.createReview(reviewData);
      addToast('Review added successfully!', 'success');
      setIsAddingReview(false);
      await loadReviews();
      await loadStats();
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      console.error('Error adding review:', err);
      addToast(err.message || 'Failed to add review', 'error');
    }
  };

  const handleVote = () => {
    // Refresh reviews to update vote counts (no need to reload stats)
    loadReviews();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Reviews Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-5 border border-gray-200 dark:border-white/10 animate-pulse">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Overall Rating */}
            <div className="text-center md:text-left md:border-r border-gray-200 dark:border-white/10 pr-0 md:pr-8">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  {stats.averageRating}
                </span>
                <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            {/* Rating Distribution */}
            <div className="col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-12">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {rating}
                      </span>
                      <Star className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          rating >= 4 ? 'bg-green-500' : 
                          rating === 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                      {percentage > 0 ? `${Math.round(percentage)}%` : '0%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sorting and Filtering Controls */}
      {stats.totalReviews > 0 && (
        <div className="bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 p-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Sort Dropdown */}
              <div className="relative">
                <SelectField
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'rating_high', label: 'Highest Rating' },
                    { value: 'rating_low', label: 'Lowest Rating' },
                    { value: 'helpful', label: 'Most Helpful' },
                  ]}
                  className="appearance-none bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              {/* Rating Filter */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                    filterRating
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>{filterRating ? `${filterRating} stars` : 'Filter by rating'}</span>
                  {filterRating && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterRating(null);
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-2 min-w-[150px]">
                    <button
                      onClick={() => {
                        setFilterRating(null);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        !filterRating ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
                      }`}
                    >
                      All Ratings
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        onClick={() => {
                          setFilterRating(rating);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                          filterRating === rating ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
                        }`}
                      >
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{rating} {rating === 1 ? 'star' : 'stars'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {reviews.length} of {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              {filterRating && ` (${filterRating} stars)`}
            </div>
          </div>
        </div>
      )}

      {/* Add Review Button */}
      {user && canReview && !isAddingReview && !editingReview && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsAddingReview(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Write a Review</span>
          </button>
        </div>
      )}



      {/* Login prompt for guests */}
      {!user && (
        <div className="text-center py-3 px-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <a href="/auth/signin" className="text-orange-500 hover:text-orange-600 font-medium">Sign in</a> to leave a review.
          </p>
        </div>
      )}

      {/* Add Review Form */}
      <AnimatePresence>
        {isAddingReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ReviewForm
              listingId={listingId}
              onSubmit={handleAddReview}
              onCancel={() => setIsAddingReview(false)}
              loading={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form */}
      {editingReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ReviewForm
            listingId={listingId}
            initialData={editingReview}
            onSubmit={handleEdit}
            onCancel={() => setEditingReview(null)}
            loading={false}
          />
        </motion.div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/20"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            This vehicle hasn't received any reviews yet. Be the first to share your experience!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={`review-${review.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ReviewCard
                review={review}
                showActions={user?.id === review.user?.id}
                onEdit={setEditingReview}
                onDelete={handleDelete}
                onVote={handleVote}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

