'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewForm({ 
  listingId, 
  bookingId = null, 
  onSubmit, 
  onCancel, 
  initialData = null,
  loading = false 
}) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialData?.comment || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = t('please_select_rating');
    }
    if (comment.trim().length < 10) {
      newErrors.comment = t('comment_min_length');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit({
      listing: listingId,
      booking: bookingId,
      rating,
      comment: comment.trim()
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {initialData ? t('edit_review') : t('write_a_review')}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('rating_label')} *
          </label>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => {
              const starValue = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      starValue <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {t('star_count', { count: rating })}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rating}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('your_review_label')} *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder={t('review_placeholder')}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.comment && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.comment}</p>
            )}
            <p className={`text-xs ml-auto ${
              comment.length < 10 
                ? 'text-gray-500 dark:text-gray-400' 
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              {t('character_count', { count: comment.length, max: 1000 })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || rating === 0 || comment.trim().length < 10}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('submitting')}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{initialData ? t('update_review') : t('submit_review')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

