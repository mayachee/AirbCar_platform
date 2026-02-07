"""
Review-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Avg, Count
from django.utils import timezone
from django.conf import settings
import traceback

from ..models import Listing, Booking, Review, ReviewVote, ReviewReport, ReviewReply, ReviewReaction, Partner
from ..serializers import ReviewSerializer, ReviewReportSerializer, ReviewReplySerializer

# Notification helpers
try:
    from ..utils.notifications import notify_new_review, notify_review_reply
except ImportError:
    notify_new_review = notify_review_reply = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _update_listing_rating(listing):
    """Recalculate and persist a listing's aggregate rating."""
    agg = Review.objects.filter(listing=listing, is_published=True).aggregate(
        avg=Avg('rating'), cnt=Count('id')
    )
    listing.rating = round(agg['avg'] or 0, 2)
    listing.review_count = agg['cnt'] or 0
    listing.save(update_fields=['rating', 'review_count'])


def _get_sorted_reviews(reviews, sort_param):
    """Apply sorting to a review queryset."""
    sort_map = {
        'newest': '-created_at',
        'oldest': 'created_at',
        'highest': '-rating',
        'lowest': 'rating',
        'most_helpful': '-helpful_count',
    }
    ordering = sort_map.get(sort_param, '-created_at')
    return reviews.order_by(ordering)


def _paginate(queryset, request):
    """Simple page/page_size pagination returning (page_qs, meta)."""
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(int(request.query_params.get('page_size',
                        request.query_params.get('limit', 20))), 100)
    total_count = queryset.count()
    start = (page - 1) * page_size
    page_qs = queryset[start:start + page_size]
    return page_qs, {
        'page': page,
        'page_size': page_size,
        'total_count': total_count,
        'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
    }


# ---------------------------------------------------------------------------
# Review list / create
# ---------------------------------------------------------------------------

