"""
Partner-related views.
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
    ReviewSerializer, UserSerializer, PartnerSerializer,
)


class PartnerListView(APIView):
    """List all partners."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """List all partners."""
        try:
            partners = Partner.objects.filter(is_verified=True).select_related('user')
            
            # Filter by rating if provided
            min_rating = request.query_params.get('min_rating')
            if min_rating:
                try:
                    partners = partners.filter(rating__gte=float(min_rating))
                except ValueError:
                    pass
            
            # Order by rating or total bookings
            sort_by = request.query_params.get('sort', '-rating')
            if sort_by in ['rating', '-rating', 'total_bookings', '-total_bookings']:
                partners = partners.order_by(sort_by)
            else:
                partners = partners.order_by('-rating')
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)
            
            total_count = partners.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            partners = partners[start:end]
            
            serializer = PartnerSerializer(partners, many=True, context={'request': request})
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
                print(f"Error in PartnerListView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerMeView(APIView):
    """Get current user's partner profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's partner profile."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found',
                    'message': 'Please complete your partner profile first'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = PartnerSerializer(partner, context={'request': request})
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerMeView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        """Update partner profile (full update)."""
        return self._update_partner(request, partial=False)
    
    def patch(self, request):
        """Update partner profile (partial update)."""
        return self._update_partner(request, partial=True)
    
    def _update_partner(self, request, partial=True):
        """Internal method to update partner profile."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found',
                    'message': 'Please complete your partner profile first'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Handle FormData for logo upload
            # Create clean partner_data without file objects to prevent pickle issues
            partner_data = {}
            
            for key, value in request.data.items():
                # Skip file objects - they're handled separately via request.FILES
                if hasattr(value, 'read') or hasattr(value, 'chunks'):
                    continue
                
                # Include all fields including address, city, state (serializer will handle them)
                partner_data[key] = value
            
            # Handle logo file upload from FormData
            # If logo is in request.FILES, we need to tell the serializer to update it
            # Add a marker to partner_data so DRF knows we want to update the logo field
            if 'logo' in request.FILES:
                # Logo file is in request.FILES - add a marker so serializer knows to update it
                # The actual file will be accessed from request.FILES in serializer's update method
                partner_data['logo'] = None  # Marker - actual file comes from request.FILES
            elif 'logo' in partner_data:
                # Handle logo removal (empty string in JSON request)
                if isinstance(partner_data['logo'], str) and partner_data['logo'] == '':
                    # Empty string means remove logo
                    partner_data['logo'] = None
            
            serializer = PartnerSerializer(
                partner,
                data=partner_data,
                partial=partial,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'data': serializer.data,
                    'message': 'Partner profile updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerMeView._update_partner: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerDetailView(APIView):
    """Get partner detail by ID."""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        """Get partner detail by ID."""
        try:
            partner = Partner.objects.select_related('user').get(pk=pk)
            serializer = PartnerSerializer(partner, context={'request': request})
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerDetailView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerEarningsView(APIView):
    """Get partner earnings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get partner earnings statistics."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Calculate earnings from completed bookings
            completed_bookings = Booking.objects.filter(
                partner=partner,
                status='completed',
                payment_status='paid'
            )
            
            total_earnings = completed_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            # Monthly earnings (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            monthly_earnings = completed_bookings.filter(
                created_at__gte=thirty_days_ago
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            return Response({
                'total_earnings': float(total_earnings),
                'monthly_earnings': float(monthly_earnings),
                'total_bookings': completed_bookings.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerEarningsView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerAnalyticsView(APIView):
    """Get partner analytics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get partner analytics."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get listing stats
            listings = Listing.objects.filter(partner=partner)
            total_listings = listings.count()
            available_listings = listings.filter(is_available=True).count()
            
            # Get booking stats
            bookings = Booking.objects.filter(partner=partner)
            total_bookings = bookings.count()
            pending_bookings = bookings.filter(status='pending').count()
            confirmed_bookings = bookings.filter(status='confirmed').count()
            active_bookings = bookings.filter(status='active').count()
            completed_bookings = bookings.filter(status='completed').count()
            cancelled_bookings = bookings.filter(status='cancelled').count()
            
            # Get review stats
            reviews = Review.objects.filter(listing__partner=partner, is_published=True)
            avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
            review_count = reviews.count()
            
            # Get earnings stats
            completed_paid = bookings.filter(status='completed', payment_status='paid')
            total_earnings = completed_paid.aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Monthly stats (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            monthly_bookings = bookings.filter(created_at__gte=thirty_days_ago).count()
            monthly_earnings = completed_paid.filter(
                created_at__gte=thirty_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            return Response({
                'listings': {
                    'total': total_listings,
                    'available': available_listings,
                    'unavailable': total_listings - available_listings
                },
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'confirmed': confirmed_bookings,
                    'active': active_bookings,
                    'completed': completed_bookings,
                    'cancelled': cancelled_bookings
                },
                'reviews': {
                    'average_rating': round(avg_rating, 2),
                    'count': review_count
                },
                'earnings': {
                    'total': float(total_earnings),
                    'monthly': float(monthly_earnings)
                },
                'monthly_stats': {
                    'bookings': monthly_bookings,
                    'earnings': float(monthly_earnings)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerAnalyticsView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerReviewsView(APIView):
    """Get partner reviews."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get reviews for partner's listings."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get reviews for partner's listings
            reviews = Review.objects.filter(
                listing__partner=partner,
                is_published=True
            ).select_related('listing', 'user').order_by('-created_at')
            
            serializer = ReviewSerializer(reviews, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerReviewsView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerActivityView(APIView):
    """Get partner activity."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recent partner activity."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get recent bookings
            recent_bookings = Booking.objects.filter(
                partner=partner
            ).select_related('listing', 'customer').order_by('-created_at')[:10]
            
            bookings_data = []
            for booking in recent_bookings:
                bookings_data.append({
                    'id': booking.id,
                    'listing': booking.listing.name if booking.listing else None,
                    'customer': booking.customer.username if booking.customer else None,
                    'status': booking.status,
                    'total_amount': float(booking.total_amount),
                    'created_at': booking.created_at
                })
            
            # Get recent listings
            recent_listings = Listing.objects.filter(
                partner=partner
            ).order_by('-created_at')[:10]
            
            listings_data = []
            for listing in recent_listings:
                listings_data.append({
                    'id': listing.id,
                    'name': listing.name,
                    'location': listing.location,
                    'price_per_day': float(listing.price_per_day),
                    'is_available': listing.is_available,
                    'created_at': listing.created_at
                })
            
            return Response({
                'recent_bookings': bookings_data,
                'recent_listings': listings_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerActivityView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
