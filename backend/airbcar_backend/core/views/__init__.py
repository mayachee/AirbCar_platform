"""
Views package - split from monolithic views.py for better organization.
All views are exported here for backward compatibility with urls.py
"""
from .listing_views import ListingListView, ListingDetailView
from .booking_views import (
    BookingListView, BookingPendingRequestsView, BookingUpcomingView,
    BookingCancelView, BookingAcceptView, BookingRejectView,
    BookingDetailView, PartnerCustomerInfoView
)
from .user_views import (
    UserListView, UserMeView, UserStatsView, ChangePasswordView, UserDetailView
)
from .favorite_views import FavoriteListView, MyFavoritesView, FavoriteDetailView
from .partner_views import (
    PartnerListView, PartnerMeView, PartnerDetailView,
    PartnerEarningsView, PartnerAnalyticsView, PartnerReviewsView, PartnerActivityView
)
from .review_views import ReviewListView, CanReviewView
from .auth_views import (
    LoginView, RegisterView, RefreshTokenView, VerifyTokenView,
    VerifyEmailView, ResendVerificationEmailView,
    PasswordResetRequestView, PasswordResetConfirmView, GoogleAuthView
)
from .health_views import RootView, HealthCheckView, serve_media

# Import admin views from existing admin_views.py
from ..admin_views import AdminStatsView, AdminAnalyticsView, AdminRevenueView

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

