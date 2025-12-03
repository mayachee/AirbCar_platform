"""
URL configuration for core app API endpoints.
"""
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Root endpoint
    path('', views.RootView.as_view(), name='root'),
    # Listings endpoints
    path('listings/', views.ListingListView.as_view(), name='listing-list'),
    path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'),
    
    # Favorites endpoints
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/my-favorites/', views.MyFavoritesView.as_view(), name='my-favorites'),
    path('favorites/<int:pk>/', views.FavoriteDetailView.as_view(), name='favorite-detail'),
    
    # Users endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/me/stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('users/me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Bookings endpoints
    path('bookings/', views.BookingListView.as_view(), name='booking-list'),
    path('bookings/pending-requests/', views.BookingPendingRequestsView.as_view(), name='booking-pending-requests'),
    path('bookings/upcoming/', views.BookingUpcomingView.as_view(), name='booking-upcoming'),
    path('bookings/<int:pk>/cancel/', views.BookingCancelView.as_view(), name='booking-cancel'),
    path('bookings/<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:booking_id>/customer-info/', views.PartnerCustomerInfoView.as_view(), name='booking-customer-info'),
    
    # Partners endpoints
    path('partners/', views.PartnerListView.as_view(), name='partner-list'),
    path('partners/me/', views.PartnerMeView.as_view(), name='partner-me'),
    path('partners/me/earnings/', views.PartnerEarningsView.as_view(), name='partner-earnings'),
    path('partners/me/analytics/', views.PartnerAnalyticsView.as_view(), name='partner-analytics'),
    path('partners/me/reviews/', views.PartnerReviewsView.as_view(), name='partner-reviews'),
    path('partners/me/activity/', views.PartnerActivityView.as_view(), name='partner-activity'),
    path('partners/<int:pk>/', views.PartnerDetailView.as_view(), name='partner-detail'),
    
    # Reviews endpoints
    path('reviews/', views.ReviewListView.as_view(), name='review-list'),
    path('reviews/can_review/', views.CanReviewView.as_view(), name='can-review'),
    
    # Health check endpoint
    path('api/health/', views.HealthCheckView.as_view(), name='health'),
    
    # Auth endpoints
    path('api/login/', views.LoginView.as_view(), name='login'),
    path('api/register/', views.RegisterView.as_view(), name='register'),
    path('api/token/refresh/', views.RefreshTokenView.as_view(), name='token-refresh'),
    path('api/verify-token/', views.VerifyTokenView.as_view(), name='verify-token'),
    path('api/verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('api/resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('api/password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('api/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('api/auth/google/', views.GoogleAuthView.as_view(), name='google-auth'),
    
    # Admin endpoints
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('admin/analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/revenue/', views.AdminRevenueView.as_view(), name='admin-revenue'),
]

