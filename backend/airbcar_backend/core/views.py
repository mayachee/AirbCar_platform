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
            if DEBUG:
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
            if DEBUG:
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
            if not user.check_password(password):
                user = None
        except User.DoesNotExist:
            # Try to authenticate with email as username (for backward compatibility)
            user = authenticate(username=email, password=password)
        
        # If still None, try username field
        if user is None:
            try:
                user = User.objects.get(username=email)
                if not user.check_password(password):
                    user = None
            except User.DoesNotExist:
                pass
        
        if user is None:
            return Response({
                'error': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is active
        if not user.is_active:
            return Response({
                'error': 'Account is disabled. Please contact support.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)
        
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
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'customer')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        
        user_serializer = UserSerializer(user)
        
        return Response({
            'data': user_serializer.data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)


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
