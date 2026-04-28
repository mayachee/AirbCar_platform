from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.telegram_views import TelegramWebhookView, TelegramLinkView

app_name = 'core'

urlpatterns = [
    # Root & Health
    path('', views.RootView.as_view(), name='root'),
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

    # Listings endpoints
    path('listings/', views.ListingListView.as_view(), name='listing-list'),
    path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'),
    path('listings/<int:listing_id>/blackouts/', getattr(views, 'ListingBlackoutListView', views.RootView).as_view(), name='listing-blackouts'),
    path('listings/<int:listing_id>/blackouts/<int:blackout_id>/', getattr(views, 'ListingBlackoutDetailView', views.RootView).as_view(), name='listing-blackout-detail'),
    path('listings/<int:listing_id>/comments/', getattr(views, 'ListingCommentListView', views.RootView).as_view(), name='listing-comments'),
    path('listings/<int:listing_id>/comments/<int:comment_id>/', getattr(views, 'ListingCommentDetailView', views.RootView).as_view(), name='listing-comment-detail'),
    path('listings/<int:listing_id>/reactions/', getattr(views, 'ListingReactionView', views.RootView).as_view(), name='listing-reactions'),

    # Partner social endpoints
    path('partners/<int:partner_id>/follow/', getattr(views, 'PartnerFollowView', views.RootView).as_view(), name='partner-follow'),
    path('partners/<int:partner_id>/posts/', getattr(views, 'PartnerPostListView', views.RootView).as_view(), name='partner-posts'),
    path('partners/<int:partner_id>/posts/<int:post_id>/', getattr(views, 'PartnerPostDetailView', views.RootView).as_view(), name='partner-post-detail'),

    # User follows
    path('users/<int:user_id>/follow/', getattr(views, 'UserFollowView', views.RootView).as_view(), name='user-follow'),

    # Trip posts
    path('trips/', getattr(views, 'TripPostListView', views.RootView).as_view(), name='trip-post-list'),
    path('trips/<int:trip_id>/', getattr(views, 'TripPostDetailView', views.RootView).as_view(), name='trip-post-detail'),
    path('trips/<int:trip_id>/reactions/', getattr(views, 'TripPostReactionView', views.RootView).as_view(), name='trip-post-reactions'),
    path('trips/<int:trip_id>/comments/', getattr(views, 'TripPostCommentListView', views.RootView).as_view(), name='trip-post-comments'),
    path('trips/<int:trip_id>/comments/<int:comment_id>/', getattr(views, 'TripPostCommentDetailView', views.RootView).as_view(), name='trip-post-comment-detail'),

    # Social feed
    path('feed/', getattr(views, 'SocialFeedView', views.RootView).as_view(), name='social-feed'),

    # Community image upload (used by comments + trip-post stories)
    path('community/upload-image/', getattr(views, 'CommunityImageUploadView', views.RootView).as_view(), name='community-upload-image'),

    # Favorites endpoints
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/my-favorites/', views.MyFavoritesView.as_view(), name='my-favorites'),
    path('favorites/by-listing/<int:listing_id>/', views.FavoriteDeleteByListingView.as_view(), name='favorite-delete-by-listing'),
    path('favorites/<int:pk>/', views.FavoriteDetailView.as_view(), name='favorite-detail'),

    # Users endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/me/stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('users/me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('users/me/upload-document/', views.UserDocumentUploadView.as_view(), name='user-document-upload'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Bookings endpoints
    path('bookings/whatsapp/', getattr(views, 'WhatsAppBookingView', views.RootView).as_view(), name='booking-whatsapp'),
    path('bookings/', getattr(views, 'BookingListView', views.RootView).as_view(), name='booking-list'),
    path('bookings/pending-requests/', getattr(views, 'BookingPendingRequestsView', views.RootView).as_view(), name='booking-pending-requests'),
    path('bookings/upcoming/', getattr(views, 'BookingUpcomingView', views.RootView).as_view(), name='booking-upcoming'),
    path('bookings/<int:pk>/accept/', getattr(views, 'BookingAcceptView', views.RootView).as_view(), name='booking-accept'),
    path('bookings/<int:pk>/reject/', getattr(views, 'BookingRejectView', views.RootView).as_view(), name='booking-reject'),
    path('bookings/<int:pk>/cancel/', getattr(views, 'BookingCancelView', views.RootView).as_view(), name='booking-cancel'),
    path('bookings/<int:pk>/', getattr(views, 'BookingDetailView', views.RootView).as_view(), name='booking-detail'),
    path('bookings/<int:booking_id>/customer-info/', getattr(views, 'PartnerCustomerInfoView', views.RootView).as_view(), name='booking-customer-info'),

    # Partners endpoints
    path('partners/', getattr(views, 'PartnerListView', views.RootView).as_view(), name='partner-list'),
    path('partners/b2b/listings/', getattr(views, 'B2BListingSearchView', views.RootView).as_view(), name='partner-b2b-listings'),
    path('partners/me/', getattr(views, 'PartnerMeView', views.RootView).as_view(), name='partner-me'),
    path('partners/me/earnings/', getattr(views, 'PartnerEarningsView', views.RootView).as_view(), name='partner-earnings'),
    path('partners/me/analytics/', getattr(views, 'PartnerAnalyticsView', views.RootView).as_view(), name='partner-analytics'),
    path('partners/me/reviews/', getattr(views, 'PartnerReviewsView', views.RootView).as_view(), name='partner-reviews'),
    path('partners/me/activity/', getattr(views, 'PartnerActivityView', views.RootView).as_view(), name='partner-activity'),
    path('partners/<int:pk>/reviews/', getattr(views, 'PartnerPublicReviewsView', views.RootView).as_view(), name='partner-public-reviews'),
    path('partners/<int:pk>/', getattr(views, 'PartnerDetailView', views.RootView).as_view(), name='partner-detail'),

    # Reviews endpoints
    path('reviews/', getattr(views, 'ReviewListView', views.RootView).as_view(), name='review-list'),
    path('reviews/can_review/', getattr(views, 'CanReviewView', views.RootView).as_view(), name='can-review'),
    path('reviews/analytics/', getattr(views, 'ReviewAnalyticsView', views.RootView).as_view(), name='review-analytics'),
    path('reviews/<int:pk>/', getattr(views, 'ReviewDetailView', views.RootView).as_view(), name='review-detail'),
    path('reviews/<int:pk>/vote/', getattr(views, 'ReviewVoteView', views.RootView).as_view(), name='review-vote'),
    path('reviews/<int:pk>/respond/', getattr(views, 'ReviewRespondView', views.RootView).as_view(), name='review-respond'),
    path('reviews/<int:pk>/publish/', getattr(views, 'ReviewPublishView', views.RootView).as_view(), name='review-publish'),
    path('reviews/<int:pk>/report/', getattr(views, 'ReviewReportView', views.RootView).as_view(), name='review-report'),
    path('reviews/<int:pk>/replies/', getattr(views, 'ReviewReplyListView', views.RootView).as_view(), name='review-replies'),
    path('reviews/<int:pk>/replies/<int:reply_id>/', getattr(views, 'ReviewReplyDetailView', views.RootView).as_view(), name='review-reply-detail'),
    path('reviews/<int:pk>/react/', getattr(views, 'ReviewReactionView', views.RootView).as_view(), name='review-react'),

    # Notification endpoints
    path('notifications/', getattr(views, 'NotificationListView', views.RootView).as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', getattr(views, 'MarkNotificationReadView', views.RootView).as_view(), name='notification-read'),
    path('notifications/read-all/', getattr(views, 'MarkAllNotificationsReadView', views.RootView).as_view(), name='notification-read-all'),

    # Newsletter
    path('api/newsletter/subscribe/', getattr(views, 'NewsletterSubscribeView', views.RootView).as_view(), name='newsletter-subscribe'),

    # Admin endpoints
    path('api/admin/stats/', getattr(views, 'AdminStatsView', views.RootView).as_view(), name='admin-stats'),
    path('api/admin/analytics/', getattr(views, 'AdminAnalyticsView', views.RootView).as_view(), name='admin-analytics'),
    path('api/admin/revenue/', getattr(views, 'AdminRevenueView', views.RootView).as_view(), name='admin-revenue'),
    path('api/admin/partners/<int:partner_id>/verify/', getattr(views, 'AdminPartnerVerifyView', views.RootView).as_view(), name='admin-partner-verify'),

    # Telegram bot endpoints
    path('api/telegram/webhook/', TelegramWebhookView.as_view(), name='telegram-webhook'),
    path('api/telegram/link/', TelegramLinkView.as_view(), name='telegram-link'),
]

router = DefaultRouter()
if getattr(views, 'CommunityPostViewSet', None):
    router.register(r'community-posts', views.CommunityPostViewSet, basename='community-post')
router.register(r'partners/car-shares', views.CarShareRequestViewSet, basename='car-share-request')
urlpatterns.extend(router.urls)
