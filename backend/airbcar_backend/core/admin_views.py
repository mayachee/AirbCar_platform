"""
Admin-specific views for dashboard statistics and analytics.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import Coalesce, TruncDate, TruncMonth
from django.utils import timezone
from django.db import OperationalError
from datetime import timedelta
from django.conf import settings

from .models import User, Partner, Booking, Listing, Review


class AdminStatsView(APIView):
    """Get platform statistics for admin dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            sixty_days_ago = now - timedelta(days=60)
            seven_days_ago = now - timedelta(days=7)
            
            # Core counts
            total_users = User.objects.count()
            total_partners = Partner.objects.count()
            total_listings = Listing.objects.count()
            total_bookings = Booking.objects.count()
            
            # Recent counts (last 30 days)
            recent_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
            prev_users = User.objects.filter(date_joined__gte=sixty_days_ago, date_joined__lt=thirty_days_ago).count()
            recent_bookings = Booking.objects.filter(created_at__gte=thirty_days_ago).count()
            prev_bookings = Booking.objects.filter(created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).count()
            recent_partners = Partner.objects.filter(created_at__gte=thirty_days_ago).count()
            prev_partners = Partner.objects.filter(created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).count()
            recent_listings = Listing.objects.filter(created_at__gte=thirty_days_ago).count()
            
            # Revenue — use both total_amount and price fields for compatibility
            # Core booking model uses total_amount, bookings app uses price
            total_revenue = Booking.objects.filter(
                status='completed'
            ).aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            # If total_amount returns 0, try price field
            if total_revenue == 0:
                try:
                    total_revenue = Booking.objects.filter(
                        status='completed'
                    ).aggregate(
                        total=Coalesce(Sum('price'), 0)
                    )['total'] or 0
                except Exception:
                    pass
            
            monthly_revenue = Booking.objects.filter(
                status='completed', created_at__gte=thirty_days_ago
            ).aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            if monthly_revenue == 0:
                try:
                    monthly_revenue = Booking.objects.filter(
                        status='completed', created_at__gte=thirty_days_ago
                    ).aggregate(
                        total=Coalesce(Sum('price'), 0)
                    )['total'] or 0
                except Exception:
                    pass
            
            prev_revenue = Booking.objects.filter(
                status='completed',
                created_at__gte=sixty_days_ago,
                created_at__lt=thirty_days_ago
            ).aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            if prev_revenue == 0:
                try:
                    prev_revenue = Booking.objects.filter(
                        status='completed',
                        created_at__gte=sixty_days_ago,
                        created_at__lt=thirty_days_ago
                    ).aggregate(
                        total=Coalesce(Sum('price'), 0)
                    )['total'] or 0
                except Exception:
                    pass
            
            # Weekly revenue
            weekly_revenue = Booking.objects.filter(
                status='completed', created_at__gte=seven_days_ago
            ).aggregate(
                total=Coalesce(Sum('total_amount'), 0)
            )['total'] or 0
            if weekly_revenue == 0:
                try:
                    weekly_revenue = Booking.objects.filter(
                        status='completed', created_at__gte=seven_days_ago
                    ).aggregate(
                        total=Coalesce(Sum('price'), 0)
                    )['total'] or 0
                except Exception:
                    pass
            
            # Growth rates
            def calc_growth(current, previous):
                if previous > 0:
                    return round(((float(current) - float(previous)) / float(previous)) * 100, 1)
                return 0 if current == 0 else 100.0
            
            revenue_growth = calc_growth(monthly_revenue, prev_revenue)
            users_growth = calc_growth(recent_users, prev_users)
            bookings_growth = calc_growth(recent_bookings, prev_bookings)
            partners_growth = calc_growth(recent_partners, prev_partners)
            
            # Booking status breakdown
            status_counts = Booking.objects.values('status').annotate(count=Count('id'))
            status_breakdown = {s['status']: s['count'] for s in status_counts}
            
            # Pending bookings
            pending_bookings = status_breakdown.get('pending', 0)
            active_bookings = status_breakdown.get('accepted', 0) + status_breakdown.get('confirmed', 0) + status_breakdown.get('active', 0)
            completed_bookings_count = status_breakdown.get('completed', 0)
            
            # Average booking value
            avg_booking = Booking.objects.filter(
                status='completed'
            ).aggregate(avg=Avg('total_amount'))['avg'] or 0
            if avg_booking == 0:
                try:
                    avg_booking = Booking.objects.filter(
                        status='completed'
                    ).aggregate(avg=Avg('price'))['avg'] or 0
                except Exception:
                    pass
            
            # Partner stats
            verified_partners = Partner.objects.filter(is_verified=True).count()
            pending_partner_approvals = Partner.objects.filter(
                Q(is_verified=False) | Q(verification_status='pending')
            ).count()
            
            # Available listings
            available_listings = Listing.objects.filter(is_available=True).count()
            
            # Reviews
            review_stats = Review.objects.filter(is_published=True).aggregate(
                count=Count('id'),
                avg_rating=Avg('rating')
            )
            
            # Daily bookings (last 30 days)
            daily_bookings = list(
                Booking.objects.filter(created_at__gte=thirty_days_ago)
                .annotate(day=TruncDate('created_at'))
                .values('day')
                .annotate(count=Count('id'))
                .order_by('day')
            )
            daily_data = []
            for i in range(30):
                day = (thirty_days_ago + timedelta(days=i)).date()
                entry = next((d for d in daily_bookings if d['day'] == day), None)
                daily_data.append({
                    'date': day.isoformat(),
                    'bookings': entry['count'] if entry else 0
                })
            
            return Response({
                'totalUsers': total_users,
                'totalPartners': total_partners,
                'totalListings': total_listings,
                'totalBookings': total_bookings,
                'totalEarnings': float(total_revenue),
                'monthlyRevenue': float(monthly_revenue),
                'weeklyRevenue': float(weekly_revenue),
                'avgBookingValue': round(float(avg_booking), 2),
                'recentUsers': recent_users,
                'recentBookings': recent_bookings,
                'recentPartners': recent_partners,
                'recentListings': recent_listings,
                'revenueGrowth': revenue_growth,
                'usersGrowth': users_growth,
                'bookingsGrowth': bookings_growth,
                'partnersGrowth': partners_growth,
                'pendingBookings': pending_bookings,
                'activeBookings': active_bookings,
                'completedBookings': completed_bookings_count,
                'statusBreakdown': status_breakdown,
                'verifiedPartners': verified_partners,
                'pendingPartnerApprovals': pending_partner_approvals,
                'availableListings': available_listings,
                'reviews': {
                    'count': review_stats['count'],
                    'avgRating': round(review_stats['avg_rating'] or 0, 2),
                },
                'dailyBookings': daily_data,
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
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            now = timezone.now()
            
            # Get bookings by status — handle both status sets
            all_statuses = ['pending', 'confirmed', 'accepted', 'active', 'completed', 'cancelled', 'rejected']
            status_counts = Booking.objects.values('status').annotate(count=Count('id'))
            bookings_by_status = {s: 0 for s in all_statuses}
            for sc in status_counts:
                bookings_by_status[sc['status']] = sc['count']
            
            # Monthly bookings (last 12 months) — efficient TruncMonth
            twelve_months_ago = now - timedelta(days=365)
            monthly_bookings_qs = (
                Booking.objects.filter(created_at__gte=twelve_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(count=Count('id'))
                .order_by('month')
            )
            monthly_bookings_dict = {m['month'].strftime('%Y-%m'): m['count'] for m in monthly_bookings_qs}
            
            monthly_bookings = []
            for i in range(11, -1, -1):
                d = (now - timedelta(days=30 * i))
                key = d.strftime('%Y-%m')
                monthly_bookings.append({'month': key, 'count': monthly_bookings_dict.get(key, 0)})
            
            # Monthly users (last 12 months)
            monthly_users_qs = (
                User.objects.filter(date_joined__gte=twelve_months_ago)
                .annotate(month=TruncMonth('date_joined'))
                .values('month')
                .annotate(count=Count('id'))
                .order_by('month')
            )
            monthly_users_dict = {m['month'].strftime('%Y-%m'): m['count'] for m in monthly_users_qs}
            
            monthly_users = []
            for i in range(11, -1, -1):
                d = (now - timedelta(days=30 * i))
                key = d.strftime('%Y-%m')
                monthly_users.append({'month': key, 'count': monthly_users_dict.get(key, 0)})
            
            # Monthly revenue (last 12 months)
            def _get_monthly_revenue():
                """Try total_amount first, then price."""
                qs = (
                    Booking.objects.filter(status='completed', created_at__gte=twelve_months_ago)
                    .annotate(month=TruncMonth('created_at'))
                    .values('month')
                    .annotate(revenue=Coalesce(Sum('total_amount'), 0))
                    .order_by('month')
                )
                rev_dict = {m['month'].strftime('%Y-%m'): float(m['revenue']) for m in qs}
                has_data = any(v > 0 for v in rev_dict.values())
                if not has_data:
                    try:
                        qs2 = (
                            Booking.objects.filter(status='completed', created_at__gte=twelve_months_ago)
                            .annotate(month=TruncMonth('created_at'))
                            .values('month')
                            .annotate(revenue=Coalesce(Sum('price'), 0))
                            .order_by('month')
                        )
                        rev_dict = {m['month'].strftime('%Y-%m'): float(m['revenue']) for m in qs2}
                    except Exception:
                        pass
                return rev_dict
            
            rev_dict = _get_monthly_revenue()
            monthly_revenue = []
            for i in range(11, -1, -1):
                d = (now - timedelta(days=30 * i))
                key = d.strftime('%Y-%m')
                monthly_revenue.append({'month': key, 'revenue': rev_dict.get(key, 0)})
            
            # Monthly partners
            monthly_partners_qs = (
                Partner.objects.filter(created_at__gte=twelve_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(count=Count('id'))
                .order_by('month')
            )
            monthly_partners_dict = {m['month'].strftime('%Y-%m'): m['count'] for m in monthly_partners_qs}
            monthly_partners = []
            for i in range(11, -1, -1):
                d = (now - timedelta(days=30 * i))
                key = d.strftime('%Y-%m')
                monthly_partners.append({'month': key, 'count': monthly_partners_dict.get(key, 0)})
            
            # Conversion rate (completed / total, excluding cancelled)
            total_active_bookings = Booking.objects.exclude(status='cancelled').count()
            completed_count = Booking.objects.filter(status='completed').count()
            conversion_rate = round((completed_count / total_active_bookings * 100) if total_active_bookings > 0 else 0, 1)
            
            # Top listings
            top_listings = list(
                Booking.objects.values('listing__id', 'listing__title', 'listing__brand', 'listing__model')
                .annotate(booking_count=Count('id'))
                .order_by('-booking_count')[:5]
            )
            
            return Response({
                'bookingsByStatus': bookings_by_status,
                'monthlyBookings': monthly_bookings,
                'monthlyUsers': monthly_users,
                'monthlyRevenue': monthly_revenue,
                'monthlyPartners': monthly_partners,
                'conversionRate': conversion_rate,
                'topListings': top_listings,
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
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            now = timezone.now()
            twelve_months_ago = now - timedelta(days=365)
            thirty_days_ago = now - timedelta(days=30)
            sixty_days_ago = now - timedelta(days=60)
            
            def _sum_revenue(qs):
                """Try total_amount first, fall back to price."""
                total = qs.aggregate(total=Coalesce(Sum('total_amount'), 0))['total'] or 0
                if total == 0:
                    try:
                        total = qs.aggregate(total=Coalesce(Sum('price'), 0))['total'] or 0
                    except Exception:
                        pass
                return float(total)
            
            # Monthly revenue (last 12 months)
            def _get_monthly_revenue():
                qs = (
                    Booking.objects.filter(status='completed', created_at__gte=twelve_months_ago)
                    .annotate(month=TruncMonth('created_at'))
                    .values('month')
                    .annotate(revenue=Coalesce(Sum('total_amount'), 0))
                    .order_by('month')
                )
                rev = {m['month'].strftime('%Y-%m'): float(m['revenue']) for m in qs}
                if not any(v > 0 for v in rev.values()):
                    try:
                        qs2 = (
                            Booking.objects.filter(status='completed', created_at__gte=twelve_months_ago)
                            .annotate(month=TruncMonth('created_at'))
                            .values('month')
                            .annotate(revenue=Coalesce(Sum('price'), 0))
                            .order_by('month')
                        )
                        rev = {m['month'].strftime('%Y-%m'): float(m['revenue']) for m in qs2}
                    except Exception:
                        pass
                return rev
            
            rev_dict = _get_monthly_revenue()
            monthly_revenue = []
            for i in range(11, -1, -1):
                d = (now - timedelta(days=30 * i))
                key = d.strftime('%Y-%m')
                monthly_revenue.append({'month': key, 'revenue': rev_dict.get(key, 0)})
            
            total_revenue = _sum_revenue(Booking.objects.filter(status='completed'))
            current_month_rev = _sum_revenue(Booking.objects.filter(status='completed', created_at__gte=thirty_days_ago))
            prev_month_rev = _sum_revenue(Booking.objects.filter(status='completed', created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago))
            
            # Growth rate
            if prev_month_rev > 0:
                growth = round(((current_month_rev - prev_month_rev) / prev_month_rev) * 100, 1)
            else:
                growth = 0 if current_month_rev == 0 else 100.0
            
            # Average booking value
            avg_val = Booking.objects.filter(status='completed').aggregate(avg=Avg('total_amount'))['avg'] or 0
            if avg_val == 0:
                try:
                    avg_val = Booking.objects.filter(status='completed').aggregate(avg=Avg('price'))['avg'] or 0
                except Exception:
                    pass
            
            # Revenue by top partners
            top_partner_revenue = list(
                Booking.objects.filter(status='completed')
                .values('listing__partner__id', 'listing__partner__company_name')
                .annotate(total=Coalesce(Sum('total_amount'), 0))
                .order_by('-total')[:5]
            )
            # If all zeros, try price field
            if all(p['total'] == 0 for p in top_partner_revenue) and top_partner_revenue:
                try:
                    top_partner_revenue = list(
                        Booking.objects.filter(status='completed')
                        .values('listing__partner__id', 'listing__partner__company_name')
                        .annotate(total=Coalesce(Sum('price'), 0))
                        .order_by('-total')[:5]
                    )
                except Exception:
                    pass
            
            return Response({
                'monthlyRevenue': monthly_revenue,
                'totalRevenue': total_revenue,
                'currentMonthRevenue': current_month_rev,
                'previousMonthRevenue': prev_month_rev,
                'revenueGrowth': growth,
                'avgBookingValue': round(float(avg_val), 2),
                'topPartnerRevenue': [{
                    'partnerId': p.get('listing__partner__id'),
                    'name': p.get('listing__partner__company_name', 'Unknown'),
                    'revenue': float(p.get('total', 0)),
                } for p in top_partner_revenue],
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


class AdminPartnerVerifyView(APIView):
    """Toggle a partner's verified-agency status. Admin/staff only."""
    permission_classes = [IsAuthenticated]

    def post(self, request, partner_id):
        user = request.user
        if user.role != 'admin' and not user.is_superuser and not user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            partner = Partner.objects.get(pk=partner_id)
        except Partner.DoesNotExist:
            return Response({'error': 'Partner not found'}, status=status.HTTP_404_NOT_FOUND)

        # Accept either an explicit value or treat the call as a toggle.
        raw = request.data.get('is_verified', None)
        if raw is None:
            new_value = not partner.is_verified
        elif isinstance(raw, str):
            new_value = raw.lower() in ('true', '1', 'yes')
        else:
            new_value = bool(raw)

        partner.is_verified = new_value
        partner.verified_at = timezone.now() if new_value else None
        partner.save(update_fields=['is_verified', 'verified_at', 'updated_at'])

        return Response({
            'data': {
                'id': partner.id,
                'is_verified': partner.is_verified,
                'verified_at': partner.verified_at.isoformat() if partner.verified_at else None,
            },
            'message': 'Partner verification updated.',
        }, status=status.HTTP_200_OK)

