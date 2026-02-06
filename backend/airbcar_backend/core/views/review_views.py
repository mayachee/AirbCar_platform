"""
Review-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum, Count
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
import traceback

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)


class ReviewListView(APIView):
    """List all reviews or create a new review."""
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get(self, request):
        """List reviews, optionally filtered by listing."""
        try:
            listing_id = request.query_params.get('listing_id') or request.query_params.get('listing')
            rating_filter = request.query_params.get('rating')
            
            if listing_id:
                reviews = Review.objects.filter(
                    listing_id=listing_id,
                    is_published=True
                )
            else:
                reviews = Review.objects.filter(is_published=True)
            
            # Filter by rating if provided
            if rating_filter:
                try:
                    reviews = reviews.filter(rating=int(rating_filter))
                except ValueError:
                    pass
            
            reviews = reviews.select_related('listing', 'user').order_by('-created_at')
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)
            
            total_count = reviews.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            reviews = reviews[start:end]
            
            serializer = ReviewSerializer(reviews, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ReviewListView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new review."""
        try:
            listing_id = request.data.get('listing_id') or request.data.get('listing')
            rating = request.data.get('rating')
            comment = request.data.get('comment', '')
            
            if not listing_id:
                return Response({
                    'error': 'listing_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not rating or not (1 <= int(rating) <= 5):
                return Response({
                    'error': 'Rating is required and must be between 1 and 5'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                listing = Listing.objects.get(pk=listing_id)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has completed a booking for this listing
            has_booking = Booking.objects.filter(
                customer=request.user,
                listing=listing,
                status='completed'
            ).exists()
            
            if not has_booking:
                return Response({
                    'error': 'You can only review listings you have booked and completed'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user already reviewed this listing
            existing_review = Review.objects.filter(
                user=request.user,
                listing=listing
            ).first()
            
            if existing_review:
                # Update existing review
                existing_review.rating = rating
                existing_review.comment = comment
                existing_review.is_published = True
                existing_review.save()
                
                # Update listing rating
                reviews = Review.objects.filter(listing=listing, is_published=True)
                avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
                listing.rating = round(avg_rating, 2)
                listing.review_count = reviews.count()
                listing.save()
                
                serializer = ReviewSerializer(existing_review, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Review updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                # Create new review
                review = Review.objects.create(
                    user=request.user,
                    listing=listing,
                    rating=rating,
                    comment=comment,
                    is_published=True
                )
                
                # Update listing rating
                reviews = Review.objects.filter(listing=listing, is_published=True)
                avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
                listing.rating = round(avg_rating, 2)
                listing.review_count = reviews.count()
                listing.save()
                
                serializer = ReviewSerializer(review, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Review created successfully'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ReviewListView.post: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CanReviewView(APIView):
    """Check if user can review a listing."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check if user can review a listing."""
        listing_id = request.query_params.get('listing_id') or request.query_params.get('listing')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Check if user has completed a booking
            has_completed_booking = Booking.objects.filter(
                customer=request.user,
                listing=listing,
                status='completed'
            ).exists()
            
            # Check if user already reviewed
            has_review = Review.objects.filter(
                user=request.user,
                listing=listing
            ).exists()
            
            return Response({
                'can_review': has_completed_booking and not has_review,
                'has_completed_booking': has_completed_booking,
                'has_review': has_review
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in CanReviewView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
