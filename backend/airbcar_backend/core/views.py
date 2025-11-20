"""
API views for core app - using database models.
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
from django.conf import settings
import traceback

from .models import Listing, Booking, Favorite, Review, Partner, User
from .serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer, PartnerSerializer
)


class ListingListView(APIView):
    """List all listings or search listings with filters."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Get query parameters
        location = request.query_params.get('location', '').strip()
        pickup_date = request.query_params.get('pickup_date') or request.query_params.get('pickupDate')
        return_date = request.query_params.get('return_date') or request.query_params.get('returnDate')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        transmission = request.query_params.get('transmission')
        fuel_type = request.query_params.get('fuel_type')
        seats = request.query_params.get('seats')
        style = request.query_params.get('style')
        brand = request.query_params.get('brand')
        verified = request.query_params.get('verified')
        
        # Start with all available listings
        queryset = Listing.objects.filter(is_available=True)
        
        # Apply filters
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        if min_price:
            try:
                queryset = queryset.filter(price_per_day__gte=float(min_price))
            except ValueError:
                pass
        
        if max_price:
            try:
                queryset = queryset.filter(price_per_day__lte=float(max_price))
            except ValueError:
                pass
        
        if transmission:
            transmissions = [t.strip() for t in transmission.split(',')]
            queryset = queryset.filter(transmission__in=transmissions)
        
        if fuel_type:
            fuel_types = [f.strip() for f in fuel_type.split(',')]
            queryset = queryset.filter(fuel_type__in=fuel_types)
        
        if seats:
            seat_counts = [int(s.strip()) for s in seats.split(',') if s.strip().isdigit()]
            if seat_counts:
                queryset = queryset.filter(seating_capacity__in=seat_counts)
        
        if style:
            styles = [s.strip() for s in style.split(',')]
            queryset = queryset.filter(vehicle_style__in=styles)
        
        if brand:
            brands = [b.strip() for b in brand.split(',')]
            queryset = queryset.filter(make__in=brands)
        
        if verified == 'true':
            queryset = queryset.filter(is_verified=True)
        
        # Filter by availability dates (exclude listings with conflicting bookings)
        if pickup_date and return_date:
            try:
                pickup = datetime.strptime(pickup_date, '%Y-%m-%d').date()
                return_d = datetime.strptime(return_date, '%Y-%m-%d').date()
                
                # Get listings that have conflicting bookings
                conflicting_bookings = Booking.objects.filter(
                    status__in=['pending', 'confirmed', 'active'],
                    pickup_date__lte=return_d,
                    return_date__gte=pickup
                ).values_list('listing_id', flat=True)
                
                # Exclude listings with conflicts
                queryset = queryset.exclude(id__in=conflicting_bookings)
            except ValueError:
                # Invalid date format, skip date filtering
                pass
        
        # Serialize and return
        from django.db.utils import OperationalError
        
        try:
            # Ensure database connection is active before querying
            try:
                from django.db import connection
                connection.ensure_connection()
            except OperationalError as conn_err:
                return Response({
                    'data': [],
                    'count': 0,
                    'error': 'Database connection error. Please try again later.',
                    'message': 'Service temporarily unavailable'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Limit queryset to avoid timeout on large datasets
            # Use select_related to optimize queries
            queryset = queryset.select_related('partner', 'partner__user')[:100]  # Limit to 100 results
            
            serializer = ListingSerializer(queryset, many=True)
            
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'message': 'Listings retrieved successfully'
            })
        except OperationalError as db_err:
            # Database connection error
            return Response({
                'data': [],
                'count': 0,
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Handle other errors
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"Error in ListingListView ({error_type}): {error_msg}")
                print(traceback.format_exc())
            return Response({
                'data': [],
                'count': 0,
                'error': 'An error occurred while fetching listings'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListingDetailView(APIView):
    """Get a single listing by ID."""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        from django.db import connection
        from django.db.utils import OperationalError
        
        try:
            # Test database connection first
            connection.ensure_connection()
            
            listing = Listing.objects.get(pk=pk, is_available=True)
            serializer = ListingSerializer(listing)
            return Response({
                'data': serializer.data,
                'message': 'Listing retrieved successfully'
            })
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except OperationalError as db_err:
            # Database connection error
            return Response({
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Handle other errors
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"Error in ListingDetailView ({error_type}): {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while fetching the listing'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FavoriteListView(APIView):
    """List user's favorites."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('listing', 'listing__partner')
        serializer = FavoriteSerializer(favorites, many=True)
        
        # Return in format expected by frontend
        favorites_data = serializer.data
        
        return Response({
            'data': favorites_data,
            'favorites': favorites_data,  # Alternative format
            'listings': [fav['listing'] for fav in favorites_data if fav.get('listing')],
            'message': 'Favorites retrieved successfully'
        })
    
    def post(self, request):
        """Add a listing to favorites."""
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                listing=listing
            )
            
            if created:
                serializer = FavoriteSerializer(favorite)
                return Response({
                    'data': serializer.data,
                    'message': 'Favorite added successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Listing already in favorites'
                }, status=status.HTTP_200_OK)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)


class FavoriteDetailView(APIView):
    """Get or delete a favorite."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            favorite = Favorite.objects.get(pk=pk, user=request.user)
            serializer = FavoriteSerializer(favorite)
            return Response({
                'data': serializer.data
            })
        except Favorite.DoesNotExist:
            return Response({
                'error': 'Favorite not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            favorite = Favorite.objects.get(pk=pk, user=request.user)
            favorite.delete()
            return Response({
                'message': 'Favorite removed successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({
                'error': 'Favorite not found'
            }, status=status.HTTP_404_NOT_FOUND)


class UserListView(APIView):
    """List users."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admins can list all users
        if request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response({
            'data': serializer.data
        })


class UserMeView(APIView):
    """Get current user."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'data': serializer.data
        })


class UserDetailView(APIView):
    """Get user by ID."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        # Users can only view their own profile unless admin
        if request.user.pk != pk and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user)
            return Response({
                'data': serializer.data
            })
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class BookingListView(APIView):
    """List bookings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Users see their own bookings, partners see their listings' bookings, admins see all
        if request.user.role == 'admin':
            bookings = Booking.objects.all()
        elif request.user.role == 'partner':
            try:
                partner = request.user.partner_profile
                bookings = Booking.objects.filter(partner=partner)
            except Partner.DoesNotExist:
                bookings = Booking.objects.none()
        else:
            bookings = Booking.objects.filter(customer=request.user)
        
        serializer = BookingSerializer(bookings, many=True)
        return Response({
            'data': serializer.data
        })
    
    def post(self, request):
        """Create a new booking."""
        listing_id = request.data.get('listing_id') or request.data.get('vehicleId')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id, is_available=True)
            
            # Create booking
            booking = Booking.objects.create(
                listing=listing,
                customer=request.user,
                partner=listing.partner,
                pickup_date=request.data.get('pickup_date') or request.data.get('pickupDate'),
                return_date=request.data.get('return_date') or request.data.get('returnDate'),
                pickup_location=request.data.get('pickup_location', listing.location),
                return_location=request.data.get('return_location', listing.location),
                total_amount=request.data.get('total_amount', listing.price_per_day),
                special_requests=request.data.get('special_requests', '')
            )
            
            serializer = BookingSerializer(booking)
            return Response({
                'data': serializer.data,
                'message': 'Booking created successfully'
            }, status=status.HTTP_201_CREATED)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found or not available'
            }, status=status.HTTP_404_NOT_FOUND)


class BookingPendingRequestsView(APIView):
    """Get pending booking requests for partner."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'partner':
            return Response({
                'error': 'Only partners can view pending requests'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            partner = Partner.objects.get(user=request.user)
            # Get bookings with status 'pending' for this partner
            bookings = Booking.objects.filter(partner=partner, status='pending')
            serializer = BookingSerializer(bookings, many=True)
            return Response({
                'data': serializer.data
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)


class BookingUpcomingView(APIView):
    """Get upcoming bookings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.utils import timezone
        
        if request.user.role == 'admin':
            # Admins see all upcoming bookings
            bookings = Booking.objects.filter(
                pickup_date__gte=timezone.now().date(),
                status__in=['confirmed', 'active']
            )
        elif request.user.role == 'partner':
            try:
                partner = Partner.objects.get(user=request.user)
                bookings = Booking.objects.filter(
                    partner=partner,
                    pickup_date__gte=timezone.now().date(),
                    status__in=['confirmed', 'active']
                )
            except Partner.DoesNotExist:
                bookings = Booking.objects.none()
        else:
            # Customers see their own upcoming bookings
            bookings = Booking.objects.filter(
                customer=request.user,
                pickup_date__gte=timezone.now().date(),
                status__in=['confirmed', 'active']
            )
        
        serializer = BookingSerializer(bookings, many=True)
        return Response({
            'data': serializer.data
        })


class BookingDetailView(APIView):
    """Get booking by ID."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if request.user.role != 'admin' and booking.customer != request.user:
                if request.user.role == 'partner' and booking.partner.user != request.user:
                    return Response({
                        'error': 'Permission denied'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = BookingSerializer(booking)
            return Response({
                'data': serializer.data
            })
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)


class PartnerListView(APIView):
    """List partners."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        partners = Partner.objects.filter(is_verified=True)
        serializer = PartnerSerializer(partners, many=True)
        return Response({
            'data': serializer.data
        })


class PartnerMeView(APIView):
    """Get current user's partner profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get partner profile for current user
            partner = Partner.objects.get(user=request.user)
            serializer = PartnerSerializer(partner)
            return Response({
                'data': serializer.data
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found. Please complete your partner registration.',
                'has_partner_profile': False
            }, status=status.HTTP_404_NOT_FOUND)
    
    def patch(self, request):
        """Update current user's partner profile."""
        try:
            partner = Partner.objects.get(user=request.user)
            serializer = PartnerSerializer(partner, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'data': serializer.data,
                    'message': 'Partner profile updated successfully'
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)


class PartnerDetailView(APIView):
    """Get partner by ID."""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            partner = Partner.objects.get(pk=pk)
            serializer = PartnerSerializer(partner)
            return Response({
                'data': serializer.data
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner not found'
            }, status=status.HTTP_404_NOT_FOUND)


class LoginView(APIView):
    """User login with JWT."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.contrib.auth import authenticate
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to find user by email first (since username might be different)
        user = None
        try:
            user = User.objects.get(email=email)
            # Check password
            password_valid = user.check_password(password)
            if settings.DEBUG:
                print(f"Login attempt for {email}: password_valid={password_valid}, is_active={user.is_active}, is_verified={user.is_verified}")
            
            if not password_valid:
                user = None
                if settings.DEBUG:
                    print(f"Password check failed for {email}")
        except User.DoesNotExist:
            if settings.DEBUG:
                print(f"User with email {email} not found")
            # Try to authenticate with email as username (for backward compatibility)
            user = authenticate(username=email, password=password)
            if user and settings.DEBUG:
                print(f"Authenticated via username field for {email}")
        
        # If still None, try username field
        if user is None:
            try:
                user = User.objects.get(username=email)
                password_valid = user.check_password(password)
                if settings.DEBUG:
                    print(f"Login attempt via username field for {email}: password_valid={password_valid}")
                if not password_valid:
                    user = None
            except User.DoesNotExist:
                if settings.DEBUG:
                    print(f"User with username {email} not found")
                pass
        
        if user is None:
            if settings.DEBUG:
                print(f"Login failed: Invalid email or password for {email}")
            return Response({
                'error': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is active
        if not user.is_active:
            if not user.is_verified:
                if settings.DEBUG:
                    print(f"Login blocked: Email not verified for {email}")
                return Response({
                    'error': 'Please verify your email address before logging in. Check your inbox for the verification link.',
                    'email_not_verified': True
                }, status=status.HTTP_401_UNAUTHORIZED)
            else:
                if settings.DEBUG:
                    print(f"Login blocked: Account disabled for {email}")
                return Response({
                    'error': 'Account is disabled. Please contact support.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)
        
        if settings.DEBUG:
            print(f"Login successful for {email}")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data,
            'message': 'Login successful'
        })


class RegisterView(APIView):
    """User registration."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .utils import send_verification_email
        
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'customer')
        
        # Partner-specific fields
        business_name = request.data.get('business_name', '')
        tax_id = request.data.get('tax_id', '')
        business_type = request.data.get('business_type', 'individual')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate partner fields if role is partner
        if role == 'partner':
            if not business_name or not business_name.strip():
                return Response({
                    'error': 'Business name is required for partner registration'
                }, status=status.HTTP_400_BAD_REQUEST)
            if not tax_id or not tax_id.strip():
                return Response({
                    'error': 'Tax ID is required for partner registration'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user (initially inactive until email is verified)
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=False,  # User must verify email before activation
                is_verified=False
            )
            
            # Create partner profile if role is partner
            if role == 'partner':
                Partner.objects.create(
                    user=user,
                    business_name=business_name.strip(),
                    tax_id=tax_id.strip(),
                    business_type=business_type,
                    is_verified=False  # Partners need verification
                )
            
            # Send verification email
            verification = send_verification_email(user)
            
            if verification:
                user_serializer = UserSerializer(user)
                return Response({
                    'data': user_serializer.data,
                    'message': 'Account created successfully! Please check your email to verify your account.',
                    'email_sent': True
                }, status=status.HTTP_201_CREATED)
            else:
                # If email sending fails, still create the user but warn them
                user_serializer = UserSerializer(user)
                return Response({
                    'data': user_serializer.data,
                    'message': 'Account created, but verification email could not be sent. Please contact support.',
                    'email_sent': False
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error during registration: {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred during registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
    """Refresh JWT token."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
                'message': 'Token refreshed successfully'
            })
        except Exception as e:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)


class VerifyTokenView(APIView):
    """Verify JWT token."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_serializer = UserSerializer(request.user)
        return Response({
            'valid': True,
            'user': user_serializer.data,
            'is_partner': request.user.role == 'partner',
            'role': request.user.role
        })


class VerifyEmailView(APIView):
    """Verify user email address."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from .utils import verify_email_token
        
        token = request.query_params.get('token')
        
        if not token:
            return Response({
                'error': 'Verification token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        success, user, message = verify_email_token(token)
        
        if success:
            user_serializer = UserSerializer(user)
            return Response({
                'message': message,
                'user': user_serializer.data,
                'verified': True
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message,
                'verified': False
            }, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationEmailView(APIView):
    """Resend verification email."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .utils import send_verification_email
        
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if already verified
            if user.is_verified:
                return Response({
                    'message': 'Email is already verified',
                    'already_verified': True
                }, status=status.HTTP_200_OK)
            
            # Send new verification email
            verification = send_verification_email(user)
            
            if verification:
                return Response({
                    'message': 'Verification email sent successfully. Please check your inbox.',
                    'email_sent': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send verification email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account with this email exists, a verification email has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error resending verification email: {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while sending verification email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetRequestView(APIView):
    """Request password reset email."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .utils import send_password_reset_email
        
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Send password reset email
            password_reset = send_password_reset_email(user)
            
            if password_reset:
                # Don't reveal if email exists or not (security best practice)
                return Response({
                    'message': 'If an account with this email exists, a password reset link has been sent.',
                    'email_sent': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send password reset email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error sending password reset email: {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while sending password reset email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleAuthView(APIView):
    """Google OAuth authentication."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        import requests
        import json
        
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response({
                'error': 'ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify the Google ID token
            # Google's token info endpoint
            token_info_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}'
            response = requests.get(token_info_url, timeout=10)
            
            if response.status_code != 200:
                return Response({
                    'error': 'Invalid Google token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token_data = response.json()
            
            # Extract user information from token
            google_email = token_data.get('email')
            google_name = token_data.get('name', '')
            google_first_name = token_data.get('given_name', '')
            google_last_name = token_data.get('family_name', '')
            google_picture = token_data.get('picture', '')
            
            if not google_email:
                return Response({
                    'error': 'Email not provided by Google'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists
            try:
                user = User.objects.get(email=google_email)
                # Update user info if needed
                if google_first_name and not user.first_name:
                    user.first_name = google_first_name
                if google_last_name and not user.last_name:
                    user.last_name = google_last_name
                if google_picture and not user.profile_picture:
                    user.profile_picture = google_picture
                user.save()
            except User.DoesNotExist:
                # Create new user
                # Generate a random password (user won't need it for Google auth)
                import secrets
                random_password = secrets.token_urlsafe(32)
                
                # Split name if full name is provided but first/last are not
                if not google_first_name and google_name:
                    name_parts = google_name.split(' ', 1)
                    google_first_name = name_parts[0]
                    google_last_name = name_parts[1] if len(name_parts) > 1 else ''
                
                user = User.objects.create_user(
                    username=google_email,
                    email=google_email,
                    password=random_password,  # Random password, user will use Google to sign in
                    first_name=google_first_name or '',
                    last_name=google_last_name or '',
                    is_verified=True,  # Google emails are already verified
                    is_active=True
                )
                
                # Set profile picture if available
                if google_picture:
                    user.profile_picture = google_picture
                    user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            user_serializer = UserSerializer(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_serializer.data,
                'message': 'Google sign-in successful'
            }, status=status.HTTP_200_OK)
            
        except requests.RequestException as e:
            if settings.DEBUG:
                print(f"Error verifying Google token: {e}")
            return Response({
                'error': 'Failed to verify Google token'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error during Google authentication: {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred during Google authentication'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .utils import reset_password_with_token
        from django.db import OperationalError
        
        token = request.data.get('token')
        new_password = request.data.get('password') or request.data.get('new_password')
        
        if not token:
            return Response({
                'error': 'Reset token is required',
                'reset': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not new_password:
            return Response({
                'error': 'New password is required',
                'reset': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password length
        if len(new_password) < 6:
            return Response({
                'error': 'Password must be at least 6 characters long',
                'reset': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            success, user, message = reset_password_with_token(token, new_password)
            
            if success:
                user_serializer = UserSerializer(user)
                return Response({
                    'message': message,
                    'user': user_serializer.data,
                    'reset': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': message,
                    'reset': False
                }, status=status.HTTP_400_BAD_REQUEST)
        except OperationalError as e:
            # Database connection error
            if settings.DEBUG:
                print(f"Database connection error during password reset: {e}")
            return Response({
                'error': 'Database connection error. Please try again later.',
                'reset': False
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Catch any other unexpected errors
            if settings.DEBUG:
                print(f"Unexpected error during password reset: {e}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while resetting your password. Please try again.',
                'reset': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Verify if reset token is valid (for frontend to check before showing reset form)."""
        from .utils import verify_password_reset_token
        from .models import PasswordReset
        from django.utils import timezone
        from django.db import OperationalError
        
        token = request.query_params.get('token')
        
        if not token:
            return Response({
                'valid': False,
                'error': 'Reset token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check token details for better error messages
        try:
            password_reset = PasswordReset.objects.get(token=token)
            if password_reset.is_used:
                return Response({
                    'valid': False,
                    'error': 'This password reset link has already been used. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if password_reset.is_expired():
                return Response({
                    'valid': False,
                    'error': 'Password reset link has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except PasswordReset.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Invalid password reset link.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except OperationalError as e:
            # Database connection error
            if settings.DEBUG:
                print(f"Database connection error in password reset validation: {e}")
            return Response({
                'valid': False,
                'error': 'Database connection error. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Catch any other unexpected errors
            if settings.DEBUG:
                print(f"Unexpected error in password reset validation: {e}")
                import traceback
                traceback.print_exc()
            return Response({
                'valid': False,
                'error': 'An error occurred while validating the reset link. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Verify token using utility function
        try:
            success, user, message = verify_password_reset_token(token)
            
            if success:
                return Response({
                    'valid': True,
                    'message': message
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'valid': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
        except OperationalError as e:
            # Database connection error during verification
            if settings.DEBUG:
                print(f"Database connection error during token verification: {e}")
            return Response({
                'valid': False,
                'error': 'Database connection error. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Catch any other unexpected errors
            if settings.DEBUG:
                print(f"Unexpected error during token verification: {e}")
                import traceback
                traceback.print_exc()
            return Response({
                'valid': False,
                'error': 'An error occurred while validating the reset link. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
