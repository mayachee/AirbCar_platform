'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewList, ReviewForm } from '@/features/reviews';
import { reviewService } from '@/features/reviews';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

import { useTranslations } from 'next-intl'

export default function Reviews({ vehicle }) {
  const t = useTranslations('car_details')
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingCanReview, setCheckingCanReview] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const listingId = vehicle?.id || vehicle?.listing_id;

  useEffect(() => {
    if (user && listingId) {
      checkCanReview();
    }
  }, [user, listingId]);

  const checkCanReview = async () => {
    if (!user || !listingId) {
      setCanReview(false);
      return;
    }

    try {
      setCheckingCanReview(true);
      const response = await reviewService.canReview(listingId);
      setCanReview(response.can_review || false);
    } catch (err) {
      console.error('Error checking if can review:', err);
      setCanReview(false);
    } finally {
      setCheckingCanReview(false);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await reviewService.createReview(reviewData);
      addToast(t('review_submitted_success'), 'success');
      setShowForm(false);
      setCanReview(false);
      setRefreshTrigger(prev => prev + 1); // Trigger ReviewList refresh
      checkCanReview();
    } catch (err) {
      console.error('Error submitting review:', err);
      addToast(err.message || t('failed_submit_review'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Review Button */}
      {user && canReview && !showForm && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowForm(true)}
          className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>{t('write_review')}</span>
        </motion.button>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ReviewForm
              listingId={listingId}
              onSubmit={handleSubmitReview}
              onCancel={() => setShowForm(false)}
              loading={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {listingId && (
        <ReviewList
          listingId={listingId}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}

