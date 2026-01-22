from django.db.models import Q, Prefetch, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from listings.models import Listing
from bookings.models import Booking

from .models import Review, ReviewVote, ReviewReport
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.
    Reviews are public - anyone can view them.
    Users can create reviews for listings they've booked (completed bookings).
    Partners can manage reviews for their listings.
    """
    queryset = Review.objects.all().select_related('user', 'listing')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Read-only for unauthenticated, authenticated can create/update
    
    def get_queryset(self):
        # Admins can see all reviews (including unpublished)
        # Regular users see only published reviews
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = Review.objects.all().select_related('user', 'listing')
        else:
            queryset = Review.objects.filter(is_published=True).select_related('user', 'listing')
        
        # Filter by listing early to reduce query size (most common filter)
        listing_id = self.request.query_params.get('listing', None)
        if listing_id:
            try:
                listing_id = int(listing_id)
                queryset = queryset.filter(listing_id=listing_id)
            except (ValueError, TypeError):
                pass  # Invalid listing ID, ignore filter
        
        # Prefetch votes for the current user to avoid N+1 queries
        # Only do this if user is authenticated to avoid anonymous user issues
        # Do this AFTER filtering by listing to optimize the prefetch query
        try:
            if self.request.user.is_authenticated:
                queryset = queryset.prefetch_related(
                    Prefetch(
                        'votes',
                        queryset=ReviewVote.objects.filter(user=self.request.user),
                        to_attr='user_votes'
                    )
                )
        except Exception:
            # If prefetch fails, continue without it (won't break functionality)
            pass
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user', None)
        if user_id:
            try:
                user_id = int(user_id)
                queryset = queryset.filter(user_id=user_id)
            except (ValueError, TypeError):
                pass  # Invalid user ID, ignore filter
        
        # Filter by rating
        rating = self.request.query_params.get('rating', None)
        if rating:
            try:
                rating = int(rating)
                if 1 <= rating <= 5:
                    queryset = queryset.filter(rating=rating)
            except (ValueError, TypeError):
                pass
        
        # Search by text content
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(comment__icontains=search)
            )
        
        # Partners can see all reviews (including unpublished) for their listings
        if self.request.user.is_authenticated:
            if self.request.query_params.get('my_listings', 'false').lower() == 'true':
                try:
                    partner_listings = Listing.objects.filter(partner__user=self.request.user)
                    queryset = Review.objects.filter(listing__in=partner_listings).select_related('user', 'listing')
                except Exception:
                    pass  # If partner doesn't exist, fall back to published reviews
        
        # Sorting options
        sort_by = self.request.query_params.get('sort', 'newest')
        if sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'rating_high':
            queryset = queryset.order_by('-rating', '-created_at')
        elif sort_by == 'rating_low':
            queryset = queryset.order_by('rating', '-created_at')
        elif sort_by == 'helpful':
            queryset = queryset.order_by('-helpful_count', '-created_at')
        else:  # newest (default)
            queryset = queryset.order_by('-created_at')
        
        # Ensure distinct results (prevent duplicates from joins)
        queryset = queryset.distinct()
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set user and listing when creating review"""
        listing_id = self.request.data.get('listing')
        booking_id = self.request.data.get('booking')
        
        if not listing_id:
            raise ValidationError({"listing": "Listing ID is required"})
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            raise ValidationError({"listing": "Listing not found"})
        
        # If booking is provided, validate it
        if booking_id:
            try:
                booking = Booking.objects.get(pk=booking_id, user=self.request.user, status='completed')
                serializer.save(
                    user=self.request.user,
                    listing=listing,
                    booking=booking,
                    is_verified=True  # Verified if from completed booking
                )
            except Booking.DoesNotExist:
                raise ValidationError({"booking": "Invalid booking or booking not completed"})
        else:
            serializer.save(
                user=self.request.user,
                listing=listing,
                is_verified=False
            )
    
    def perform_update(self, serializer):
        """Only allow user to update their own reviews"""
        review = self.get_object()
        if review.user != self.request.user:
            raise ValidationError({"detail": "You can only edit your own reviews"})
        serializer.save()
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """Partner can publish/unpublish reviews for their listings"""
        review = self.get_object()
        
        # Check if user is the partner of the listing
        if not hasattr(request.user, 'partner') or review.listing.partner.user != request.user:
            return Response(
                {"detail": "You can only manage reviews for your own listings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        is_published = request.data.get('is_published', True)
        review.is_published = is_published
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='can_review', permission_classes=[AllowAny])
    def can_review(self, request):
        """Check if user can review a listing"""
        listing_id = request.query_params.get('listing')
        booking_id = request.query_params.get('booking')
        
        if not listing_id:
            return Response(
                {"detail": "Listing ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"detail": "Listing not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If user is not authenticated, they cannot review
        if not request.user.is_authenticated:
            return Response({
                "can_review": False,
                "reason": "not_authenticated",
                "has_completed_booking": False
            })
        
        # Check if user has already reviewed this listing
        existing_review = Review.objects.filter(
            user=request.user,
            listing=listing
        ).first()
        
        if existing_review:
            return Response({
                "can_review": False,
                "reason": "already_reviewed",
                "existing_review_id": existing_review.id,
                "has_completed_booking": False
            })
        
        # If booking is provided, check if it's valid
        can_review = False
        has_completed_booking = False
        if booking_id:
            try:
                booking = Booking.objects.get(
                    pk=booking_id,
                    user=request.user,
                    listing=listing,
                    status='completed'
                )
                can_review = True
                has_completed_booking = True
            except Booking.DoesNotExist:
                pass
        else:
            # If no booking specified, check if user has any completed bookings for this listing
            has_completed_booking = Booking.objects.filter(
                user=request.user,
                listing=listing,
                status='completed'
            ).exists()
            can_review = True  # Allow review if user is authenticated
        
        return Response({
            "can_review": can_review,
            "has_completed_booking": has_completed_booking
        })
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote helpful/not helpful on a review"""
        review = self.get_object()
        user = request.user
        
        if request.method == 'DELETE':
            # Remove vote
            vote = ReviewVote.objects.filter(review=review, user=user).first()
            if vote:
                vote.delete()
            return Response({"detail": "Vote removed"})
        
        # Create or update vote
        is_helpful = request.data.get('is_helpful', True)
        vote, created = ReviewVote.objects.get_or_create(
            review=review,
            user=user,
            defaults={'is_helpful': is_helpful}
        )
        
        if not created:
            vote.is_helpful = is_helpful
            vote.save()
        
        # Update helpful count
        helpful_count = ReviewVote.objects.filter(review=review, is_helpful=True).count()
        review.helpful_count = helpful_count
        review.save(update_fields=['helpful_count'])
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAuthenticated])
    def respond(self, request, pk=None):
        """Owner/partner can respond to a review"""
        review = self.get_object()
        
        # Check if user is the partner of the listing
        if not hasattr(request.user, 'partner') or review.listing.partner.user != request.user:
            return Response(
                {"detail": "You can only respond to reviews for your own listings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response_text = request.data.get('owner_response', '').strip()
        
        if request.method == 'PATCH' and not response_text:
            # Delete response
            review.owner_response = None
            review.owner_response_at = None
        else:
            if not response_text:
                return Response(
                    {"detail": "Response text is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            review.owner_response = response_text
            review.owner_response_at = timezone.now()
        
        review.save()
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def report(self, request, pk=None):
        """Report a review for moderation"""
        review = self.get_object()
        user = request.user
        
        # Check if user already reported this review
        existing_report = ReviewReport.objects.filter(review=review, user=user).first()
        if existing_report:
            return Response(
                {"detail": "You have already reported this review"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'other')
        description = request.data.get('description', '').strip()
        
        if reason not in [choice[0] for choice in ReviewReport.REVIEW_REPORT_REASONS]:
            reason = 'other'
        
        report = ReviewReport.objects.create(
            review=review,
            user=user,
            reason=reason,
            description=description
        )
        
        return Response({
            "detail": "Review reported successfully",
            "report_id": report.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request):
        """Get review analytics for partner's listings"""
        if not hasattr(request.user, 'partner'):
            return Response(
                {"detail": "You must be a partner to view analytics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        partner_listings = Listing.objects.filter(partner__user=request.user)
        reviews = Review.objects.filter(listing__in=partner_listings, is_published=True)
        
        # Calculate statistics
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        
        # Rating distribution
        rating_dist = {}
        for i in range(1, 6):
            rating_dist[i] = reviews.filter(rating=i).count()
        
        # Reviews over time (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_reviews = reviews.filter(created_at__gte=thirty_days_ago).count()
        
        # Most reviewed listings
        listing_review_counts = reviews.values('listing__id', 'listing__make', 'listing__model').annotate(
            review_count=Count('id'),
            avg_rating=Avg('rating')
        ).order_by('-review_count')[:5]
        
        return Response({
            "total_reviews": total_reviews,
            "average_rating": round(avg_rating, 1),
            "rating_distribution": rating_dist,
            "recent_reviews_30_days": recent_reviews,
            "top_listings": list(listing_review_counts),
            "total_helpful_votes": reviews.aggregate(Sum('helpful_count'))['helpful_count__sum'] or 0,
            "reviews_with_responses": reviews.filter(owner_response__isnull=False).count()
        })

