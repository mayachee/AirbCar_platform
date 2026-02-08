"""
Partner-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum, Count, Min, Prefetch
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
import traceback

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer, PartnerSerializer, PartnerDetailSerializer,
)

# Notification helpers
try:
    from ..utils.notifications import notify_partner_approved, notify_partner_rejected
except ImportError:
    notify_partner_approved = notify_partner_rejected = None


class PartnerListView(APIView):
    """List all partners."""
    permission_classes = [AllowAny]

    def get_permissions(self):
        """Allow public reads, require auth for creation."""
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get(self, request):
        """List all partners."""
        try:
            partners = Partner.objects.select_related('user')
            
            # Admin with all=true can see unverified partners too
            show_all = request.query_params.get('all') == 'true'
            is_admin = request.user.is_authenticated and (getattr(request.user, 'role', None) == 'admin' or request.user.is_superuser or request.user.is_staff)
            if not (show_all and is_admin):
                partners = partners.filter(is_verified=True)
            
            partners = partners.annotate(
                    min_price_per_day=Min(
                        'listings__price_per_day',
                        filter=Q(listings__is_available=True, listings__is_verified=True),
                    )
                )
            
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

    def post(self, request):
        """Create the current user's partner profile."""
        try:
            if Partner.objects.filter(user=request.user).exists():
                return Response({
                    'error': 'Partner profile already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = PartnerSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)

            validated = dict(serializer.validated_data)

            # Extract user-related fields (these belong to User model, not Partner)
            phone_number = validated.pop('phone_number', None)
            first_name = validated.pop('first_name', None)
            last_name = validated.pop('last_name', None)

            partner = Partner.objects.create(user=request.user, **validated)

            # Update user fields that actually exist in User model
            user_fields_to_update = []
            
            # Always promote to partner role
            if getattr(request.user, 'role', None) != 'partner':
                request.user.role = 'partner'
                user_fields_to_update.append('role')
            
            # Update phone_number if provided (User model has this field)
            if phone_number is not None:
                request.user.phone_number = phone_number.strip() if phone_number and phone_number.strip() else None
                user_fields_to_update.append('phone_number')
            
            # Update first_name if provided (AbstractUser has this field)
            if first_name is not None:
                request.user.first_name = first_name.strip() if first_name else ''
                user_fields_to_update.append('first_name')
            
            # Update last_name if provided (AbstractUser has this field)
            if last_name is not None:
                request.user.last_name = last_name.strip() if last_name else ''
                user_fields_to_update.append('last_name')
            
            # Save user with only the fields that were updated and exist in the model
            if user_fields_to_update:
                request.user.save(update_fields=user_fields_to_update)

            out = PartnerSerializer(partner, context={'request': request})
            return Response({
                'data': out.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerListView.post: {error_msg}")
                traceback.print_exc()
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
                partner = Partner.objects.prefetch_related('listings').get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found',
                    'message': 'Please complete your partner profile first'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = PartnerDetailSerializer(partner, context={'request': request})
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
                try:
                    serializer.save()
                    return Response({
                        'data': serializer.data,
                        'message': 'Partner profile updated successfully'
                    }, status=status.HTTP_200_OK)
                except ValueError as ve:
                    # ValueError from Supabase upload or other validation errors
                    error_msg = str(ve)
                    if settings.DEBUG:
                        print(f"ValueError in PartnerMeView._update_partner.save: {error_msg}")
                        traceback.print_exc()
                    return Response({
                        'error': 'Validation failed',
                        'message': error_msg,
                        'errors': {'logo': [error_msg]} if 'logo' in error_msg.lower() else {}
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError as ve:
            # Catch ValueError before generic Exception
            error_msg = str(ve)
            if settings.DEBUG:
                print(f"ValueError in PartnerMeView._update_partner: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'Validation failed',
                'message': error_msg,
                'errors': {'logo': [error_msg]} if 'logo' in error_msg.lower() else {}
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
            # Use explicit Prefetch to ensure ALL listings are returned (no filtering)
            partner = Partner.objects.select_related('user').prefetch_related(
                Prefetch('listings', queryset=Listing.objects.all().order_by('-created_at'))
            ).get(pk=pk)
            serializer = PartnerDetailSerializer(partner, context={'request': request})
            if settings.DEBUG:
                print(f"PartnerDetailView: Partner {partner.id} has {partner.listings.count()} listings")
                # print(f"PartnerDetailView: Serializer data keys: {serializer.data.keys()}")
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

    def patch(self, request, pk):
        """Update partner (admin only — for approval/rejection)."""
        try:
            # Only admins/staff can update other partners
            if not (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            partner = Partner.objects.select_related('user').get(pk=pk)
            
            # Track verification status change for notifications
            old_status = getattr(partner, 'verification_status', None)
            
            # Apply allowed fields
            allowed_fields = ['is_verified', 'verification_status']
            for field in allowed_fields:
                if field in request.data:
                    setattr(partner, field, request.data[field])
            
            partner.save()
            
            # Send notification based on status change
            new_status = getattr(partner, 'verification_status', None)
            if new_status != old_status and partner.user:
                if new_status == 'approved' and notify_partner_approved:
                    try:
                        notify_partner_approved(partner.user)
                    except Exception:
                        pass
                elif new_status == 'rejected' and notify_partner_rejected:
                    try:
                        notify_partner_rejected(partner.user)
                    except Exception:
                        pass
            
            serializer = PartnerSerializer(partner, context={'request': request})
            return Response({'data': serializer.data}, status=status.HTTP_200_OK)
            
        except Partner.DoesNotExist:
            return Response({'error': 'Partner not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerDetailView.patch: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerEarningsView(APIView):
    """Get partner earnings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get partner earnings statistics with time-series data."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            sixty_days_ago = now - timedelta(days=60)
            seven_days_ago = now - timedelta(days=7)
            
            # All partner bookings
            all_bookings = Booking.objects.filter(listing__partner=partner)
            completed_bookings = all_bookings.filter(status='completed')
            
            # Total & monthly earnings
            total_earnings = completed_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            monthly_earnings = completed_bookings.filter(
                pickup_date__gte=thirty_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Previous month for growth calculation
            prev_month_earnings = completed_bookings.filter(
                pickup_date__gte=sixty_days_ago,
                pickup_date__lt=thirty_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            weekly_earnings = completed_bookings.filter(
                pickup_date__gte=seven_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Growth rate
            growth_rate = 0
            if prev_month_earnings > 0:
                growth_rate = round(((float(monthly_earnings) - float(prev_month_earnings)) / float(prev_month_earnings)) * 100, 1)
            
            # Average per booking
            completed_count = completed_bookings.count()
            avg_per_booking = round(float(total_earnings) / completed_count, 2) if completed_count > 0 else 0
            
            # Pending earnings (accepted but not completed)
            pending_earnings = all_bookings.filter(
                status='accepted'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Daily earnings for last 30 days
            from django.db.models.functions import TruncDate
            daily_earnings = (
                completed_bookings
                .filter(pickup_date__gte=thirty_days_ago)
                .annotate(day=TruncDate('pickup_date'))
                .values('day')
                .annotate(
                    revenue=Sum('total_amount'),
                    count=Count('id')
                )
                .order_by('day')
            )
            
            # Fill in missing days with 0
            daily_data = []
            for i in range(30):
                day = (thirty_days_ago + timedelta(days=i)).date()
                entry = next((d for d in daily_earnings if d['day'] == day), None)
                daily_data.append({
                    'date': day.isoformat(),
                    'revenue': float(entry['revenue']) if entry else 0,
                    'bookings': entry['count'] if entry else 0,
                })
            
            # Per-vehicle earnings
            from django.db.models.functions import Coalesce
            vehicle_earnings = (
                completed_bookings
                .values(
                    'listing__id', 'listing__make', 'listing__model', 'listing__year'
                )
                .annotate(
                    revenue=Coalesce(Sum('total_amount'), 0),
                    booking_count=Count('id')
                )
                .order_by('-revenue')[:10]
            )
            
            vehicle_earnings_data = [
                {
                    'id': v['listing__id'],
                    'name': f"{v['listing__make']} {v['listing__model']} {v['listing__year']}",
                    'revenue': float(v['revenue']),
                    'bookings': v['booking_count'],
                }
                for v in vehicle_earnings
            ]
            
            # Recent completed bookings (payout history)
            recent_completed = completed_bookings.select_related(
                'listing', 'customer'
            ).order_by('-pickup_date')[:10]
            
            payout_history = [
                {
                    'id': b.id,
                    'date': b.pickup_date.isoformat() if b.pickup_date else '',
                    'amount': float(b.total_amount),
                    'vehicle': f"{b.listing.make} {b.listing.model}" if b.listing else 'Unknown',
                    'customer': f"{b.customer.first_name} {b.customer.last_name}".strip() if b.customer else 'Unknown',
                    'status': 'completed',
                }
                for b in recent_completed
            ]
            
            return Response({
                'total_earnings': float(total_earnings),
                'monthly_earnings': float(monthly_earnings),
                'weekly_earnings': float(weekly_earnings),
                'pending_earnings': float(pending_earnings),
                'average_per_booking': avg_per_booking,
                'growth_rate': growth_rate,
                'total_bookings': completed_count,
                'daily_earnings': daily_data,
                'vehicle_earnings': vehicle_earnings_data,
                'payout_history': payout_history,
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
        """Get partner analytics with time-series and breakdowns."""
        try:
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            range_param = request.query_params.get('range', '30d')
            days = {'7d': 7, '30d': 30, '90d': 90}.get(range_param, 30)
            
            now = timezone.now()
            range_start = now - timedelta(days=days)
            prev_range_start = now - timedelta(days=days * 2)
            
            from django.db.models import Case, When, IntegerField
            from django.db.models.functions import TruncDate, Coalesce
            
            # Listing stats
            listing_stats = Listing.objects.filter(partner=partner).aggregate(
                total=Count('id'),
                available=Count('id', filter=Q(is_available=True))
            )
            total_listings = listing_stats['total']
            available_listings = listing_stats['available']
            
            # All bookings
            all_bookings = Booking.objects.filter(listing__partner=partner)
            
            # Current & previous period bookings
            current_bookings = all_bookings.filter(pickup_date__gte=range_start)
            prev_bookings = all_bookings.filter(pickup_date__gte=prev_range_start, pickup_date__lt=range_start)
            
            # Aggregate stats
            booking_stats = all_bookings.aggregate(
                total=Count('id'),
                pending=Count('id', filter=Q(status='pending')),
                accepted=Count('id', filter=Q(status='accepted')),
                completed=Count('id', filter=Q(status='completed')),
                cancelled=Count('id', filter=Q(status='cancelled')),
                rejected=Count('id', filter=Q(status='rejected')),
            )
            
            # Revenue calculations
            completed_in_range = current_bookings.filter(status='completed')
            total_revenue = completed_in_range.aggregate(total=Sum('total_amount'))['total'] or 0
            
            prev_revenue = prev_bookings.filter(status='completed').aggregate(total=Sum('total_amount'))['total'] or 0
            revenue_trend = 0
            if prev_revenue > 0:
                revenue_trend = round(((float(total_revenue) - float(prev_revenue)) / float(prev_revenue)) * 100, 1)
            
            current_booking_count = current_bookings.count()
            prev_booking_count = prev_bookings.count()
            bookings_trend = 0
            if prev_booking_count > 0:
                bookings_trend = round(((current_booking_count - prev_booking_count) / prev_booking_count) * 100, 1)
            
            # Average daily rate
            avg_daily_rate = Listing.objects.filter(
                partner=partner, is_available=True
            ).aggregate(avg=Avg('price_per_day'))['avg'] or 0
            
            # Daily data for charts
            daily_data_qs = (
                all_bookings
                .filter(pickup_date__gte=range_start)
                .annotate(day=TruncDate('pickup_date'))
                .values('day')
                .annotate(
                    revenue=Coalesce(Sum('total_amount', filter=Q(status='completed')), 0),
                    bookings=Count('id'),
                    new_bookings=Count('id', filter=Q(status='pending')),
                )
                .order_by('day')
            )
            
            daily_chart = []
            for i in range(days):
                day = (range_start + timedelta(days=i)).date()
                entry = next((d for d in daily_data_qs if d['day'] == day), None)
                daily_chart.append({
                    'date': day.isoformat(),
                    'revenue': float(entry['revenue']) if entry else 0,
                    'bookings': entry['bookings'] if entry else 0,
                })
            
            # Status distribution
            status_distribution = [
                {'status': s, 'count': booking_stats.get(s, 0)}
                for s in ['pending', 'accepted', 'completed', 'cancelled', 'rejected']
                if booking_stats.get(s, 0) > 0
            ]
            total_for_pct = sum(d['count'] for d in status_distribution) or 1
            for d in status_distribution:
                d['percentage'] = round((d['count'] / total_for_pct) * 100, 1)
            
            # Per-vehicle performance
            vehicle_perf = (
                all_bookings.filter(status='completed')
                .values('listing__id', 'listing__make', 'listing__model', 'listing__year', 'listing__price_per_day')
                .annotate(
                    revenue=Coalesce(Sum('total_amount'), 0),
                    booking_count=Count('id'),
                )
                .order_by('-revenue')[:10]
            )
            vehicle_performance = [
                {
                    'id': v['listing__id'],
                    'name': f"{v['listing__make']} {v['listing__model']} {v['listing__year']}",
                    'revenue': float(v['revenue']),
                    'bookings': v['booking_count'],
                    'daily_rate': float(v['listing__price_per_day'] or 0),
                    'utilization': round((v['booking_count'] / max(days, 1)) * 100, 1),
                }
                for v in vehicle_perf
            ]
            
            # Review stats
            review_stats = Review.objects.filter(
                listing__partner=partner, is_published=True
            ).aggregate(
                avg=Avg('rating'),
                count=Count('id'),
                five_star=Count('id', filter=Q(rating=5)),
                four_star=Count('id', filter=Q(rating__gte=4, rating__lt=5)),
                three_star=Count('id', filter=Q(rating__gte=3, rating__lt=4)),
                two_star=Count('id', filter=Q(rating__gte=2, rating__lt=3)),
                one_star=Count('id', filter=Q(rating__gte=1, rating__lt=2)),
            )
            
            # Booking conversion rate
            total_all = booking_stats['total'] or 1
            conversion_rate = round((booking_stats['completed'] / total_all) * 100, 1)
            acceptance_rate = round(((booking_stats['accepted'] + booking_stats['completed']) / total_all) * 100, 1)
            
            return Response({
                'listings': {
                    'total': total_listings,
                    'available': available_listings,
                    'unavailable': total_listings - available_listings
                },
                'bookings': booking_stats,
                'reviews': {
                    'average_rating': round(review_stats['avg'] or 0, 2),
                    'count': review_stats['count'],
                    'distribution': {
                        '5': review_stats['five_star'],
                        '4': review_stats['four_star'],
                        '3': review_stats['three_star'],
                        '2': review_stats['two_star'],
                        '1': review_stats['one_star'],
                    }
                },
                'earnings': {
                    'total': float(total_revenue),
                    'monthly': float(total_revenue) if days == 30 else None,
                },
                'trends': {
                    'revenue': revenue_trend,
                    'bookings': bookings_trend,
                },
                'metrics': {
                    'total_revenue': float(total_revenue),
                    'total_bookings': current_booking_count,
                    'active_vehicles': available_listings,
                    'avg_daily_rate': round(float(avg_daily_rate), 2),
                    'conversion_rate': conversion_rate,
                    'acceptance_rate': acceptance_rate,
                },
                'daily_data': daily_chart,
                'status_distribution': status_distribution,
                'vehicle_performance': vehicle_performance,
                'range': range_param,
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
            
            # Pagination for better performance
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
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0
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
