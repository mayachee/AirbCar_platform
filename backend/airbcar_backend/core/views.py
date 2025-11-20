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
        try:
            # Ensure database connection is active
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'data': [],
                    'favorites': [],
                    'listings': [],
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Limit results and optimize query to prevent timeout
            favorites = Favorite.objects.filter(user=request.user).select_related(
                'listing', 
                'listing__partner'
            )[:50]  # Limit to 50 favorites to prevent timeout
            
            serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
            
            # Return in format expected by frontend
            favorites_data = serializer.data
            
            return Response({
                'data': favorites_data,
                'favorites': favorites_data,  # Alternative format
                'listings': [fav['listing'] for fav in favorites_data if fav.get('listing')],
                'message': 'Favorites retrieved successfully'
            })
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ FavoriteListView Error: {str(e)}")
                traceback.print_exc()
            
            # Return empty arrays instead of error to prevent page crash
            return Response({
                'data': [],
                'favorites': [],
                'listings': [],
                'error': 'Failed to load favorites. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_200_OK)  # Return 200 with empty data instead of 500
    
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


class MyFavoritesView(APIView):
    """Get current user's favorites with full listing details."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all favorites for the current user with full listing details."""
        try:
            # Ensure database connection is active
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'favorites': [],
                    'listings': [],
                    'data': [],
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Limit results and optimize query to prevent timeout
            favorites = Favorite.objects.filter(user=request.user).select_related(
                'listing', 
                'listing__partner',
                'listing__partner__user'
            )[:50]  # Limit to 50 favorites to prevent timeout
            
            serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
            favorites_data = serializer.data
            
            # Extract listings from favorites safely
            listings = []
            for fav in favorites_data:
                if fav and isinstance(fav, dict) and fav.get('listing'):
                    listings.append(fav['listing'])
            
            return Response({
                'favorites': favorites_data,
                'listings': listings,
                'data': favorites_data,
                'message': 'Favorites retrieved successfully'
            })
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ MyFavoritesView Error: {str(e)}")
                traceback.print_exc()
            
            # Return empty arrays instead of error to prevent page crash
            return Response({
                'favorites': [],
                'listings': [],
                'data': [],
                'error': 'Failed to load favorites. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_200_OK)  # Return 200 with empty data instead of 500
    
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
        """Delete a favorite by its ID."""
        try:
            # Ensure database connection is active
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Try to get the favorite - check if it exists and belongs to the user
            try:
                favorite = Favorite.objects.get(pk=pk, user=request.user)
            except Favorite.DoesNotExist:
                # Check if favorite exists but belongs to another user
                if Favorite.objects.filter(pk=pk).exists():
                    return Response({
                        'error': 'Favorite not found or you do not have permission to delete it'
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    return Response({
                        'error': 'Favorite not found'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Delete the favorite
            favorite_id = favorite.id
            favorite.delete()
            
            if settings.DEBUG:
                print(f"✅ Favorite {favorite_id} deleted successfully for user {request.user.username}")
            
            return Response({
                'message': 'Favorite removed successfully',
                'id': favorite_id
            }, status=status.HTTP_200_OK)  # Changed from 204 to 200 to include message
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ FavoriteDetailView.delete Error: {str(e)}")
                traceback.print_exc()
            
            return Response({
                'error': 'Failed to delete favorite. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Change password for authenticated user."""
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Both old_password and new_password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(old_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        if len(new_password) < 8:
            return Response({
                'error': 'New password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class ReviewListView(APIView):
    """List reviews with optional filters."""
    permission_classes = [AllowAny]  # Allow anyone to view reviews
    
    def get(self, request):
        """Get reviews with optional filters."""
        listing_id = request.query_params.get('listing')
        sort = request.query_params.get('sort', 'newest')  # newest, oldest, highest, lowest
        rating = request.query_params.get('rating')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        search = request.query_params.get('search')
        my_listings = request.query_params.get('my_listings') == 'true'
        
        queryset = Review.objects.filter(is_published=True)
        
        # Filter by listing
        if listing_id:
            queryset = queryset.filter(listing_id=listing_id)
        
        # Filter by rating
        if rating:
            try:
                rating_int = int(rating)
                queryset = queryset.filter(rating=rating_int)
            except ValueError:
                pass
        
        # Filter by user's listings (for partners)
        if my_listings and request.user.is_authenticated and request.user.role == 'partner':
            try:
                partner = request.user.partner_profile
                partner_listing_ids = Listing.objects.filter(partner=partner).values_list('id', flat=True)
                queryset = queryset.filter(listing_id__in=partner_listing_ids)
            except Partner.DoesNotExist:
                queryset = queryset.none()
        
        # Search in comments
        if search:
            queryset = queryset.filter(comment__icontains=search)
        
        # Sort
        if sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort == 'highest':
            queryset = queryset.order_by('-rating', '-created_at')
        elif sort == 'lowest':
            queryset = queryset.order_by('rating', '-created_at')
        
        # Pagination
        start = (page - 1) * limit
        end = start + limit
        reviews = queryset[start:end]
        
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        
        return Response({
            'data': serializer.data,
            'count': queryset.count(),
            'page': page,
            'limit': limit,
            'has_more': end < queryset.count()
        })


class CanReviewView(APIView):
    """Check if user can review a listing."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check if current user can review a listing."""
        listing_id = request.query_params.get('listing')
        booking_id = request.query_params.get('booking')
        
        if not listing_id:
            return Response({
                'error': 'Listing ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        
        # Check if user already reviewed this listing
        existing_review = Review.objects.filter(listing=listing, user=user).first()
        if existing_review:
            return Response({
                'can_review': False,
                'reason': 'You have already reviewed this listing',
                'has_completed_booking': False,
                'existing_review_id': existing_review.id
            })
        
        # Check if user has a completed booking for this listing
        has_completed_booking = Booking.objects.filter(
            listing=listing,
            customer=user,
            status='completed'
        ).exists()
        
        # If booking_id is provided, check if it's a valid completed booking
        if booking_id:
            try:
                booking = Booking.objects.get(
                    pk=booking_id,
                    listing=listing,
                    customer=user,
                    status='completed'
                )
                return Response({
                    'can_review': True,
                    'has_completed_booking': True,
                    'booking_id': booking.id
                })
            except Booking.DoesNotExist:
                return Response({
                    'can_review': False,
                    'reason': 'Invalid or incomplete booking',
                    'has_completed_booking': False
                })
        
        # If no booking_id, check if user has any completed booking
        if has_completed_booking:
            return Response({
                'can_review': True,
                'has_completed_booking': True
            })
        
        return Response({
            'can_review': False,
            'reason': 'You must complete a booking before reviewing',
            'has_completed_booking': False
        })


class UserMeView(APIView):
    """Get, create/update, and delete current user profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user profile."""
        user = request.user
        if settings.DEBUG:
            print(f"🔍 UserMeView GET - User: {user.username}, Email: {user.email}")
            print(f"📋 User fields - first_name: {user.first_name}, last_name: {user.last_name}, phone: {user.phone_number}")
        
        serializer = UserSerializer(user, context={'request': request})
        serialized_data = serializer.data
        
        if settings.DEBUG:
            print(f"📤 Serialized data keys: {list(serialized_data.keys())}")
            print(f"📤 Profile picture: {serialized_data.get('profile_picture_url')}")
        
        return Response({
            'data': serialized_data
        })
    
    def post(self, request):
        """Create or fully update current user profile (full update, not partial)."""
        user = request.user
        
        # Handle file uploads to Supabase
        from .supabase_storage import upload_file_to_supabase, generate_file_path, delete_file_from_supabase
        
        # Process id_front_document if provided
        if 'id_front_document' in request.FILES:
            file = request.FILES['id_front_document']
            # Delete old file from Supabase if exists
            if user.id_front_document_url:
                old_url = user.id_front_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'identity_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['id_front_document_url'] = supabase_url
                request.data['id_front_document'] = None  # Clear local file
                request.data._mutable = False
        
        # Process id_back_document if provided
        if 'id_back_document' in request.FILES:
            file = request.FILES['id_back_document']
            # Delete old file from Supabase if exists
            if user.id_back_document_url:
                old_url = user.id_back_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'identity_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['id_back_document_url'] = supabase_url
                request.data['id_back_document'] = None  # Clear local file
                request.data._mutable = False
        
        # Process license_front_document if provided
        if 'license_front_document' in request.FILES:
            file = request.FILES['license_front_document']
            # Delete old file from Supabase if exists
            if user.license_front_document_url:
                old_url = user.license_front_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'license_documents')
            supabase_url = upload_file_to_supabase(file, 'identity-documents', file_path)
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_front_document_url'] = supabase_url
                request.data['license_front_document'] = None  # Clear local file
                request.data._mutable = False
        
        # Process license_back_document if provided
        if 'license_back_document' in request.FILES:
            file = request.FILES['license_back_document']
            # Delete old file from Supabase if exists
            if user.license_back_document_url:
                old_url = user.license_back_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'license_documents')
            supabase_url = upload_file_to_supabase(file, 'identity-documents', file_path)
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_back_document_url'] = supabase_url
                request.data['license_back_document'] = None  # Clear local file
                request.data._mutable = False
        
        serializer = UserSerializer(user, data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'data': serializer.data,
                'message': 'Profile created/updated successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """Partially update current user profile."""
        user = request.user
        
        # Handle file uploads to Supabase
        from .supabase_storage import upload_file_to_supabase, generate_file_path, delete_file_from_supabase
        
        # Process id_front_document if provided
        if 'id_front_document' in request.FILES:
            file = request.FILES['id_front_document']
            # Delete old file from Supabase if exists
            if user.id_front_document_url:
                old_url = user.id_front_document_url
                if 'storage/v1/object/public' in old_url:
                    # Extract path from Supabase URL
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'identity_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',  # Bucket name
                file_path,
                file.content_type
            )
            
            if supabase_url:
                # Store the Supabase URL in the dedicated URL field
                request.data._mutable = True
                request.data['id_front_document_url'] = supabase_url
                # Clear the local file field
                request.data['id_front_document'] = None
                request.data._mutable = False
        
        # Process id_back_document if provided
        if 'id_back_document' in request.FILES:
            file = request.FILES['id_back_document']
            # Delete old file from Supabase if exists
            if user.id_back_document_url:
                old_url = user.id_back_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'identity_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['id_back_document_url'] = supabase_url
                request.data['id_back_document'] = None  # Clear local file
                request.data._mutable = False
        
        # Process license_front_document if provided
        if 'license_front_document' in request.FILES:
            file = request.FILES['license_front_document']
            # Delete old file from Supabase if exists
            if user.license_front_document_url:
                old_url = user.license_front_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'license_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_front_document_url'] = supabase_url
                request.data['license_front_document'] = None
                request.data._mutable = False
        
        # Process license_back_document if provided
        if 'license_back_document' in request.FILES:
            file = request.FILES['license_back_document']
            # Delete old file from Supabase if exists
            if user.license_back_document_url:
                old_url = user.license_back_document_url
                if 'storage/v1/object/public' in old_url:
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        delete_file_from_supabase(bucket_name, file_path)
            
            # Upload new file to Supabase
            file_path = generate_file_path(user.id, file.name, 'license_documents')
            supabase_url = upload_file_to_supabase(
                file,
                'identity-documents',
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_back_document_url'] = supabase_url
                request.data['license_back_document'] = None
                request.data._mutable = False
        
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'data': serializer.data,
                'message': 'Profile updated successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """Fully update current user profile (same as POST)."""
        return self.post(request)
    
    def delete(self, request):
        """Delete current user account."""
        user = request.user
        try:
            # Soft delete: deactivate the account instead of deleting
            user.is_active = False
            user.save()
            return Response({
                'message': 'Account deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Failed to delete account: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStatsView(APIView):
    """Get current user statistics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get statistics for the current user."""
        try:
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            user = request.user
            now = timezone.now().date()
            
            # Get bookings count
            bookings = Booking.objects.filter(customer=user)
            total_bookings = bookings.count()
            
            # Calculate upcoming and past bookings
            upcoming_bookings = bookings.filter(pickup_date__gte=now).count()
            past_bookings = bookings.filter(pickup_date__lt=now).count()
            
            # Count by status
            pending_bookings = bookings.filter(status='pending').count()
            completed_bookings = bookings.filter(status='completed').count()
            
            # Get favorites count
            total_favorites = Favorite.objects.filter(user=user).count()
            
            return Response({
                'total_bookings': total_bookings,
                'upcoming_bookings': upcoming_bookings,
                'past_bookings': past_bookings,
                'pending_bookings': pending_bookings,
                'completed_bookings': completed_bookings,
                'total_favorites': total_favorites
            })
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ UserStatsView Error: {str(e)}")
                traceback.print_exc()
            
            # Return default stats on error
            return Response({
                'total_bookings': 0,
                'upcoming_bookings': 0,
                'past_bookings': 0,
                'pending_bookings': 0,
                'completed_bookings': 0,
                'total_favorites': 0,
                'error': 'Failed to load statistics. Please try again later.'
            }, status=status.HTTP_200_OK)


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
        try:
            # Ensure database connection is active
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'data': [],
                    'count': 0,
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Users see their own bookings, partners see their listings' bookings, admins see all
            # Use select_related to optimize queries and limit results to prevent timeout
            # Reduced limit to 50 for better performance
            if request.user.role == 'admin':
                bookings = Booking.objects.all().select_related('listing', 'customer', 'partner').order_by('-created_at')[:50]
            elif request.user.role == 'partner':
                try:
                    partner = request.user.partner_profile
                    bookings = Booking.objects.filter(partner=partner).select_related('listing', 'customer', 'partner').order_by('-created_at')[:50]
                except Partner.DoesNotExist:
                    bookings = Booking.objects.none()
            else:
                bookings = Booking.objects.filter(customer=request.user).select_related('listing', 'customer', 'partner').order_by('-created_at')[:50]
            
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data)
            })
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingListView Error: {str(e)}")
                traceback.print_exc()
            
            # Return empty array instead of error to prevent page crash
            return Response({
                'data': [],
                'error': 'Failed to load bookings. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_200_OK)  # Return 200 with empty data instead of 500
    
    def post(self, request):
        """Create a new booking."""
        listing_id = request.data.get('listing_id') or request.data.get('listing') or request.data.get('vehicleId')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id, is_available=True)
            
            # Handle file uploads to Supabase
            from .supabase_storage import upload_file_to_supabase, generate_file_path
            
            # Process id_front_document if provided
            id_front_document_url = None
            if 'id_front_document' in request.FILES:
                file = request.FILES['id_front_document']
                file_path = generate_file_path(request.user.id, file.name, 'booking_documents')
                supabase_url = upload_file_to_supabase(
                    file,
                    'identity-documents',
                    file_path,
                    file.content_type
                )
                if supabase_url:
                    id_front_document_url = supabase_url
            
            # Process id_back_document if provided
            id_back_document_url = None
            if 'id_back_document' in request.FILES:
                file = request.FILES['id_back_document']
                file_path = generate_file_path(request.user.id, file.name, 'booking_documents')
                supabase_url = upload_file_to_supabase(
                    file,
                    'identity-documents',
                    file_path,
                    file.content_type
                )
                if supabase_url:
                    id_back_document_url = supabase_url
            
            # Parse dates - try multiple parameter names
            pickup_date_str = (
                request.data.get('pickup_date') or 
                request.data.get('pickupDate') or 
                request.data.get('pickup_date') or
                request.data.get('start_date')
            )
            return_date_str = (
                request.data.get('return_date') or 
                request.data.get('returnDate') or 
                request.data.get('return_date') or
                request.data.get('end_date')
            )
            
            # Also check start_time and end_time for dates (they might contain full datetime)
            if not pickup_date_str:
                start_time_str = request.data.get('start_time') or request.data.get('startTime')
                if start_time_str:
                    pickup_date_str = start_time_str.split('T')[0] if 'T' in start_time_str else start_time_str
            
            if not return_date_str:
                end_time_str = request.data.get('end_time') or request.data.get('endTime')
                if end_time_str:
                    return_date_str = end_time_str.split('T')[0] if 'T' in end_time_str else end_time_str
            
            # Handle datetime strings (ISO format)
            from datetime import datetime
            pickup_date = None
            return_date = None
            
            if pickup_date_str:
                try:
                    # Try parsing as ISO datetime first
                    if 'T' in str(pickup_date_str):
                        pickup_date = datetime.fromisoformat(str(pickup_date_str).replace('Z', '+00:00')).date()
                    else:
                        # Try different date formats
                        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']:
                            try:
                                pickup_date = datetime.strptime(str(pickup_date_str), fmt).date()
                                break
                            except ValueError:
                                continue
                except (ValueError, AttributeError) as e:
                    if settings.DEBUG:
                        print(f"❌ Error parsing pickup_date: {pickup_date_str}, error: {e}")
            
            if return_date_str:
                try:
                    # Try parsing as ISO datetime first
                    if 'T' in str(return_date_str):
                        return_date = datetime.fromisoformat(str(return_date_str).replace('Z', '+00:00')).date()
                    else:
                        # Try different date formats
                        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']:
                            try:
                                return_date = datetime.strptime(str(return_date_str), fmt).date()
                                break
                            except ValueError:
                                continue
                except (ValueError, AttributeError) as e:
                    if settings.DEBUG:
                        print(f"❌ Error parsing return_date: {return_date_str}, error: {e}")
            
            # Validate that dates are present
            if not pickup_date or not return_date:
                return Response({
                    'error': 'pickup_date and return_date are required. Please provide valid dates.',
                    'details': {
                        'pickup_date_received': pickup_date_str,
                        'return_date_received': return_date_str,
                        'pickup_date_parsed': str(pickup_date) if pickup_date else None,
                        'return_date_parsed': str(return_date) if return_date else None
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse times from datetime strings or use defaults
            pickup_time_str = request.data.get('pickup_time') or request.data.get('start_time')
            return_time_str = request.data.get('return_time') or request.data.get('end_time')
            
            from django.utils.dateparse import parse_time
            pickup_time = parse_time(pickup_time_str) if pickup_time_str else None
            return_time = parse_time(return_time_str) if return_time_str else None
            
            # Get payment method (default to 'online' if not provided)
            payment_method = request.data.get('payment_method') or request.data.get('paymentMethod') or 'online'
            # Validate payment method
            if payment_method not in ['online', 'cash']:
                payment_method = 'online'  # Default to online if invalid
            
            # Create booking
            booking = Booking.objects.create(
                listing=listing,
                customer=request.user,
                partner=listing.partner,
                pickup_date=pickup_date,
                return_date=return_date,
                pickup_time=pickup_time or datetime.strptime('10:00:00', '%H:%M:%S').time(),
                return_time=return_time or datetime.strptime('18:00:00', '%H:%M:%S').time(),
                pickup_location=request.data.get('pickup_location', listing.location),
                return_location=request.data.get('return_location', listing.location),
                total_amount=request.data.get('total_amount') or request.data.get('price') or listing.price_per_day,
                special_requests=request.data.get('special_requests') or request.data.get('request_message', ''),
                payment_method=payment_method,
                id_front_document_url=id_front_document_url,
                id_back_document_url=id_back_document_url
            )
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking created successfully'
            }, status=status.HTTP_201_CREATED)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found or not available'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingListView.post Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': f'Failed to create booking: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
