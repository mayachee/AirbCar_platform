from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from core.views import (
    home_view, UserViewSet, PartnerViewSet, ListingViewSet,
    BookingViewSet, FavoriteViewSet, ReviewViewSet, PasswordResetRequestView, PasswordResetConfirmView, 
    verify_email, CustomTokenObtainPairView, UserStatusView, AdminStatusView,
    UserVerificationView, public_partner_profile_view, NewsletterSubscriptionView, GoogleOAuthView)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'partners', PartnerViewSet, basename='partner')
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Public partner profile endpoint - using re_path for more control
    re_path(r'^api/partners/public/(?P<slug>[\w-]+)/$', public_partner_profile_view, name='partner_public_profile'),
    
    path('api/register/', UserViewSet.as_view({'post': 'create'}), name='user_register'),
    path('api/login/', CustomTokenObtainPairView.as_view(), name='login'),
   
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/verify-token/', UserStatusView.as_view(), name='user_status'),
    path('api/verify-admin/', AdminStatusView.as_view(), name='admin_status'),
  
    path('api/verify-email/', UserVerificationView.as_view(), name='user_verify_email'),
    path("verify-email/", verify_email, name="verify_email"),
   
    path('api/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/reset-password/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('api/newsletter/subscribe/', NewsletterSubscriptionView.as_view(), name='newsletter_subscribe'),
    path('api/auth/google/', GoogleOAuthView.as_view(), name='google_oauth'),
    
    # Include router URLs (after custom routes - router will handle /partners/ but not /partners/public/)
    path('', include(router.urls)),
    
    # Home view as fallback (must be last)
    path('', home_view, name='home'),
]
