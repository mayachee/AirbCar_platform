'use client';

import { useState } from 'react';
import { Star, User, Calendar, CheckCircle, Verified, ThumbsUp, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { reviewService } from '../services/reviewService';
import { useToast } from '@/contexts/ToastContext';

export default function ReviewCard({ review, showActions = false, onEdit, onDelete, onVote, showOwnerActions = false }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [hasVoted, setHasVoted] = useState(review.user_has_voted || false);
  const [isVoting, setIsVoting] = useState(false);
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const isOwner = user && review.user?.id === user.id;
  const canVote = user && !isOwner && review.is_published;

  const handleVote = async () => {
    if (!canVote || isVoting) return;
    
    setIsVoting(true);
    try {
      if (hasVoted) {
        await reviewService.removeVote(review.id);
        setHasVoted(false);
        setHelpfulCount(prev => Math.max(0, prev - 1));
      } else {
        await reviewService.voteReview(review.id, true);
        setHasVoted(true);
        setHelpfulCount(prev => prev + 1);
      }
      if (onVote) onVote();
    } catch (err) {
      console.error('Error voting on review:', err);
      addToast('Failed to vote on review', 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400';
    if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRatingLabel = (rating) => {
    const labels = {
      5: 'Excellent',
      4: 'Very Good',
      3: 'Good',
      2: 'Fair',
      1: 'Poor'
    };
    return labels[rating] || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {review.user?.first_name?.[0] || review.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {review.user?.first_name && review.user?.last_name
                  ? `${review.user.first_name} ${review.user.last_name}`
                  : review.user?.email || 'Anonymous'}
              </h4>
              {review.is_verified && (
                <span className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                  <Verified className="h-3 w-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {renderStars(review.rating)}
                </div>
                <span className={`text-xs font-semibold ${getRatingColor(review.rating)}`}>
                  {getRatingLabel(review.rating)}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(review.created_at)}</span>
              </span>
              {review.updated_at !== review.created_at && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  (edited)
                </span>
              )}
            </div>
          </div>
        </div>
        {!review.is_published && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            Pending Review
          </span>
        )}
      </div>
      
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {review.comment}
          </p>
          {review.comment.length > 200 && (
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1">
              Read more
            </button>
          )}
        </div>
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
          <div className="flex items-start space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Owner Response</span>
                {review.owner_response_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(review.owner_response_at)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {review.owner_response}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions Row */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Helpful Vote */}
          {canVote && (
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                hasVoted
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              } disabled:opacity-50`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
              <span>Helpful</span>
              {helpfulCount > 0 && (
                <span className="text-xs">({helpfulCount})</span>
              )}
            </button>
          )}
          
          {/* User's own review actions */}
          {isOwner && (onEdit || onDelete) && (
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(review.id)}
                  className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        {helpfulCount > 0 && !canVote && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <ThumbsUp className="h-3 w-3" />
            <span>{helpfulCount} {helpfulCount === 1 ? 'person' : 'people'} found this helpful</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

