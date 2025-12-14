"""
Listing-related views (vehicles/listings).
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum, Exists, OuterRef
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import traceback
import json
import os
from pathlib import Path

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)
from ..utils.image_utils import (
    validate_image_file, process_and_save_image,
    parse_images_data, combine_images, MAX_FILE_SIZE
)


class ListingListView(APIView):
    """List all listings or search listings with filters. Create new listings (POST requires authentication)."""
    permission_classes = [AllowAny]  # Default for GET
    
    def get(self, request):
        """List/search listings with filters."""
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
        partner_id = request.query_params.get('partner_id')
        search = request.query_params.get('search', '').strip()  # General search
        min_rating = request.query_params.get('min_rating')  # Minimum rating filter
        
        # Start with all available listings
        # If partner_id is provided, don't filter by is_available (show all partner's vehicles)
        # Otherwise, only show available listings
        if partner_id:
            try:
                partner_id_int = int(partner_id)
                # Verify partner exists before filtering
                try:
                    Partner.objects.get(pk=partner_id_int)
                    queryset = Listing.objects.filter(partner_id=partner_id_int)
                except Partner.DoesNotExist:
                    # Partner doesn't exist, return empty result with 200 status
                    # (not 404, as the endpoint itself exists)
                    return Response({
                        'data': [],
                        'count': 0,
                        'total_count': 0,
                        'page': 1,
                        'page_size': 20,
                        'total_pages': 0,
                        'message': f'Partner with id {partner_id_int} not found'
                    }, status=status.HTTP_200_OK)
            except (ValueError, TypeError):
                queryset = Listing.objects.filter(is_available=True)
        else:
            queryset = Listing.objects.filter(is_available=True)
        
        # Apply filters
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        if min_price:
            try:
                min_price_float = float(min_price)
                if min_price_float >= 0:
                    queryset = queryset.filter(price_per_day__gte=min_price_float)
            except (ValueError, TypeError):
                pass
        
        if max_price:
            try:
                max_price_float = float(max_price)
                if max_price_float > 0:
                    queryset = queryset.filter(price_per_day__lte=max_price_float)
            except (ValueError, TypeError):
                pass
        
        # Instant booking filter
        instant_booking = request.query_params.get('instant_booking')
        if instant_booking == 'true':
            queryset = queryset.filter(instant_booking=True)
        
        # General search (make, model, description)
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(make__icontains=search) |
                Q(model__icontains=search) |
                Q(vehicle_description__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Minimum rating filter
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            try:
                min_rating_float = float(min_rating)
                if 0 <= min_rating_float <= 5:
                    queryset = queryset.filter(rating__gte=min_rating_float)
            except (ValueError, TypeError):
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
        
        # Filter by date availability (exclude listings with conflicting bookings)
        if pickup_date and return_date:
            try:
                pickup = datetime.strptime(pickup_date, '%Y-%m-%d').date()
                return_d = datetime.strptime(return_date, '%Y-%m-%d').date()
                
                # Validate dates
                today = timezone.now().date()
                if pickup < today:
                    return Response({
                        'error': 'Pickup date cannot be in the past',
                        'data': [],
                        'count': 0
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if return_d <= pickup:
                    return Response({
                        'error': 'Return date must be after pickup date',
                        'data': [],
                        'count': 0
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Get listings that have bookings overlapping with the requested dates
                # Optimized: Use a subquery with Exists instead of values_list to avoid loading all IDs into memory
                conflicting_bookings = Booking.objects.filter(
                    listing=OuterRef('pk'),
                    status__in=['pending', 'confirmed', 'active'],
                    pickup_date__lt=return_d,
                    return_date__gt=pickup
                )
                
                # Exclude listings with conflicting bookings using Exists for better performance
                queryset = queryset.exclude(Exists(conflicting_bookings))
            except ValueError:
                # Invalid date format, ignore date filtering
                pass
        
        try:
            # Optimize query with select_related and prefetch_related
            # Only prefetch reviews if needed (they're used in serializer)
            queryset = queryset.select_related('partner', 'partner__user').prefetch_related('reviews')
            
            # Use only() to limit fields fetched from database (if not needed, comment out)
            # queryset = queryset.only('id', 'make', 'model', 'year', 'price_per_day', 'location', 
            #                         'images', 'rating', 'review_count', 'is_available', 'is_verified',
            #                         'partner_id', 'transmission', 'fuel_type', 'seating_capacity', 
            #                         'vehicle_style', 'created_at')
            
            # Sorting
            sort_by = request.query_params.get('sort', '-created_at')
            valid_sorts = ['created_at', '-created_at', 'price_per_day', '-price_per_day', 
                          'rating', '-rating', 'review_count', '-review_count']
            if sort_by in valid_sorts:
                queryset = queryset.order_by(sort_by)
            else:
                queryset = queryset.order_by('-created_at')
            
            # Pagination - do count before slicing for better performance
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 50)  # Reduced max page size from 100 to 50 for better performance
            
            # Use exists() check first if we only need to know if there are results
            # For count, use a more efficient method if possible
            total_count = queryset.count()
            
            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size
            queryset = queryset[start:end]
            
            # Serialize the results - use iterator() for large querysets to reduce memory
            serializer = ListingSerializer(queryset, many=True, context={'request': request})
            
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
            }, status=status.HTTP_200_OK)
            
        except OperationalError as db_err:
            # Handle database connection errors
            if settings.DEBUG:
                print(f"Database error in ListingListView: {db_err}")
            return Response({
                'data': [],
                'count': 0,
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Handle other errors
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ListingListView: {error_msg}")
                traceback.print_exc()
            return Response({
                'data': [],
                'count': 0,
                'error': f'An error occurred while fetching listings: {error_msg}' if settings.DEBUG else 'An error occurred while fetching listings',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new listing (vehicle)."""
        # Check authentication
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to create listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Get partner profile
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found. Please complete your partner profile first.',
                    'message': 'You must have a partner profile to create listings'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Prepare listing data
            listing_data = request.data.copy()
            listing_data['partner_id'] = partner.id
            
            # Convert FormData string values to proper types
            # FormData sends everything as strings, so we need to convert numbers
            if 'year' in listing_data and isinstance(listing_data['year'], str):
                try:
                    listing_data['year'] = int(listing_data['year'])
                except (ValueError, TypeError):
                    pass  # Keep as string if conversion fails, serializer will handle validation
            
            if 'price_per_day' in listing_data and isinstance(listing_data['price_per_day'], str):
                try:
                    listing_data['price_per_day'] = float(listing_data['price_per_day'])
                except (ValueError, TypeError):
                    pass
            
            if 'seating_capacity' in listing_data and isinstance(listing_data['seating_capacity'], str):
                try:
                    listing_data['seating_capacity'] = int(listing_data['seating_capacity'])
                except (ValueError, TypeError):
                    pass
            
            if 'is_available' in listing_data and isinstance(listing_data['is_available'], str):
                listing_data['is_available'] = listing_data['is_available'].lower() in ('true', '1', 'yes')
            
            if 'instant_booking' in listing_data and isinstance(listing_data['instant_booking'], str):
                listing_data['instant_booking'] = listing_data['instant_booking'].lower() in ('true', '1', 'yes')
            
            # Validate required fields
            required_fields = ['make', 'model', 'year', 'price_per_day', 'location']
            missing_fields = [field for field in required_fields if not listing_data.get(field)]
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}',
                    'message': 'Please provide all required vehicle information'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle image file uploads from FormData
            uploaded_images = []
            image_errors = []
            
            # Debug: Log what we received
            if settings.DEBUG:
                print(f"📥 POST /listings/ - Received request data keys: {list(request.data.keys())}")
                print(f"📁 POST /listings/ - Received FILES keys: {list(request.FILES.keys())}")
                print(f"📋 POST /listings/ - Content-Type: {request.content_type}")
            
            # Process uploaded files (from 'pictures' field in FormData)
            # Optimized: Skip separate validation, process_and_save_image does lightweight validation
            if 'pictures' in request.FILES:
                # Handle single file or multiple files
                files = request.FILES.getlist('pictures')
                # Limit to 5 images max to prevent timeout
                max_images = 5
                if len(files) > max_images:
                    image_errors.append(f"Maximum {max_images} images allowed. You uploaded {len(files)}.")
                    files = files[:max_images]
                
                if settings.DEBUG:
                    print(f"📸 POST /listings/ - Found {len(files)} picture file(s) to upload")
                
                for file in files:
                    try:
                        # Quick basic validation (file size only - skip full validation for speed)
                        if file.size > MAX_FILE_SIZE:
                            image_errors.append(f"{file.name}: File too large (max {MAX_FILE_SIZE / (1024 * 1024):.1f}MB)")
                            continue
                        
                        # Process and save image (includes validation)
                        image_info = process_and_save_image(file, upload_dir='listings')
                        uploaded_images.append({
                            'url': image_info['url'],
                            'name': image_info['name']
                        })
                        
                        if settings.DEBUG:
                            print(f"✓ Saved image: {image_info['url']}")
                    except ValueError as e:
                        # Validation error
                        image_errors.append(f"{file.name}: {str(e)}")
                        if settings.DEBUG:
                            print(f"❌ Validation error for {file.name}: {str(e)}")
                    except Exception as e:
                        # Other errors
                        error_msg = f"Error processing {file.name}: {str(e)}"
                        image_errors.append(error_msg)
                        if settings.DEBUG:
                            print(f"❌ {error_msg}")
                        traceback.print_exc()
            
            # Handle existing images from JSON (if provided as JSON string or array)
            # Remove 'images' from listing_data first to avoid serializer validation issues
            # We'll set it properly after processing
            images_data = listing_data.pop('images', [])
            existing_images = parse_images_data(images_data)
            
            # Combine uploaded images with existing images
            all_images = combine_images(uploaded_images, existing_images)
            
            # If there were image errors but we have some valid images, include them in the response
            # If all images failed, return an error
            if image_errors and len(uploaded_images) == 0 and len(existing_images) == 0:
                return Response({
                    'error': 'Image upload failed',
                    'message': 'All image files failed validation',
                    'errors': {'images': image_errors}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set images as a list (serializer expects JSON-serializable data)
            listing_data['images'] = all_images
            
            # Store image errors for potential warning in response
            if image_errors and settings.DEBUG:
                print(f"⚠️ Some images failed: {image_errors}")
            
            if settings.DEBUG:
                print(f"📸 Image summary - Uploaded: {len(uploaded_images)}, Existing: {len(existing_images)}, Total: {len(all_images)}")
                if all_images:
                    print(f"📸 Image URLs: {[img.get('url', img) if isinstance(img, dict) else img for img in all_images]}")
            
            # Validate and create listing
            serializer = ListingSerializer(data=listing_data, context={'request': request})
            
            if settings.DEBUG:
                print(f"🔍 POST /listings/ - Serializer data keys: {list(listing_data.keys())}")
                print(f"🔍 POST /listings/ - Images data: {listing_data.get('images', [])}")
            
            if serializer.is_valid():
                if settings.DEBUG:
                    print(f"✅ POST /listings/ - Serializer is valid, saving...")
                listing = serializer.save()
                if settings.DEBUG:
                    print(f"✅ POST /listings/ - Listing saved with ID: {listing.id}")
                return Response({
                    'data': ListingSerializer(listing, context={'request': request}).data,
                    'message': 'Listing created successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                if settings.DEBUG:
                    print(f"❌ POST /listings/ - Serializer validation failed: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"❌ POST /listings/ - Exception: {error_msg}")
                traceback.print_exc()
            else:
                # Even in production, log to stderr
                import sys
                print(f"❌ POST /listings/ - Exception: {error_msg}", file=sys.stderr)
                traceback.print_exc(file=sys.stderr)
            return Response({
                'error': 'An error occurred while creating the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListingDetailView(APIView):
    """Retrieve, update or delete a listing instance."""
    permission_classes = [AllowAny]  # GET is public
    
    def get(self, request, pk):
        """Retrieve a listing by ID."""
        try:
            # Test database connection first
            from django.db import connection
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'error': 'Database connection error. Please try again later.',
                    'message': 'Service temporarily unavailable'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            try:
                listing = Listing.objects.select_related('partner', 'partner__user').get(pk=pk)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ListingSerializer(listing, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Listing retrieved successfully'
            }, status=status.HTTP_200_OK)
            
        except OperationalError:
            return Response({
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ListingDetailView: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while fetching the listing',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, pk):
        """Update a listing (full update)."""
        return self._update_listing(request, pk, partial=False)
    
    def patch(self, request, pk):
        """Update a listing (partial update)."""
        return self._update_listing(request, pk, partial=True)
    
    def _update_listing(self, request, pk, partial=True):
        """Internal method to update a listing."""
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to update listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            listing = Listing.objects.get(pk=pk)
            
            # Check permissions
            try:
                partner = Partner.objects.get(user=request.user)
                if listing.partner != partner:
                    return Response({
                        'error': 'Permission denied',
                        'message': 'You can only update your own listings'
                    }, status=status.HTTP_403_FORBIDDEN)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found',
                    'message': 'You must have a partner profile to update listings'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Handle image file uploads from FormData
            uploaded_images = []
            image_errors = []
            
            # Process uploaded files (from 'pictures' field in FormData)
            # Optimized: Skip separate validation, process_and_save_image does lightweight validation
            if 'pictures' in request.FILES:
                # Handle single file or multiple files
                files = request.FILES.getlist('pictures')
                # Limit to 5 images max to prevent timeout
                max_images = 5
                if len(files) > max_images:
                    image_errors.append(f"Maximum {max_images} images allowed. You uploaded {len(files)}.")
                    files = files[:max_images]
                
                for file in files:
                    try:
                        # Quick basic validation (file size and type only)
                        if file.size > MAX_FILE_SIZE:
                            image_errors.append(f"{file.name}: File too large (max {MAX_FILE_SIZE / (1024 * 1024):.1f}MB)")
                            continue
                        
                        # Process and save image (includes validation)
                        image_info = process_and_save_image(file, upload_dir='listings')
                        uploaded_images.append({
                            'url': image_info['url'],
                            'name': image_info['name']
                        })
                        
                        if settings.DEBUG:
                            print(f"✓ Saved image: {image_info['url']}")
                    except ValueError as e:
                        # Validation error
                        image_errors.append(f"{file.name}: {str(e)}")
                        if settings.DEBUG:
                            print(f"❌ Validation error for {file.name}: {str(e)}")
                    except Exception as e:
                        # Other errors
                        error_msg = f"Error processing {file.name}: {str(e)}"
                        image_errors.append(error_msg)
                        if settings.DEBUG:
                            print(f"❌ {error_msg}")
                        traceback.print_exc()
            
            # Prepare listing data
            listing_data = request.data.copy()
            
            # Handle existing images from JSON (if provided as JSON string or array)
            # Remove 'images' from listing_data first to avoid serializer validation issues
            images_data = listing_data.pop('images', [])
            existing_images = parse_images_data(images_data)
            
            # Combine uploaded images with existing images
            # If new files were uploaded, add them to existing images
            if uploaded_images:
                all_images = combine_images(uploaded_images, existing_images)
            else:
                # If no new uploads, keep existing images as-is (or update if provided)
                all_images = existing_images if existing_images else listing.images
            
            # If there were image errors but we have some valid images, include them in the response
            # If all images failed, return an error
            if image_errors and len(uploaded_images) == 0 and len(existing_images) == 0:
                return Response({
                    'error': 'Image upload failed',
                    'message': 'All image files failed validation',
                    'errors': {'images': image_errors}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set images as a list (serializer expects JSON-serializable data)
            listing_data['images'] = all_images
            
            # Store image errors for potential warning in response
            if image_errors and settings.DEBUG:
                print(f"⚠️ Some images failed: {image_errors}")
            
            serializer = ListingSerializer(
                listing,
                data=listing_data,
                partial=partial,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'data': serializer.data,
                    'message': 'Listing updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ListingDetailView.put: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while updating the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, pk):
        """Delete a listing."""
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to delete listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            listing = Listing.objects.get(pk=pk)
            
            # Check permissions
            try:
                partner = Partner.objects.get(user=request.user)
                if listing.partner != partner:
                    return Response({
                        'error': 'Permission denied',
                        'message': 'You can only delete your own listings'
                    }, status=status.HTTP_403_FORBIDDEN)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found',
                    'message': 'You must have a partner profile to delete listings'
                }, status=status.HTTP_403_FORBIDDEN)
            
            listing.delete()
            return Response({
                'message': 'Listing deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ListingDetailView.delete: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while deleting the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

