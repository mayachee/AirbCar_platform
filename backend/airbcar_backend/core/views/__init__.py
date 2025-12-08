"""
Views package - split from monolithic views.py for better organization.
All views are exported here for backward compatibility with urls.py
"""
import sys
import traceback

# Import views with error handling to prevent import-time failures
try:
    from .listing_views import ListingListView, ListingDetailView
except Exception as e:
    print(f"Error importing listing_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    ListingListView = None
    ListingDetailView = None

try:
    from .booking_views import (
        BookingListView, BookingPendingRequestsView, BookingUpcomingView,
        BookingCancelView, BookingAcceptView, BookingRejectView,
        BookingDetailView, PartnerCustomerInfoView
    )
except Exception as e:
    print(f"Error importing booking_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    BookingListView = BookingPendingRequestsView = BookingUpcomingView = None
    BookingCancelView = BookingAcceptView = BookingRejectView = None
    BookingDetailView = PartnerCustomerInfoView = None

try:
    from .user_views import (
        UserListView, UserMeView, UserStatsView, ChangePasswordView, UserDetailView
    )
except Exception as e:
    print(f"Error importing user_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    UserListView = UserMeView = UserStatsView = ChangePasswordView = UserDetailView = None

try:
    from .favorite_views import FavoriteListView, MyFavoritesView, FavoriteDetailView
except Exception as e:
    print(f"Error importing favorite_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    FavoriteListView = MyFavoritesView = FavoriteDetailView = None

try:
    from .partner_views import (
        PartnerListView, PartnerMeView, PartnerDetailView,
        PartnerEarningsView, PartnerAnalyticsView, PartnerReviewsView, PartnerActivityView
    )
except Exception as e:
    print(f"Error importing partner_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    PartnerListView = PartnerMeView = PartnerDetailView = None
    PartnerEarningsView = PartnerAnalyticsView = PartnerReviewsView = PartnerActivityView = None

try:
    from .review_views import ReviewListView, CanReviewView
except Exception as e:
    print(f"Error importing review_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    ReviewListView = CanReviewView = None

try:
    from .auth_views import (
        LoginView, RegisterView, RefreshTokenView, VerifyTokenView,
        VerifyEmailView, ResendVerificationEmailView,
        PasswordResetRequestView, PasswordResetConfirmView, GoogleAuthView
    )
except Exception as e:
    print(f"CRITICAL: Error importing auth_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    # Create fallback views for critical auth endpoints
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework.permissions import AllowAny
    from rest_framework import status
    
    class LoginView(APIView):
        permission_classes = [AllowAny]
        def post(self, request):
            return Response({
                'error': 'Authentication service unavailable',
                'message': 'Auth views failed to import. Check server logs.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    class RegisterView(APIView):
        permission_classes = [AllowAny]
        def post(self, request):
            return Response({
                'error': 'Registration service unavailable',
                'message': 'Auth views failed to import. Check server logs.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    RefreshTokenView = VerifyTokenView = None
    VerifyEmailView = ResendVerificationEmailView = None
    PasswordResetRequestView = PasswordResetConfirmView = GoogleAuthView = None

# Health views are critical - must import successfully
try:
    from .health_views import RootView, HealthCheckView, serve_media
except Exception as e:
    print(f"CRITICAL: Error importing health_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    # Create fallback views if health views fail to import
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework.permissions import AllowAny
    
    class RootView(APIView):
        permission_classes = [AllowAny]
        def get(self, request):
            return Response({'status': 'error', 'message': 'Health views failed to import'}, status=500)
    
    class HealthCheckView(APIView):
        permission_classes = [AllowAny]
        def get(self, request):
            return Response({'status': 'error', 'message': 'Health views failed to import'}, status=500)
    
    def serve_media(request, path):
        from django.http import Http404
        raise Http404("Media serving unavailable")

# Import admin views from existing admin_views.py
try:
    from ..admin_views import AdminStatsView, AdminAnalyticsView, AdminRevenueView
except Exception as e:
    print(f"Error importing admin_views: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    AdminStatsView = AdminAnalyticsView = AdminRevenueView = None

__all__ = [
    # Listings
    'ListingListView', 'ListingDetailView',
    # Bookings
    'BookingListView', 'BookingPendingRequestsView', 'BookingUpcomingView',
    'BookingCancelView', 'BookingAcceptView', 'BookingRejectView',
    'BookingDetailView', 'PartnerCustomerInfoView',
    # Users
    'UserListView', 'UserMeView', 'UserStatsView', 'ChangePasswordView', 'UserDetailView',
    # Favorites
    'FavoriteListView', 'MyFavoritesView', 'FavoriteDetailView',
    # Partners
    'PartnerListView', 'PartnerMeView', 'PartnerDetailView',
    'PartnerEarningsView', 'PartnerAnalyticsView', 'PartnerReviewsView', 'PartnerActivityView',
    # Reviews
    'ReviewListView', 'CanReviewView',
    # Auth
    'LoginView', 'RegisterView', 'RefreshTokenView', 'VerifyTokenView',
    'VerifyEmailView', 'ResendVerificationEmailView',
    'PasswordResetRequestView', 'PasswordResetConfirmView', 'GoogleAuthView',
    # Health & Root
    'RootView', 'HealthCheckView', 'serve_media',
    # Admin
    'AdminStatsView', 'AdminAnalyticsView', 'AdminRevenueView',
]

