from django.http import HttpResponse
from .models import User, Booking, Partner, Listing, Favorite, Review, ReviewVote, ReviewReport
from django.db.models import Prefetch, Count, Avg, Sum
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
import uuid
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework import status
from rest_framework.response import Response
from .utils import upload_file_to_supabase
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (UserSerializer, BookingSerializer, PartnerSerializer, 
    ListingSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer,
    CustomTokenObtainPairSerializer, FavoriteSerializer, ReviewSerializer, ReviewVoteSerializer, ReviewReportSerializer,
    PublicPartnerSerializer)
from django.shortcuts import get_object_or_404

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        print("get_queryset called")
        user = self.request.user
        if not user.is_authenticated:
            raise ValidationError({"detail": "You are not loged in."})
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        print("perform_create called")
        user = serializer.save()
        profile_pic = self.request.FILES.get("profile_picture")
        front_doc = self.request.FILES.get("id_front_document_url")
        back_doc = self.request.FILES.get("id_back_document_url")

        if profile_pic:
            url = upload_file_to_supabase(profile_pic, folder=f"id_documents/{user.id}")
            user.profile_picture = url
            user.save(update_fields=["profile_picture"])
        if front_doc:
            url = upload_file_to_supabase(front_doc, folder=f"id_documents/{user.id}")
            user.id_front_document_url = url
            user.save(update_fields=["id_front_document_url"])
        if back_doc:
            url = upload_file_to_supabase(back_doc, folder=f"id_documents/{user.id}")
            user.id_back_document_url = url
            user.save(update_fields=["id_back_document_url"])

        user.email_verification_token = str(uuid.uuid4())
        user.save()

        verification_url = f"{self.request.build_absolute_uri('/verify-email/')}?token={user.email_verification_token}"
        send_mail(
            subject='Verify your email',
            message=f'Click the link to verify your email: {verification_url}',
            from_email='no-reply@airbcar.com',
            recipient_list=[user.email],
            fail_silently=False,
        )

    def perform_update(self, serializer):
        print("perform_update called")
        user = serializer.save()
        
        profile_picture = self.request.FILES.get("profile_picture")
        id_front_document = self.request.FILES.get("id_front_document_url")
        id_back_document = self.request.FILES.get("id_back_document_url")
        print("Files received:", profile_picture, id_front_document, id_back_document)

        if profile_picture:
            url = upload_file_to_supabase(profile_picture, folder=f"id_documents/{user.id}")
            user.profile_picture = url
            user.save(update_fields=["profile_picture"])
        if id_front_document:
            url = upload_file_to_supabase(id_front_document, folder=f"id_documents/{user.id}")
            user.id_front_document_url = url
            user.save(update_fields=["id_front_document_url"])
        if id_back_document:
            url = upload_file_to_supabase(id_back_document, folder=f"id_documents/{user.id}")
            user.id_back_document_url = url
            user.save(update_fields=["id_back_document_url"])

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update the current user's profile"""
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                self.perform_update(serializer)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='me/bookings/history')
    def booking_history(self, request):
        """Get booking history for the current user (past/completed bookings)"""
        from django.utils import timezone
        from django.db.models import Q
        
        user = request.user
        now = timezone.now()
        
        # Build query - user can see their own bookings or bookings for their listings if partner
        query = Q(user=user)
        if user.is_partner:
            query |= Q(listing__partner__user=user)
        
        # Get bookings that are in the past or completed/cancelled/rejected
        bookings = Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(query).filter(
            Q(status__in=['completed', 'cancelled', 'rejected']) | 
            Q(end_time__lt=now)
        ).distinct().order_by('-end_time', '-requested_at')
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        partner_id = self.request.query_params.get('partner_id')
        if partner_id:
            qs = qs.filter(partner_id=partner_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Override create to add better error logging and handle FormData features"""
        import json
        
        print("=" * 50)
        print("ListingViewSet.create called")
        print(f"Request method: {request.method}")
        print(f"Content-Type: {request.content_type}")
        print(f"User: {request.user}")
        
        # Prepare data dictionary from request
        data = dict(request.data)
        
        # Handle features from FormData - ensure it's in the correct format
        # The backend JSONField expects either a list (JSON) or JSON string
        if 'features' in request.POST:
            features_value = request.POST.get('features')
            if isinstance(features_value, str):
                # Check if it's already a JSON string
                try:
                    # Validate it's valid JSON
                    json.loads(features_value)
                    # If it parses, use it as-is (serializer will parse it)
                    data['features'] = features_value
                except (json.JSONDecodeError, ValueError):
                    # If not valid JSON, might be multiple form entries - collect them
                    features_list = request.POST.getlist('features')
                    if features_list:
                        # Filter and convert to JSON string
                        features_list = [f for f in features_list if f and str(f).strip()]
                        data['features'] = json.dumps(features_list) if features_list else json.dumps([])
                    else:
                        data['features'] = json.dumps([])
            elif isinstance(features_value, list):
                # If it's already a list, convert to JSON string
                data['features'] = json.dumps(features_value)
        elif 'features' in request.data:
            # If features is already in request.data (from JSON request)
            if isinstance(data['features'], list):
                # Already a list, keep it
                pass
            elif isinstance(data['features'], str):
                # Try to parse as JSON
                try:
                    json.loads(data['features'])
                    # Valid JSON, keep as string (serializer will parse)
                except (json.JSONDecodeError, ValueError):
                    # Invalid JSON, convert to empty list
                    data['features'] = []
            else:
                data['features'] = []
        else:
            # No features provided, use empty list
            data['features'] = json.dumps([])
        
        print(f"Request data keys: {list(data.keys())}")
        print(f"Request POST keys: {list(request.POST.keys())}")
        print(f"Request FILES keys: {list(request.FILES.keys())}")
        
        # Log all data values (but truncate long values)
        print("\nRequest.data contents:")
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 100:
                print(f"  {key}: {value[:100]}... (truncated)")
            elif isinstance(value, list):
                print(f"  {key}: {value} (type: list, length: {len(value)})")
            else:
                print(f"  {key}: {value} (type: {type(value).__name__})")
        
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print("\n❌ Serializer validation failed!")
            print(f"Serializer errors: {serializer.errors}")
            print("=" * 50)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print("\n✅ Serializer is valid, calling perform_create")
        print("=" * 50)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        request = self.request
        pictures = request.FILES.getlist("pictures")
        partner, created = Partner.objects.get_or_create(
            user=request.user,
            defaults={
                'company_name': f"{request.user.username}'s Company",
                'tax_id': 'PENDING',
            }
        )
        if not request.user.is_partner:
            request.user.is_partner = True
            request.user.save(update_fields=['is_partner'])
        listing = serializer.save(partner=partner)
        if pictures:
            urls = []
            for pic in pictures:
                url = upload_file_to_supabase(pic, folder=f"listings/{listing.id}")
                urls.append(url)
            listing.pictures = urls
            listing.save(update_fields=["pictures"])

    def perform_update(self, serializer):
        print("perform_update called")
        listing = serializer.save()
        
        pictures = self.request.FILES.getlist("pictures")
        if pictures:
            for picture in pictures:
                url = upload_file_to_supabase(picture, folder=f"listings/{listing.id}")
                listing.pictures.append(url)
            listing.save(update_fields=["pictures"])

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all().prefetch_related('listings')
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Partner.objects.all().prefetch_related('listings')
        if not user.is_authenticated:
            raise ValidationError({"detail": "You are not loged in."})
        if not user.is_partner and user.is_authenticated:
            raise ValidationError({"detail": "You are not a partner."})
        return Partner.objects.filter(user=user).prefetch_related('listings')

    def perform_create(self, serializer):
        if self.request.user.is_partner:
           raise ValidationError({"detail": "You are already registered as a partner."})

        serializer.save(user=self.request.user)
        if not self.request.user.is_partner:
            self.request.user.is_partner = True
            self.request.user.save(update_fields=['is_partner'])

#  add for bug fix - get or create partner for current user
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or create the current user's partner record"""
        user = request.user
        
        if not user.is_partner:
            raise ValidationError({"detail": "You are not a partner."})
        
        partner, created = Partner.objects.get_or_create(
            user=user,
            defaults={
                'company_name': f"{user.first_name or user.username}'s Company",
                'tax_id': 'PENDING',
                'verification_status': 'pending',
                'agree_on_terms': True
            }
        )
        
        serializer = self.get_serializer(partner)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_partner_profile_view(request, slug):
    """
    Public endpoint to fetch partner profile data by slug or numeric ID.
    Returns limited partner information along with associated listings.
    """
    queryset = Partner.objects.select_related('user').prefetch_related('listings')

    if slug.isdigit():
        partner = get_object_or_404(queryset, pk=int(slug))
    else:
        partner = get_object_or_404(queryset, slug=slug)

    serializer = PublicPartnerSerializer(partner, context={'request': request})
    return Response(serializer.data)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        from django.db.models import Q
        
        user = self.request.user
        if user.is_staff:
            # For staff, optimize with select_related
            return Booking.objects.select_related(
                'user', 'listing', 'listing__partner', 'listing__partner__user'
            ).all()
        if not user.is_authenticated:
            raise ValidationError({"detail": "You are not logged in."})
        
        query = Q(user=user)
        
        if user.is_partner:
            query |= Q(listing__partner__user=user)
        
        # Optimize query with select_related to avoid N+1 queries
        return Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(query).distinct().order_by('-requested_at')

    def perform_create(self, serializer):
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'listing': 'Listing not found'})
        
        request_message = self.request.data.get('request_message', '')
        serializer.save(user=self.request.user, listing=listing, request_message=request_message)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_booking(self, request, pk=None):
        """Accept a pending booking request"""
        try:
            # Optimize query with select_related to avoid N+1 queries
            booking = Booking.objects.select_related('listing', 'listing__partner', 'listing__partner__user').get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user has permission - must be the owner of the listing's partner
        if not hasattr(booking.listing, 'partner') or not booking.listing.partner:
            return Response(
                {
                    'error': 'This listing does not have an associated partner',
                    'detail': f'Listing ID {booking.listing.id} does not have a partner. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(booking.listing.partner, 'user') or not booking.listing.partner.user:
            return Response(
                {
                    'error': 'Partner does not have an associated user',
                    'detail': f'Partner ID {booking.listing.partner.id} does not have a user. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the current user is the owner of this listing
        if request.user.id != booking.listing.partner.user.id:
            return Response(
                {
                    'error': 'You can only accept bookings for your own cars',
                    'detail': f'You are user {request.user.id} ({request.user.email}), but this car belongs to user {booking.listing.partner.user.id} ({booking.listing.partner.user.email})',
                    'debug_info': {
                        'your_user_id': request.user.id,
                        'your_email': request.user.email,
                        'booking_id': booking.id,
                        'listing_id': booking.listing.id,
                        'partner_id': booking.listing.partner.id,
                        'owner_user_id': booking.listing.partner.user.id,
                        'owner_email': booking.listing.partner.user.email
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be accepted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        conflicting_bookings = Booking.objects.filter(
            listing=booking.listing,
            status='accepted',
            start_time__lt=booking.end_time,
            end_time__gt=booking.start_time
        ).exclude(id=booking.id)
        
        if conflicting_bookings.exists():
            conflicting_booking = conflicting_bookings.first()
            conflict_details = f"This time slot conflicts with an existing booking (ID: {conflicting_booking.id}) from {conflicting_booking.start_time.strftime('%Y-%m-%d')} to {conflicting_booking.end_time.strftime('%Y-%m-%d')}"
            return Response(
                {'error': conflict_details}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'accepted'
        booking.accepted_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_booking(self, request, pk=None):
        """Reject a pending booking request"""
        try:
            # Optimize query with select_related to avoid N+1 queries
            booking = Booking.objects.select_related('listing', 'listing__partner', 'listing__partner__user').get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user has permission - must be the owner of the listing's partner
        if not hasattr(booking.listing, 'partner') or not booking.listing.partner:
            return Response(
                {
                    'error': 'This listing does not have an associated partner',
                    'detail': f'Listing ID {booking.listing.id} does not have a partner. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(booking.listing.partner, 'user') or not booking.listing.partner.user:
            return Response(
                {
                    'error': 'Partner does not have an associated user',
                    'detail': f'Partner ID {booking.listing.partner.id} does not have a user. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the current user is the owner of this listing
        if request.user.id != booking.listing.partner.user.id:
            return Response(
                {
                    'error': 'You can only reject bookings for your own cars',
                    'detail': f'You are user {request.user.id} ({request.user.email}), but this car belongs to user {booking.listing.partner.user.id} ({booking.listing.partner.user.email})',
                    'debug_info': {
                        'your_user_id': request.user.id,
                        'your_email': request.user.email,
                        'booking_id': booking.id,
                        'listing_id': booking.listing.id,
                        'partner_id': booking.listing.partner.id,
                        'owner_user_id': booking.listing.partner.user.id,
                        'owner_email': booking.listing.partner.user.email
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason', '')
        booking.status = 'rejected'
        booking.rejected_at = timezone.now()
        booking.rejection_reason = rejection_reason
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        """Cancel a booking (can be called by renter or owner)"""
        try:
            booking = Booking.objects.select_related('user', 'listing', 'listing__partner', 'listing__partner__user').get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission (either renter or owner)
        is_renter = booking.user.id == request.user.id
        is_owner = (hasattr(booking.listing, 'partner') and 
                   hasattr(booking.listing.partner, 'user') and
                   booking.listing.partner.user.id == request.user.id)
        
        if not (is_renter or is_owner or request.user.is_staff):
            return Response(
                {'error': 'You can only cancel your own bookings or bookings for your cars'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status in ['cancelled', 'completed']:
            return Response(
                {'error': f'Booking is already {booking.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pending-requests')
    def pending_requests(self, request):
        """Get all pending booking requests for the current user's listings"""
        user = request.user
        
        if not user.is_partner:
            return Response(
                {'detail': 'You must be a partner to view pending requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get bookings for listings owned by this user's partner account
        bookings = Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(
            listing__partner__user=user,
            status='pending'
        ).order_by('-requested_at')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_bookings(self, request):
        """Get upcoming bookings for the current user (as renter or owner)"""
        user = request.user
        
        from django.db.models import Q
        from django.utils import timezone
        
        query = Q(user=user)
        
        if user.is_partner:
            query |= Q(listing__partner__user=user)
        
        # Get pending and accepted bookings with start_time in the future or recent past (within last 7 days)
        # Include pending bookings so users can see their booking requests
        # Include accepted bookings that haven't started yet or started recently
        now = timezone.now()
        
        bookings = Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(
            query,
            status__in=['pending', 'accepted'],  # Include both pending and accepted
            start_time__gte=now - timezone.timedelta(days=7)  # Include bookings from last 7 days and future
        ).exclude(
            status__in=['cancelled', 'rejected', 'completed']  # Exclude completed/cancelled/rejected
        ).order_by('start_time')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.
    Reviews are public - anyone can view them.
    Users can create reviews for listings they've booked (completed bookings).
    Partners can manage reviews for their listings.
    """
    queryset = Review.objects.all().select_related('user', 'listing')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Read-only for unauthenticated, authenticated can create/update
    
    def get_queryset(self):
        # Admins can see all reviews (including unpublished)
        # Regular users see only published reviews
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = Review.objects.all().select_related('user', 'listing')
        else:
            queryset = Review.objects.filter(is_published=True).select_related('user', 'listing')
        
        # Filter by listing early to reduce query size (most common filter)
        listing_id = self.request.query_params.get('listing', None)
        if listing_id:
            try:
                listing_id = int(listing_id)
                queryset = queryset.filter(listing_id=listing_id)
            except (ValueError, TypeError):
                pass  # Invalid listing ID, ignore filter
        
        # Prefetch votes for the current user to avoid N+1 queries
        # Only do this if user is authenticated to avoid anonymous user issues
        # Do this AFTER filtering by listing to optimize the prefetch query
        try:
            if self.request.user.is_authenticated:
                queryset = queryset.prefetch_related(
                    Prefetch(
                        'votes',
                        queryset=ReviewVote.objects.filter(user=self.request.user),
                        to_attr='user_votes'
                    )
                )
        except Exception:
            # If prefetch fails, continue without it (won't break functionality)
            pass
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user', None)
        if user_id:
            try:
                user_id = int(user_id)
                queryset = queryset.filter(user_id=user_id)
            except (ValueError, TypeError):
                pass  # Invalid user ID, ignore filter
        
        # Filter by rating
        rating = self.request.query_params.get('rating', None)
        if rating:
            try:
                rating = int(rating)
                if 1 <= rating <= 5:
                    queryset = queryset.filter(rating=rating)
            except (ValueError, TypeError):
                pass
        
        # Search by text content
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                DjangoQ(comment__icontains=search)
            )
        
        # Partners can see all reviews (including unpublished) for their listings
        if self.request.user.is_authenticated:
            if self.request.query_params.get('my_listings', 'false').lower() == 'true':
                try:
                    partner_listings = Listing.objects.filter(partner__user=self.request.user)
                    queryset = Review.objects.filter(listing__in=partner_listings).select_related('user', 'listing')
                except Exception:
                    pass  # If partner doesn't exist, fall back to published reviews
        
        # Sorting options
        sort_by = self.request.query_params.get('sort', 'newest')
        if sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'rating_high':
            queryset = queryset.order_by('-rating', '-created_at')
        elif sort_by == 'rating_low':
            queryset = queryset.order_by('rating', '-created_at')
        elif sort_by == 'helpful':
            queryset = queryset.order_by('-helpful_count', '-created_at')
        else:  # newest (default)
            queryset = queryset.order_by('-created_at')
        
        # Ensure distinct results (prevent duplicates from joins)
        queryset = queryset.distinct()
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set user and listing when creating review"""
        listing_id = self.request.data.get('listing')
        booking_id = self.request.data.get('booking')
        
        if not listing_id:
            raise ValidationError({"listing": "Listing ID is required"})
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            raise ValidationError({"listing": "Listing not found"})
        
        # If booking is provided, validate it
        if booking_id:
            try:
                booking = Booking.objects.get(pk=booking_id, user=self.request.user, status='completed')
                serializer.save(
                    user=self.request.user,
                    listing=listing,
                    booking=booking,
                    is_verified=True  # Verified if from completed booking
                )
            except Booking.DoesNotExist:
                raise ValidationError({"booking": "Invalid booking or booking not completed"})
        else:
            serializer.save(
                user=self.request.user,
                listing=listing,
                is_verified=False
            )
    
    def perform_update(self, serializer):
        """Only allow user to update their own reviews"""
        review = self.get_object()
        if review.user != self.request.user:
            raise ValidationError({"detail": "You can only edit your own reviews"})
        serializer.save()
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """Partner can publish/unpublish reviews for their listings"""
        review = self.get_object()
        
        # Check if user is the partner of the listing
        if not hasattr(request.user, 'partner') or review.listing.partner.user != request.user:
            return Response(
                {"detail": "You can only manage reviews for your own listings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        is_published = request.data.get('is_published', True)
        review.is_published = is_published
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='can_review', permission_classes=[AllowAny])
    def can_review(self, request):
        """Check if user can review a listing"""
        listing_id = request.query_params.get('listing')
        booking_id = request.query_params.get('booking')
        
        if not listing_id:
            return Response(
                {"detail": "Listing ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"detail": "Listing not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If user is not authenticated, they cannot review
        if not request.user.is_authenticated:
            return Response({
                "can_review": False,
                "reason": "not_authenticated",
                "has_completed_booking": False
            })
        
        # Check if user has already reviewed this listing
        existing_review = Review.objects.filter(
            user=request.user,
            listing=listing
        ).first()
        
        if existing_review:
            return Response({
                "can_review": False,
                "reason": "already_reviewed",
                "existing_review_id": existing_review.id,
                "has_completed_booking": False
            })
        
        # If booking is provided, check if it's valid
        can_review = False
        has_completed_booking = False
        if booking_id:
            try:
                booking = Booking.objects.get(
                    pk=booking_id,
                    user=request.user,
                    listing=listing,
                    status='completed'
                )
                can_review = True
                has_completed_booking = True
            except Booking.DoesNotExist:
                pass
        else:
            # If no booking specified, check if user has any completed bookings for this listing
            has_completed_booking = Booking.objects.filter(
                user=request.user,
                listing=listing,
                status='completed'
            ).exists()
            can_review = True  # Allow review if user is authenticated
        
        return Response({
            "can_review": can_review,
            "has_completed_booking": has_completed_booking
        })
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote helpful/not helpful on a review"""
        review = self.get_object()
        user = request.user
        
        if request.method == 'DELETE':
            # Remove vote
            vote = ReviewVote.objects.filter(review=review, user=user).first()
            if vote:
                vote.delete()
            return Response({"detail": "Vote removed"})
        
        # Create or update vote
        is_helpful = request.data.get('is_helpful', True)
        vote, created = ReviewVote.objects.get_or_create(
            review=review,
            user=user,
            defaults={'is_helpful': is_helpful}
        )
        
        if not created:
            vote.is_helpful = is_helpful
            vote.save()
        
        # Update helpful count
        helpful_count = ReviewVote.objects.filter(review=review, is_helpful=True).count()
        review.helpful_count = helpful_count
        review.save(update_fields=['helpful_count'])
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAuthenticated])
    def respond(self, request, pk=None):
        """Owner/partner can respond to a review"""
        review = self.get_object()
        
        # Check if user is the partner of the listing
        if not hasattr(request.user, 'partner') or review.listing.partner.user != request.user:
            return Response(
                {"detail": "You can only respond to reviews for your own listings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.utils import timezone
        response_text = request.data.get('owner_response', '').strip()
        
        if request.method == 'PATCH' and not response_text:
            # Delete response
            review.owner_response = None
            review.owner_response_at = None
        else:
            if not response_text:
                return Response(
                    {"detail": "Response text is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            review.owner_response = response_text
            review.owner_response_at = timezone.now()
        
        review.save()
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def report(self, request, pk=None):
        """Report a review for moderation"""
        review = self.get_object()
        user = request.user
        
        # Check if user already reported this review
        existing_report = ReviewReport.objects.filter(review=review, user=user).first()
        if existing_report:
            return Response(
                {"detail": "You have already reported this review"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'other')
        description = request.data.get('description', '').strip()
        
        if reason not in [choice[0] for choice in ReviewReport.REVIEW_REPORT_REASONS]:
            reason = 'other'
        
        report = ReviewReport.objects.create(
            review=review,
            user=user,
            reason=reason,
            description=description
        )
        
        return Response({
            "detail": "Review reported successfully",
            "report_id": report.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request):
        """Get review analytics for partner's listings"""
        if not hasattr(request.user, 'partner'):
            return Response(
                {"detail": "You must be a partner to view analytics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        partner_listings = Listing.objects.filter(partner__user=request.user)
        reviews = Review.objects.filter(listing__in=partner_listings, is_published=True)
        
        # Calculate statistics
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        
        # Rating distribution
        rating_dist = {}
        for i in range(1, 6):
            rating_dist[i] = reviews.filter(rating=i).count()
        
        # Reviews over time (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_reviews = reviews.filter(created_at__gte=thirty_days_ago).count()
        
        # Most reviewed listings
        listing_review_counts = reviews.values('listing__id', 'listing__make', 'listing__model').annotate(
            review_count=Count('id'),
            avg_rating=Avg('rating')
        ).order_by('-review_count')[:5]
        
        return Response({
            "total_reviews": total_reviews,
            "average_rating": round(avg_rating, 1),
            "rating_distribution": rating_dist,
            "recent_reviews_30_days": recent_reviews,
            "top_listings": list(listing_review_counts),
            "total_helpful_votes": reviews.aggregate(Sum('helpful_count'))['helpful_count__sum'] or 0,
            "reviews_with_responses": reviews.filter(owner_response__isnull=False).count()
        })

class FavoriteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user favorites"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return favorites for the current user"""
        user = self.request.user
        if user.is_staff:
            # Staff can see all favorites
            return Favorite.objects.select_related('user', 'listing', 'listing__partner').all()
        
        # Regular users can only see their own favorites
        return Favorite.objects.select_related('user', 'listing', 'listing__partner').filter(user=user)
    
    def perform_create(self, serializer):
        """Create a favorite - ensure user can only favorite for themselves"""
        listing_id = self.request.data.get('listing')
        if not listing_id:
            raise ValidationError({'listing': 'Listing ID is required'})
        
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            raise ValidationError({'listing': 'Listing not found'})
        
        # Check if already favorited
        favorite_exists = Favorite.objects.filter(user=self.request.user, listing=listing).exists()
        if favorite_exists:
            raise ValidationError({'detail': 'This listing is already in your favorites'})
        
        serializer.save(user=self.request.user, listing=listing)
    
    @action(detail=False, methods=['get'], url_path='my-favorites')
    def my_favorites(self, request):
        """Get current user's favorites with full listing details"""
        favorites = self.get_queryset()
        serializer = self.get_serializer(favorites, many=True)
        
        # Return listings data directly (more convenient for frontend)
        listings_data = [fav.listing for fav in favorites]
        listing_serializer = ListingSerializer(listings_data, many=True)
        
        return Response({
            'favorites': serializer.data,
            'listings': listing_serializer.data
        })
    
    def get_queryset(self):
        from django.db.models import Q
        
        user = self.request.user
        if user.is_staff:
            # For staff, optimize with select_related
            return Booking.objects.select_related(
                'user', 'listing', 'listing__partner', 'listing__partner__user'
            ).all()
        if not user.is_authenticated:
            raise ValidationError({"detail": "You are not logged in."})
        
        query = Q(user=user)
        
        if user.is_partner:
            query |= Q(listing__partner__user=user)
        
        # Optimize query with select_related to avoid N+1 queries
        return Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(query).distinct().order_by('-requested_at')

    def perform_create(self, serializer):
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'listing': 'Listing not found'})
        
        request_message = self.request.data.get('request_message', '')
        serializer.save(
            user=self.request.user, 
            listing=listing,
            request_message=request_message,
            status='pending'
        )

    @action(detail=False, methods=['get'], url_path='pending-requests')
    def pending_requests(self, request):
        """Get pending booking requests for car owner's listings"""
        user = request.user
        if not user.is_partner:
            return Response(
                {'error': 'Only partners can view booking requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        partner = user.partner
        pending_bookings = Booking.objects.filter(
            listing__partner=partner,
            status='pending'
        ).order_by('-requested_at')
        
        serializer = self.get_serializer(pending_bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_booking(self, request, pk=None):
        """Accept a pending booking request"""
        try:
            # Optimize query with select_related to avoid N+1 queries
            booking = Booking.objects.select_related('listing', 'listing__partner', 'listing__partner__user').get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user has permission - must be the owner of the listing's partner
        if not hasattr(booking.listing, 'partner') or not booking.listing.partner:
            return Response(
                {
                    'error': 'This listing does not have an associated partner',
                    'detail': f'Listing ID {booking.listing.id} does not have a partner. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(booking.listing.partner, 'user') or not booking.listing.partner.user:
            return Response(
                {
                    'error': 'Partner does not have an associated user',
                    'detail': f'Partner ID {booking.listing.partner.id} does not have a user. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the current user is the owner of this listing
        if request.user.id != booking.listing.partner.user.id:
            return Response(
                {
                    'error': 'You can only accept bookings for your own cars',
                    'detail': f'You are user {request.user.id} ({request.user.email}), but this car belongs to user {booking.listing.partner.user.id} ({booking.listing.partner.user.email})',
                    'debug_info': {
                        'your_user_id': request.user.id,
                        'your_email': request.user.email,
                        'booking_id': booking.id,
                        'listing_id': booking.listing.id,
                        'partner_id': booking.listing.partner.id,
                        'owner_user_id': booking.listing.partner.user.id,
                        'owner_email': booking.listing.partner.user.email
                    }
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be accepted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        conflicting_bookings = Booking.objects.filter(
            listing=booking.listing,
            status='accepted',
            start_time__lt=booking.end_time,
            end_time__gt=booking.start_time
        ).exclude(id=booking.id)
        
        if conflicting_bookings.exists():
            conflicting_booking = conflicting_bookings.first()
            conflict_details = f"This time slot conflicts with an existing booking (ID: {conflicting_booking.id}) from {conflicting_booking.start_time.strftime('%Y-%m-%d')} to {conflicting_booking.end_time.strftime('%Y-%m-%d')}"
            return Response(
                {'error': conflict_details}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'accepted'
        booking.accepted_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_booking(self, request, pk=None):
        """Reject a pending booking request"""
        try:
            # Optimize query with select_related to avoid N+1 queries
            booking = Booking.objects.select_related('listing', 'listing__partner', 'listing__partner__user').get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user has permission - must be the owner of the listing's partner
        if not hasattr(booking.listing, 'partner') or not booking.listing.partner:
            return Response(
                {
                    'error': 'This listing does not have an associated partner',
                    'detail': f'Listing ID {booking.listing.id} does not have a partner. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(booking.listing.partner, 'user') or not booking.listing.partner.user:
            return Response(
                {
                    'error': 'Partner does not have an associated user',
                    'detail': f'Partner ID {booking.listing.partner.id} does not have a user. Please contact support.'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the current user is the owner of this listing
        if request.user.id != booking.listing.partner.user.id:
            return Response(
                {
                    'error': 'You can only reject bookings for your own cars',
                    'detail': f'You are user {request.user.id} ({request.user.email}), but this car belongs to user {booking.listing.partner.user.id} ({booking.listing.partner.user.email})'
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason', '')
        booking.status = 'rejected'
        booking.rejected_at = timezone.now()
        booking.rejection_reason = rejection_reason
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        """Cancel an existing booking"""
        booking = self.get_object()
        
        if request.user not in [booking.user, booking.listing.partner.user]:
            return Response(
                {'error': 'You can only cancel your own bookings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not booking.can_be_cancelled:
            return Response(
                {'error': 'This booking cannot be cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_bookings(self, request):
        """Get user's upcoming accepted bookings"""
        user = request.user
        upcoming_bookings = Booking.objects.filter(
            user=user,
            status='accepted',
            start_time__gt=timezone.now()
        ).order_by('start_time')
        
        serializer = self.get_serializer(upcoming_bookings, many=True)
        return Response(serializer.data)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()
        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"
            send_mail(
                'Password Reset Request',
                f'Use this link to reset your password: {reset_url}',
                'from@airbcar.com',
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent'}, status=status.HTTP_200_OK)
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    
    def post(self, request, uidb64, token):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        token_generator = PasswordResetTokenGenerator()
        if user and token_generator.check_token(user, token):
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token or user'}, status=status.HTTP_400_BAD_REQUEST)

def verify_email(request):
    token = request.GET.get("token")
    if not token:
        return HttpResponse("Invalid token", status=400)

    try:
        user = User.objects.get(email_verification_token=token)
        user.is_verified = True
        user.email_verification_token = None
        user.save()
        return HttpResponse("Email successfully verified!")
    except User.DoesNotExist:
        return HttpResponse("Invalid or expired token", status=400)

class UserVerificationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        token = request.data.get('token')
        if token == user.email_verification_token:
            user.email_verified = True
            user.is_verified = True
            user.email_verification_token = None
            user.save()
            return Response({'message': 'Email verified'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_partner': user.is_partner,
                'is_verified': user.is_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'role': getattr(user, 'role', 'user'),
            }
        return response

class UserStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_partner': user.is_partner,
            'is_verified': user.is_verified,
            'email_verified': user.email_verified,
            'is_staff': user.is_staff,
        })

    def post(self, request):
        """Handle email verification"""
        user = request.user
        token = request.data.get('token')
        if token == user.email_verification_token:
            user.email_verified = True
            user.is_verified = True
            user.email_verification_token = None
            user.save()
            return Response({'message': 'Email verified'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class AdminStatusView(generics.GenericAPIView):
    """Simplified admin check"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'is_admin': request.user.is_staff})

def home_view(request):
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Airbcar Backend API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 2rem;
                background-color: #f9f9f9;
                color: #333;
            }
            h1 {
                color: #1e88e5;
                border-bottom: 2px solid #1e88e5;
                padding-bottom: 0.3rem;
            }
            h2 {
                margin-top: 2rem;
                color: #444;
            }
            code {
                background-color: #eaeaea;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.95em;
            }
            pre {
                background-color: #272822;
                color: #f8f8f2;
                padding: 1rem;
                overflow-x: auto;
                border-radius: 5px;
            }
            .section {
                margin-bottom: 2rem;
            }
            .container {
                max-width: 900px;
                margin: auto;
            }
            a {
                color: #1e88e5;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚗 Airbcar Backend API</h1>
            <p><strong>Date:</strong> July 9, 2025</p>
            <p><strong>Dev:</strong> Naoufal (Frontend)</p>
            <p><strong>Status:</strong> Day 1 — Login, Sign-up, User APIs</p>
            <p><strong>Base URL:</strong> <code>http://localhost:8000/</code></p>

            <div class="section">
                <h2>✅ Login</h2>
                <p><strong>POST</strong> <code>/api/login/</code></p>
                <pre>   {
        "username": "testuser2",
        "password": "testpass123"
    }</pre>
                <p><strong>Returns:</strong> JWT <code>access</code> & <code>refresh</code> tokens + user info</p>
            </div>

            <div class="section">
                <h2>🔁 Refresh Token</h2>
                <p><strong>POST</strong> <code>/api/token/refresh/</code></p>
                <pre>   {
        "refresh": "your_refresh_token_here"
    }</pre>
            </div>

            <div class="section">
                <h2>📝 Register (Sign-up)</h2>
                <p><strong>POST</strong> <code>/api/register/</code></p>
                <pre>   {
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "testpass123",
        "phone_number": "+1234567890"
    }</pre>
            </div>

            <div class="section">
                <h2>👥 User APIs</h2>
                <ul>
                    <li>GET <code>/api/users/</code> — List all users</li>
                    <li>GET <code>/api/users/&lt;id&gt;/</code> — Get specific user</li>
                    <li>GET <code>/users/</code> — User list view</li>
                </ul>
            </div>

            <div class="section">
                <h2>🛠️ Dev Setup</h2>
                <pre>
    cd airbcar_backend
    source env/bin/activate
    pip install -r requirements.txt
    sudo service postgresql start
    python manage.py migrate
    python manage.py runserver
                </pre>
            </div>

            <div class="section">
                <h2>📌 Notes</h2>
                <ul>
                    <li>Tokens must be used as: <code>Authorization: Bearer &lt;access&gt;</code></li>
                    <li>Pending: Email verification, Password reset</li>
                    <li>Contact: Amine</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)
