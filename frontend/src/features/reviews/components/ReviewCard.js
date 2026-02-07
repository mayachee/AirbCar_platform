'use client';

import { useState } from 'react';
import { Star, Calendar, Verified, ThumbsUp, MessageSquare, Edit2, Trash2, Send, ChevronDown, ChevronUp, CornerDownRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { reviewService } from '../services/reviewService';
import { useToast } from '@/contexts/ToastContext';

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Haha' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
];

/* ── Threaded reply item ──────────────────────────────────────────── */
function ReplyItem({ reply, reviewId, depth = 0, onReplyAdded, onDelete }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user && reply.user?.id === user.id;
  const maxDepth = 2;

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await reviewService.addReply(reviewId, replyText.trim(), reply.id);
      setReplyText('');
      setShowReplyForm(false);
      if (onReplyAdded) onReplyAdded();
      addToast('Reply added!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await reviewService.deleteReply(reviewId, reply.id);
      if (onDelete) onDelete();
      addToast('Reply deleted', 'success');
    } catch (err) {
      addToast('Failed to delete reply', 'error');
    }
  };

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex items-start gap-2 py-2">
        <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {reply.user?.first_name?.[0] || reply.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {reply.user?.first_name ? `${reply.user.first_name} ${reply.user.last_name || ''}` : reply.user?.email || 'User'}
            </span>
            <span className="text-xs text-gray-400">{fmtDate(reply.created_at)}</span>
            {reply.updated_at !== reply.created_at && <span className="text-xs text-gray-400 italic">(edited)</span>}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{reply.comment}</p>
          <div className="flex items-center gap-3 mt-1">
            {user && depth < maxDepth && (
              <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1">
                <CornerDownRight className="h-3 w-3" /> Reply
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>
          <AnimatePresence>
            {showReplyForm && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmitReply} className="flex items-center gap-2 mt-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                <button type="submit" disabled={!replyText.trim() || submitting} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Send className="h-3.5 w-3.5" /></button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
      {reply.children && reply.children.length > 0 && (
        <div className="mt-1">
          {reply.children.map((child) => (
            <ReplyItem key={child.id} reply={child} reviewId={reviewId} depth={depth + 1} onReplyAdded={onReplyAdded} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main ReviewCard ──────────────────────────────────────────────── */
export default function ReviewCard({ review, showActions = false, onEdit, onDelete, onVote, showOwnerActions = false }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [hasVoted, setHasVoted] = useState(review.user_has_voted || false);
  const [isVoting, setIsVoting] = useState(false);

  // Reactions
  const [reactionCounts, setReactionCounts] = useState(review.reactions?.reaction_counts || {});
  const [userReaction, setUserReaction] = useState(review.reactions?.user_reaction || null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionsTotal, setReactionsTotal] = useState(review.reactions?.total || 0);

  // Replies
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(review.replies || []);
  const [replyCount, setReplyCount] = useState(review.reply_count || 0);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
    ));
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateString; }
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
    const labels = { 5: 'Excellent', 4: 'Very Good', 3: 'Good', 2: 'Fair', 1: 'Poor' };
    return labels[rating] || '';
  };

  /* ── Reactions ─────────────────────── */
  const handleReaction = async (reactionKey) => {
    if (!user) { addToast('Please sign in to react', 'info'); return; }
    try {
      if (userReaction === reactionKey) {
        const res = await reviewService.removeReaction(review.id);
        setReactionCounts(res.reaction_counts || {});
        setReactionsTotal(res.total || 0);
        setUserReaction(null);
      } else {
        const res = await reviewService.addReaction(review.id, reactionKey);
        setReactionCounts(res.reaction_counts || {});
        setReactionsTotal(res.total || 0);
        setUserReaction(reactionKey);
      }
    } catch {
      addToast('Failed to react', 'error');
    }
    setShowReactionPicker(false);
  };

  /* ── Replies ───────────────────────── */
  const loadReplies = async () => {
    try {
      const res = await reviewService.getReplies(review.id);
      setReplies(res.data || []);
      setReplyCount(res.count ?? replyCount);
    } catch { /* silent */ }
  };

  const handleToggleReplies = () => {
    if (!showReplies) loadReplies();
    setShowReplies(!showReplies);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;
    if (!user) { addToast('Please sign in to reply', 'info'); return; }
    setSubmittingReply(true);
    try {
      await reviewService.addReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
      setReplyCount(prev => prev + 1);
      setShowReplies(true);
      await loadReplies();
      addToast('Reply added!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to add reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const activeReactions = REACTIONS.filter(r => (reactionCounts[r.key] || 0) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-5 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
    >
      {/* Header */}
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
                <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                <span className={`text-xs font-semibold ${getRatingColor(review.rating)}`}>{getRatingLabel(review.rating)}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(review.created_at)}</span>
              </span>
              {review.updated_at !== review.created_at && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">(edited)</span>
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

      {/* Comment */}
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{review.comment}</p>
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.owner_response_at)}</span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{review.owner_response}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reaction pills (show existing reactions as small pills) */}
      {activeReactions.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-3">
          {activeReactions.map((r) => (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                userReaction === r.key
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-medium">{reactionCounts[r.key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Actions Row */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          {/* Helpful Vote */}
          {canVote && (
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                hasVoted ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              } disabled:opacity-50`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
              <span>Helpful</span>
              {helpfulCount > 0 && <span className="text-xs">({helpfulCount})</span>}
            </button>
          )}

          {/* Reaction picker */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <span>{userReaction ? REACTIONS.find(r => r.key === userReaction)?.emoji : '😀'}</span>
              <span>React</span>
            </button>
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-xl px-2 py-1.5 flex items-center gap-1 z-30"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleReaction(r.key)}
                      title={r.label}
                      className={`text-xl hover:scale-125 transition-transform px-1 ${userReaction === r.key ? 'scale-125 bg-blue-100 dark:bg-blue-900/30 rounded-full' : ''}`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reply button */}
          <button
            onClick={() => { setShowReplyInput(!showReplyInput); if (!showReplies && replyCount > 0) handleToggleReplies(); }}
            className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Reply</span>
            {replyCount > 0 && <span className="text-xs">({replyCount})</span>}
          </button>

          {/* Edit / Delete (own review) */}
          {isOwner && (onEdit || onDelete) && (
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button onClick={() => onEdit(review)} className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                  <Edit2 className="h-4 w-4" /><span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(review.id)} className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700">
                  <Trash2 className="h-4 w-4" /><span>Delete</span>
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

      {/* Reply input */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitReply}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={user ? 'Write a reply...' : 'Sign in to reply'}
              disabled={!user}
              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none disabled:opacity-50"
            />
            <button type="submit" disabled={!replyText.trim() || submittingReply || !user} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Send className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setShowReplyInput(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Replies thread */}
      {replyCount > 0 && (
        <div className="mt-2">
          <button onClick={handleToggleReplies} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
          <AnimatePresence>
            {showReplies && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1">
                {replies.map((reply) => (
                  <ReplyItem key={reply.id} reply={reply} reviewId={review.id} onReplyAdded={loadReplies} onDelete={() => { loadReplies(); setReplyCount(prev => Math.max(0, prev - 1)); }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

