"""
URL configuration for core app API endpoints.
"""
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Listings endpoints
    path('listings/', views.ListingListView.as_view(), name='listing-list'),
    path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'),
    
    # Favorites endpoints
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/<int:pk>/', views.FavoriteDetailView.as_view(), name='favorite-detail'),
    
    # Users endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Bookings endpoints
    path('bookings/', views.BookingListView.as_view(), name='booking-list'),
    path('bookings/pending-requests/', views.BookingPendingRequestsView.as_view(), name='booking-pending-requests'),
    path('bookings/upcoming/', views.BookingUpcomingView.as_view(), name='booking-upcoming'),
    path('bookings/<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    
    # Partners endpoints
    path('partners/', views.PartnerListView.as_view(), name='partner-list'),
    path('partners/me/', views.PartnerMeView.as_view(), name='partner-me'),
    path('partners/<int:pk>/', views.PartnerDetailView.as_view(), name='partner-detail'),
    
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
]

