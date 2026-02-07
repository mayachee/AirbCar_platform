"""
URL configuration for core app API endpoints.
"""
from django.urls import path
import sys
import traceback

# Import views with error handling
try:
    from . import views
except Exception as e:
    # If views fail to import, create minimal fallback
    print(f"CRITICAL: Failed to import views module: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    
    # Create emergency fallback views
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework.permissions import AllowAny
    
    class EmergencyRootView(APIView):
        permission_classes = [AllowAny]
        def get(self, request):
            return Response({
                'status': 'error',
                'message': 'Views module failed to import. Check server logs.',
                'error': str(e) if hasattr(e, '__str__') else 'Unknown error'
            }, status=500)
    
    # Create a minimal views object
    class ViewsModule:
        RootView = EmergencyRootView
        HealthCheckView = EmergencyRootView
        LoginView = EmergencyRootView
        RegisterView = EmergencyRootView
        serve_media = None
    
    views = ViewsModule()

app_name = 'core'

# Helper function to safely add URL patterns only if view exists
def safe_path(pattern, view, name=None):
    """Only add URL pattern if view is not None."""
    if view is not None:
        return path(pattern, view.as_view(), name=name)
    return None

# Build URL patterns conditionally - only include views that exist
urlpatterns = []

# Root endpoint - CRITICAL, must exist
if views.RootView is not None:
    urlpatterns.append(path('', views.RootView.as_view(), name='root'))
else:
    # Emergency fallback if RootView failed
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework.permissions import AllowAny
    class EmergencyRootView(APIView):
        permission_classes = [AllowAny]
        def get(self, request):
            return Response({
                'status': 'error',
                'message': 'RootView failed to import. Check server logs.',
                'version': '1.0.0'
            }, status=500)
    urlpatterns.append(path('', EmergencyRootView.as_view(), name='root'))

# Health check endpoint - CRITICAL
if views.HealthCheckView is not None:
    urlpatterns.append(path('api/health/', views.HealthCheckView.as_view(), name='health'))

# Auth endpoints - CRITICAL
if views.LoginView is not None:
    urlpatterns.append(path('api/login/', views.LoginView.as_view(), name='login'))
if views.RegisterView is not None:
    urlpatterns.append(path('api/register/', views.RegisterView.as_view(), name='register'))
if views.RefreshTokenView is not None:
    urlpatterns.append(path('api/token/refresh/', views.RefreshTokenView.as_view(), name='token-refresh'))
if views.VerifyTokenView is not None:
    urlpatterns.append(path('api/verify-token/', views.VerifyTokenView.as_view(), name='verify-token'))
if views.VerifyEmailView is not None:
    urlpatterns.append(path('api/verify-email/', views.VerifyEmailView.as_view(), name='verify-email'))
if views.ResendVerificationEmailView is not None:
    urlpatterns.append(path('api/resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend-verification'))
if views.PasswordResetRequestView is not None:
    urlpatterns.append(path('api/password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'))
if views.PasswordResetConfirmView is not None:
    urlpatterns.append(path('api/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'))
if views.GoogleAuthView is not None:
    urlpatterns.append(path('api/auth/google/', views.GoogleAuthView.as_view(), name='google-auth'))

# Media file serving
if views.serve_media is not None:
    urlpatterns.append(path('media/<path:path>', views.serve_media, name='serve-media'))

# Listings endpoints
if views.ListingListView is not None:
    urlpatterns.append(path('listings/', views.ListingListView.as_view(), name='listing-list'))
if views.ListingDetailView is not None:
    urlpatterns.append(path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'))

# Favorites endpoints
if views.FavoriteListView is not None:
    urlpatterns.append(path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'))
if views.MyFavoritesView is not None:
    urlpatterns.append(path('favorites/my-favorites/', views.MyFavoritesView.as_view(), name='my-favorites'))
if views.FavoriteDetailView is not None:
    urlpatterns.append(path('favorites/<int:pk>/', views.FavoriteDetailView.as_view(), name='favorite-detail'))

# Users endpoints
if views.UserListView is not None:
    urlpatterns.append(path('users/', views.UserListView.as_view(), name='user-list'))
if views.UserMeView is not None:
    urlpatterns.append(path('users/me/', views.UserMeView.as_view(), name='user-me'))
if views.UserStatsView is not None:
    urlpatterns.append(path('users/me/stats/', views.UserStatsView.as_view(), name='user-stats'))
if views.ChangePasswordView is not None:
    urlpatterns.append(path('users/me/change-password/', views.ChangePasswordView.as_view(), name='change-password'))
if views.UserDocumentUploadView is not None:
    urlpatterns.append(path('users/me/upload-document/', views.UserDocumentUploadView.as_view(), name='user-document-upload'))
if views.UserDetailView is not None:
    urlpatterns.append(path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'))

# Bookings endpoints
if views.BookingListView is not None:
    urlpatterns.append(path('bookings/', views.BookingListView.as_view(), name='booking-list'))
if views.BookingPendingRequestsView is not None:
    urlpatterns.append(path('bookings/pending-requests/', views.BookingPendingRequestsView.as_view(), name='booking-pending-requests'))
if views.BookingUpcomingView is not None:
    urlpatterns.append(path('bookings/upcoming/', views.BookingUpcomingView.as_view(), name='booking-upcoming'))
if views.BookingAcceptView is not None:
    urlpatterns.append(path('bookings/<int:pk>/accept/', views.BookingAcceptView.as_view(), name='booking-accept'))
if views.BookingRejectView is not None:
    urlpatterns.append(path('bookings/<int:pk>/reject/', views.BookingRejectView.as_view(), name='booking-reject'))
if views.BookingCancelView is not None:
    urlpatterns.append(path('bookings/<int:pk>/cancel/', views.BookingCancelView.as_view(), name='booking-cancel'))
if views.BookingDetailView is not None:
    urlpatterns.append(path('bookings/<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'))
if views.PartnerCustomerInfoView is not None:
    urlpatterns.append(path('bookings/<int:booking_id>/customer-info/', views.PartnerCustomerInfoView.as_view(), name='booking-customer-info'))

# Partners endpoints
if views.PartnerListView is not None:
    urlpatterns.append(path('partners/', views.PartnerListView.as_view(), name='partner-list'))
if views.PartnerMeView is not None:
    urlpatterns.append(path('partners/me/', views.PartnerMeView.as_view(), name='partner-me'))
if views.PartnerEarningsView is not None:
    urlpatterns.append(path('partners/me/earnings/', views.PartnerEarningsView.as_view(), name='partner-earnings'))
if views.PartnerAnalyticsView is not None:
    urlpatterns.append(path('partners/me/analytics/', views.PartnerAnalyticsView.as_view(), name='partner-analytics'))
if views.PartnerReviewsView is not None:
    urlpatterns.append(path('partners/me/reviews/', views.PartnerReviewsView.as_view(), name='partner-reviews'))
if views.PartnerActivityView is not None:
    urlpatterns.append(path('partners/me/activity/', views.PartnerActivityView.as_view(), name='partner-activity'))
if views.PartnerDetailView is not None:
    urlpatterns.append(path('partners/<int:pk>/', views.PartnerDetailView.as_view(), name='partner-detail'))

# Reviews endpoints
if views.ReviewListView is not None:
    urlpatterns.append(path('reviews/', views.ReviewListView.as_view(), name='review-list'))
if views.CanReviewView is not None:
    urlpatterns.append(path('reviews/can_review/', views.CanReviewView.as_view(), name='can-review'))
if views.ReviewAnalyticsView is not None:
    urlpatterns.append(path('reviews/analytics/', views.ReviewAnalyticsView.as_view(), name='review-analytics'))
if views.ReviewDetailView is not None:
    urlpatterns.append(path('reviews/<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'))
if views.ReviewVoteView is not None:
    urlpatterns.append(path('reviews/<int:pk>/vote/', views.ReviewVoteView.as_view(), name='review-vote'))
if views.ReviewRespondView is not None:
    urlpatterns.append(path('reviews/<int:pk>/respond/', views.ReviewRespondView.as_view(), name='review-respond'))
if views.ReviewPublishView is not None:
    urlpatterns.append(path('reviews/<int:pk>/publish/', views.ReviewPublishView.as_view(), name='review-publish'))
if views.ReviewReportView is not None:
    urlpatterns.append(path('reviews/<int:pk>/report/', views.ReviewReportView.as_view(), name='review-report'))
if views.ReviewReplyListView is not None:
    urlpatterns.append(path('reviews/<int:pk>/replies/', views.ReviewReplyListView.as_view(), name='review-replies'))
if views.ReviewReplyDetailView is not None:
    urlpatterns.append(path('reviews/<int:pk>/replies/<int:reply_id>/', views.ReviewReplyDetailView.as_view(), name='review-reply-detail'))
if views.ReviewReactionView is not None:
    urlpatterns.append(path('reviews/<int:pk>/react/', views.ReviewReactionView.as_view(), name='review-react'))

# Notification endpoints
if views.NotificationListView is not None:
    urlpatterns.append(path('notifications/', views.NotificationListView.as_view(), name='notification-list'))
if views.MarkNotificationReadView is not None:
    urlpatterns.append(path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='notification-read'))
if views.MarkAllNotificationsReadView is not None:
    urlpatterns.append(path('notifications/read-all/', views.MarkAllNotificationsReadView.as_view(), name='notification-read-all'))

# Admin endpoints
if views.AdminStatsView is not None:
    urlpatterns.append(path('admin/stats/', views.AdminStatsView.as_view(), name='admin-stats'))
if views.AdminAnalyticsView is not None:
    urlpatterns.append(path('admin/analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'))
if views.AdminRevenueView is not None:
    urlpatterns.append(path('admin/revenue/', views.AdminRevenueView.as_view(), name='admin-revenue'))