class ReviewListView(APIView):
    """List reviews (public) or create a new review (authenticated)."""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        try:
            listing_id = request.query_params.get('listing_id') or request.query_params.get('listing')
            rating_filter = request.query_params.get('rating')
            sort_param = request.query_params.get('sort')
            search_param = request.query_params.get('search')
            user_filter = request.query_params.get('user')
            my_listings = request.query_params.get('my_listings')

            reviews = Review.objects.select_related('listing', 'user')

            is_admin = request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'

            # Partner viewing their own listings' reviews (includes unpublished)
            if my_listings == 'true' and request.user.is_authenticated:
                try:
                    partner = Partner.objects.get(user=request.user)
                    reviews = reviews.filter(listing__partner=partner)
                except Partner.DoesNotExist:
                    return Response({'data': [], 'count': 0, 'total_count': 0}, status=status.HTTP_200_OK)
            elif listing_id:
                if is_admin:
                    reviews = reviews.filter(listing_id=listing_id)
                else:
                    reviews = reviews.filter(listing_id=listing_id, is_published=True)
            elif user_filter:
                reviews = reviews.filter(user_id=user_filter, is_published=True)
            elif is_admin:
                # Admin sees all reviews including unpublished
                pass
            else:
                reviews = reviews.filter(is_published=True)

            if rating_filter:
                try:
                    reviews = reviews.filter(rating=int(rating_filter))
                except (ValueError, TypeError):
                    pass

            if search_param:
                reviews = reviews.filter(comment__icontains=search_param)

            reviews = _get_sorted_reviews(reviews, sort_param)

            page_qs, meta = _paginate(reviews, request)
            serializer = ReviewSerializer(page_qs, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                **meta,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            if settings.DEBUG:
                print(f"Error in ReviewListView.get: {e}")
                traceback.print_exc()
            return Response({'error': 'An error occurred', 'message': str(e) if settings.DEBUG else None},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            listing_id = request.data.get('listing_id') or request.data.get('listing')
            rating = request.data.get('rating')
            comment = request.data.get('comment', '')

            if not listing_id:
                return Response({'error': 'listing_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                rating = int(rating)
            except (TypeError, ValueError):
                return Response({'error': 'Rating must be an integer between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)
            if not (1 <= rating <= 5):
                return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                listing = Listing.objects.get(pk=listing_id)
            except Listing.DoesNotExist:
                return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

            # Prevent owners from reviewing their own listing
            if listing.partner_id and listing.partner.user_id == request.user.id:
                return Response({'error': 'You cannot review your own listing'},
                                status=status.HTTP_403_FORBIDDEN)

            existing = Review.objects.filter(user=request.user, listing=listing).first()
            if existing:
                existing.rating = rating
                existing.comment = comment
                existing.is_published = True
                existing.is_verified = True
                existing.save()
                _update_listing_rating(listing)
                serializer = ReviewSerializer(existing, context={'request': request})
                return Response({'data': serializer.data, 'message': 'Review updated successfully'}, status=status.HTTP_200_OK)
            else:
                review = Review.objects.create(
                    user=request.user, listing=listing,
                    rating=rating, comment=comment,
                    is_published=True, is_verified=True,
                )
                _update_listing_rating(listing)

                # Notify listing owner about the new review
                if notify_new_review and hasattr(listing, 'partner') and hasattr(listing.partner, 'user'):
                    try:
                        notify_new_review(listing.partner.user, review)
                    except Exception:
                        pass

                serializer = ReviewSerializer(review, context={'request': request})
                return Response({'data': serializer.data, 'message': 'Review created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            if settings.DEBUG:
                print(f"Error in ReviewListView.post: {e}")
                traceback.print_exc()
            return Response({'error': 'An error occurred', 'message': str(e) if settings.DEBUG else None},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Single review detail (GET / PATCH / DELETE)
# ---------------------------------------------------------------------------

class ReviewDetailView(APIView):
    """Retrieve, update, or delete a single review."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            review = Review.objects.select_related('listing', 'user').get(pk=pk)
            # Non-admin users can only see published reviews
            is_admin = request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'
            if not review.is_published and not is_admin:
                return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = ReviewSerializer(review, context={'request': request})
            return Response({'data': serializer.data}, status=status.HTTP_200_OK)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        """Owner updates their own review. Admin can also update."""
        is_admin = getattr(request.user, 'role', None) == 'admin'
        try:
            if is_admin:
                review = Review.objects.select_related('listing').get(pk=pk)
            else:
                review = Review.objects.select_related('listing').get(pk=pk, user=request.user)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found or not yours'}, status=status.HTTP_404_NOT_FOUND)

        if 'rating' in request.data:
            try:
                review.rating = int(request.data['rating'])
            except (TypeError, ValueError):
                return Response({'error': 'Invalid rating'}, status=status.HTTP_400_BAD_REQUEST)
        if 'comment' in request.data:
            review.comment = request.data['comment']
        review.save()
        _update_listing_rating(review.listing)
        serializer = ReviewSerializer(review, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Review updated'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Owner or admin deletes a review."""
        try:
            review = Review.objects.select_related('listing').get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        is_owner = review.user_id == request.user.id
        is_admin = getattr(request.user, 'role', None) == 'admin'
        if not (is_owner or is_admin):
            return Response({'error': 'Not authorized to delete this review'}, status=status.HTTP_403_FORBIDDEN)

        listing = review.listing
        review.delete()
        _update_listing_rating(listing)
        return Response({'message': 'Review deleted'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Can review check
# ---------------------------------------------------------------------------

class CanReviewView(APIView):
    """Check if the authenticated user can review a listing."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        listing_id = request.query_params.get('listing_id') or request.query_params.get('listing')
        if not listing_id:
            return Response({'error': 'listing_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            has_review = Review.objects.filter(user=request.user, listing=listing).exists()
            is_owner = listing.partner_id and listing.partner.user_id == request.user.id
            return Response({
                'can_review': not has_review and not is_owner,
                'has_review': has_review,
                'is_owner': is_owner,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            if settings.DEBUG:
                print(f"Error in CanReviewView: {e}")
            return Response({'error': 'An error occurred', 'message': str(e) if settings.DEBUG else None},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Helpful votes
# ---------------------------------------------------------------------------

class ReviewVoteView(APIView):
    """Vote a review as helpful (POST) or remove vote (DELETE)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        if review.user_id == request.user.id:
            return Response({'error': 'Cannot vote on your own review'}, status=status.HTTP_400_BAD_REQUEST)

        _, created = ReviewVote.objects.get_or_create(
            review=review, user=request.user,
            defaults={'is_helpful': request.data.get('is_helpful', True)}
        )
        if not created:
            return Response({'message': 'Already voted'}, status=status.HTTP_200_OK)

        review.helpful_count = review.votes.count()
        review.save(update_fields=['helpful_count'])
        serializer = ReviewSerializer(review, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Vote recorded'}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        deleted, _ = ReviewVote.objects.filter(review_id=pk, user=request.user).delete()
        if not deleted:
            return Response({'error': 'No vote to remove'}, status=status.HTTP_404_NOT_FOUND)
        try:
            review = Review.objects.get(pk=pk)
            review.helpful_count = review.votes.count()
            review.save(update_fields=['helpful_count'])
        except Review.DoesNotExist:
            pass
        return Response({'message': 'Vote removed'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Owner response
# ---------------------------------------------------------------------------

class ReviewRespondView(APIView):
    """Partner responds to a review on their listing (POST) or clears it (PATCH)."""
    permission_classes = [IsAuthenticated]

    def _get_review_for_partner(self, request, pk):
        try:
            review = Review.objects.select_related('listing__partner').get(pk=pk)
        except Review.DoesNotExist:
            return None, Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
        if review.listing.partner.user_id != request.user.id:
            return None, Response({'error': 'Not your listing'}, status=status.HTTP_403_FORBIDDEN)
        return review, None

    def post(self, request, pk):
        review, err = self._get_review_for_partner(request, pk)
        if err:
            return err
        response_text = request.data.get('owner_response', '').strip()
        if not response_text:
            return Response({'error': 'owner_response is required'}, status=status.HTTP_400_BAD_REQUEST)
        review.owner_response = response_text
        review.owner_response_at = timezone.now()
        review.save(update_fields=['owner_response', 'owner_response_at'])
        serializer = ReviewSerializer(review, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Response added'}, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        """Clear owner response."""
        review, err = self._get_review_for_partner(request, pk)
        if err:
            return err
        review.owner_response = None
        review.owner_response_at = None
        review.save(update_fields=['owner_response', 'owner_response_at'])
        serializer = ReviewSerializer(review, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Response removed'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Publish / unpublish (partner or admin)
# ---------------------------------------------------------------------------

class ReviewPublishView(APIView):
    """Publish or unpublish a review (listing owner or admin)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            review = Review.objects.select_related('listing__partner').get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        is_partner = review.listing.partner.user_id == request.user.id
        is_admin = request.user.role == 'admin'
        if not (is_partner or is_admin):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        review.is_published = request.data.get('is_published', True)
        review.save(update_fields=['is_published'])
        _update_listing_rating(review.listing)
        serializer = ReviewSerializer(review, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Publish status updated'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Report review
# ---------------------------------------------------------------------------

class ReviewReportView(APIView):
    """Report a review for moderation."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        if ReviewReport.objects.filter(review=review, user=request.user).exists():
            return Response({'error': 'You already reported this review'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')
        if reason not in dict(ReviewReport.REASON_CHOICES):
            return Response({'error': 'Invalid reason. Choose from: spam, inappropriate, harassment, false_info, other'},
                            status=status.HTTP_400_BAD_REQUEST)

        report = ReviewReport.objects.create(
            review=review, user=request.user,
            reason=reason, description=request.data.get('description', '')
        )
        return Response({'message': 'Report submitted', 'report_id': report.id}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Analytics (partner)
# ---------------------------------------------------------------------------

class ReviewAnalyticsView(APIView):
    """Review analytics for a partner's listings or platform-wide for admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_admin = getattr(request.user, 'role', None) == 'admin'

        if is_admin:
            # Platform-wide analytics for admin
            reviews = Review.objects.all()
            published_reviews = reviews.filter(is_published=True)
            total = reviews.count()
            published_count = published_reviews.count()
            unpublished_count = total - published_count
            agg = published_reviews.aggregate(avg_rating=Avg('rating'))
            avg_rating = round(agg['avg_rating'] or 0, 2)

            distribution = {str(i): 0 for i in range(1, 6)}
            for entry in published_reviews.values('rating').annotate(count=Count('id')):
                distribution[str(entry['rating'])] = entry['count']

            with_responses = reviews.filter(owner_response__isnull=False).exclude(owner_response='').count()
            total_helpful = reviews.aggregate(total=Count('votes'))['total'] or 0
            reported_count = ReviewReport.objects.count()

            recent = reviews.order_by('-created_at')[:5]
            recent_serialized = ReviewSerializer(recent, many=True, context={'request': request}).data

            return Response({
                'total_reviews': total,
                'published_count': published_count,
                'unpublished_count': unpublished_count,
                'average_rating': avg_rating,
                'rating_distribution': distribution,
                'reviews_with_responses': with_responses,
                'total_helpful_votes': total_helpful,
                'reported_count': reported_count,
                'recent_reviews': recent_serialized,
            }, status=status.HTTP_200_OK)

        # Partner analytics
        try:
            partner = Partner.objects.get(user=request.user)
        except Partner.DoesNotExist:
            return Response({'error': 'Partner profile not found'}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.filter(listing__partner=partner, is_published=True)
        total = reviews.count()
        agg = reviews.aggregate(avg_rating=Avg('rating'))
        avg_rating = round(agg['avg_rating'] or 0, 2)

        distribution = {str(i): 0 for i in range(1, 6)}
        for entry in reviews.values('rating').annotate(count=Count('id')):
            distribution[str(entry['rating'])] = entry['count']

        recent = reviews.order_by('-created_at')[:5]
        recent_serialized = ReviewSerializer(recent, many=True, context={'request': request}).data

        return Response({
            'total_reviews': total,
            'average_rating': avg_rating,
            'rating_distribution': distribution,
            'recent_reviews': recent_serialized,
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Replies on reviews
# ---------------------------------------------------------------------------

class ReviewReplyListView(APIView):
    """List replies for a review (GET) or add a reply (POST)."""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        """Get all replies for a review (top-level, children nested)."""
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        replies = ReviewReply.objects.filter(review=review, parent__isnull=True).select_related('user')
        serializer = ReviewReplySerializer(replies, many=True, context={'request': request})
        return Response({'data': serializer.data, 'count': replies.count()}, status=status.HTTP_200_OK)

    def post(self, request, pk):
        """Add a reply to a review."""
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        comment = (request.data.get('comment') or '').strip()
        if not comment:
            return Response({'error': 'Comment is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(comment) < 2:
            return Response({'error': 'Comment is too short'}, status=status.HTTP_400_BAD_REQUEST)

        parent_id = request.data.get('parent')
        parent = None
        if parent_id:
            try:
                parent = ReviewReply.objects.get(pk=parent_id, review=review)
            except ReviewReply.DoesNotExist:
                return Response({'error': 'Parent reply not found'}, status=status.HTTP_404_NOT_FOUND)

        reply = ReviewReply.objects.create(
            review=review,
            user=request.user,
            parent=parent,
            comment=comment,
        )

        # Notify the original reviewer about the reply (unless replying to own review)
        if notify_review_reply and review.user_id != request.user.id:
            try:
                notify_review_reply(review.user, reply)
            except Exception:
                pass

        serializer = ReviewReplySerializer(reply, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Reply added'}, status=status.HTTP_201_CREATED)


class ReviewReplyDetailView(APIView):
    """Edit or delete a reply (owner or admin only)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, reply_id):
        """Edit own reply."""
        try:
            reply = ReviewReply.objects.get(pk=reply_id, review_id=pk)
        except ReviewReply.DoesNotExist:
            return Response({'error': 'Reply not found'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = getattr(request.user, 'role', None) == 'admin'
        if reply.user_id != request.user.id and not is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        comment = (request.data.get('comment') or '').strip()
        if not comment:
            return Response({'error': 'Comment is required'}, status=status.HTTP_400_BAD_REQUEST)

        reply.comment = comment
        reply.save(update_fields=['comment', 'updated_at'])
        serializer = ReviewReplySerializer(reply, context={'request': request})
        return Response({'data': serializer.data, 'message': 'Reply updated'}, status=status.HTTP_200_OK)

    def delete(self, request, pk, reply_id):
        """Delete own reply."""
        try:
            reply = ReviewReply.objects.get(pk=reply_id, review_id=pk)
        except ReviewReply.DoesNotExist:
            return Response({'error': 'Reply not found'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = getattr(request.user, 'role', None) == 'admin'
        if reply.user_id != request.user.id and not is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        reply.delete()
        return Response({'message': 'Reply deleted'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Reactions on reviews
# ---------------------------------------------------------------------------

class ReviewReactionView(APIView):
    """Add or change reaction (POST) or remove reaction (DELETE)."""
    permission_classes = [IsAuthenticated]

    VALID_REACTIONS = ['like', 'dislike', 'love', 'laugh', 'wow', 'sad', 'angry']

    def post(self, request, pk):
        """Add or update reaction on a review."""
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        reaction = request.data.get('reaction', '').strip()
        if reaction not in self.VALID_REACTIONS:
            valid = ', '.join(self.VALID_REACTIONS)
            return Response(
                {'error': f'Invalid reaction. Choose from: {valid}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj, created = ReviewReaction.objects.update_or_create(
            review=review, user=request.user,
            defaults={'reaction': reaction},
        )

        # Return updated summary
        counts_qs = review.reactions.values('reaction').annotate(count=Count('id'))
        reaction_counts = {r['reaction']: r['count'] for r in counts_qs}
        total = sum(reaction_counts.values())

        return Response({
            'message': 'Reaction added' if created else 'Reaction updated',
            'reaction_counts': reaction_counts,
            'user_reaction': reaction,
            'total': total,
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Remove reaction from a review."""
        deleted, _ = ReviewReaction.objects.filter(review_id=pk, user=request.user).delete()
        if not deleted:
            return Response({'error': 'No reaction to remove'}, status=status.HTTP_404_NOT_FOUND)

        review = Review.objects.get(pk=pk)
        counts_qs = review.reactions.values('reaction').annotate(count=Count('id'))
        reaction_counts = {r['reaction']: r['count'] for r in counts_qs}
        total = sum(reaction_counts.values())

        return Response({
            'message': 'Reaction removed',
            'reaction_counts': reaction_counts,
            'user_reaction': None,
            'total': total,
        }, status=status.HTTP_200_OK)
