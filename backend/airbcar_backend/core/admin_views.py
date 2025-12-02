"""
Admin-specific views for dashboard statistics and analytics.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.db import OperationalError
from datetime import timedelta
from django.conf import settings

from .models import User, Partner, Booking, Listing


class AdminStatsView(APIView):
    """Get platform statistics for admin dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admins or superusers can access
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get counts
            total_users = User.objects.count()
            total_partners = Partner.objects.count()
            total_listings = Listing.objects.count()
            total_bookings = Booking.objects.count()
            
            # Calculate total earnings from completed bookings
            completed_bookings = Booking.objects.filter(status='completed', payment_status='paid')
            total_earnings = completed_bookings.aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            
            # Get recent activity counts (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
            recent_bookings = Booking.objects.filter(created_at__gte=thirty_days_ago).count()
            
            return Response({
                'totalUsers': total_users,
                'totalPartners': total_partners,
                'totalListings': total_listings,
                'totalBookings': total_bookings,
                'totalEarnings': float(total_earnings),
                'recentUsers': recent_users,
                'recentBookings': recent_bookings,
            })
        except OperationalError as e:
            return Response({
                'error': 'Database connection error. Please try again later.',
                'message': 'Unable to connect to the database.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while fetching statistics.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAnalyticsView(APIView):
    """Get platform analytics for admin dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admins or superusers can access
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get bookings by status
            bookings_by_status = {}
            for status_choice in Booking.STATUS_CHOICES:
                count = Booking.objects.filter(status=status_choice[0]).count()
                bookings_by_status[status_choice[0]] = count
            
            # Get bookings by month (last 12 months)
            monthly_bookings = []
            for i in range(11, -1, -1):
                month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                count = Booking.objects.filter(created_at__gte=month_start, created_at__lte=month_end).count()
                monthly_bookings.append({
                    'month': month_start.strftime('%Y-%m'),
                    'count': count
                })
            
            # Get user growth (last 12 months)
            monthly_users = []
            for i in range(11, -1, -1):
                month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                count = User.objects.filter(date_joined__gte=month_start, date_joined__lte=month_end).count()
                monthly_users.append({
                    'month': month_start.strftime('%Y-%m'),
                    'count': count
                })
            
            return Response({
                'bookingsByStatus': bookings_by_status,
                'monthlyBookings': monthly_bookings,
                'monthlyUsers': monthly_users,
            })
        except OperationalError as e:
            return Response({
                'error': 'Database connection error. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while fetching analytics.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRevenueView(APIView):
    """Get revenue analytics for admin dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admins or superusers can access
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get revenue by month (last 12 months)
            monthly_revenue = []
            for i in range(11, -1, -1):
                month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                revenue = Booking.objects.filter(
                    status='completed',
                    payment_status='paid',
                    created_at__gte=month_start,
                    created_at__lte=month_end
                ).aggregate(
                    total=Coalesce(Sum('total_amount'), 0)
                )['total'] or 0
                monthly_revenue.append({
                    'month': month_start.strftime('%Y-%m'),
                    'revenue': float(revenue)
                })
            
            # Get total revenue
            total_revenue = Booking.objects.filter(
                status='completed',
                payment_status='paid'
            ).aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            
            return Response({
                'monthlyRevenue': monthly_revenue,
                'totalRevenue': float(total_revenue),
            })
        except OperationalError as e:
            return Response({
                'error': 'Database connection error. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while fetching revenue analytics.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

