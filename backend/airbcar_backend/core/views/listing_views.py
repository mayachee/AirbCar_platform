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
import time
import signal
from pathlib import Path

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset, Notification
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
        color = request.query_params.get('color')  # Color filter
        year_min = request.query_params.get('year_min')  # Minimum year
        year_max = request.query_params.get('year_max')  # Maximum year
        
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
        
        # General search (make, model, description, location) - Enhanced with better matching
        search = request.query_params.get('search', '').strip()
        if search:
            # Split search into words for better matching
            search_terms = search.split()
            search_query = Q()
            for term in search_terms:
                search_query |= (
                    Q(make__icontains=term) |
                    Q(model__icontains=term) |
                    Q(vehicle_description__icontains=term) |
                    Q(location__icontains=term) |
                    Q(color__icontains=term) |
                    Q(vehicle_style__icontains=term)
                )
            queryset = queryset.filter(search_query)
        
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
        
        # Color filter
        if color:
            colors = [c.strip() for c in color.split(',')]
            queryset = queryset.filter(color__in=colors)
        
        # Year range filter
        if year_min:
            try:
                year_min_int = int(year_min)
                if year_min_int >= 1900:
                    queryset = queryset.filter(year__gte=year_min_int)
            except (ValueError, TypeError):
                pass
        
        if year_max:
            try:
                year_max_int = int(year_max)
                current_year = timezone.now().year
                if year_max_int <= current_year + 1:
                    queryset = queryset.filter(year__lte=year_max_int)
            except (ValueError, TypeError):
                pass
        
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
            
            # Additional optimization: Use distinct() if there might be duplicates
            # (e.g., from joins or filters)
            queryset = queryset.distinct()
            
            # Sorting - Enhanced with more options
            sort_by = request.query_params.get('sort', '-created_at')
            valid_sorts = [
                'created_at', '-created_at', 
                'price_per_day', '-price_per_day', 
                'rating', '-rating', 
                'review_count', '-review_count',
                'year', '-year',
                'make', '-make',
                'model', '-model',
                'updated_at', '-updated_at'
            ]
            if sort_by in valid_sorts:
                queryset = queryset.order_by(sort_by)
            else:
                # Default: newest first, then by rating
                queryset = queryset.order_by('-created_at', '-rating')
            
            # Pagination - do count before slicing for better performance
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            # Increased limit to support "fetch all" strategy for client-side filtering
            # page_size = min(page_size, 50) 
            if page_size > 1000:
                page_size = 1000

            
            # Use exists() check first if we only need to know if there are results
            # For count, use a more efficient method if possible
            total_count = queryset.count()
            
            # Calculate summary statistics BEFORE pagination (aggregates don't work on sliced querysets)
            price_stats = {}
            if total_count > 0:
                from django.db.models import Min, Max, Avg
                try:
                    price_aggregates = queryset.aggregate(
                        min_price=Min('price_per_day'),
                        max_price=Max('price_per_day'),
                        avg_price=Avg('price_per_day')
                    )
                    price_stats = {
                        'min': float(price_aggregates['min_price'] or 0),
                        'max': float(price_aggregates['max_price'] or 0),
                        'avg': float(price_aggregates['avg_price'] or 0)
                    }
                except Exception as agg_error:
                    # If aggregate fails, log but don't fail the request
                    if settings.DEBUG:
                        print(f"⚠️ Warning: Could not calculate price statistics: {str(agg_error)}")
                    price_stats = {}
            
            # Apply pagination AFTER calculating aggregates
            start = (page - 1) * page_size
            end = start + page_size
            queryset = queryset[start:end]
            
            # Serialize the results - use iterator() for large querysets to reduce memory
            # For smaller result sets, regular serialization is fine
            if total_count > 100:
                # Use iterator for large querysets to reduce memory usage
                serializer = ListingSerializer(list(queryset.iterator()), many=True, context={'request': request})
            else:
                serializer = ListingSerializer(queryset, many=True, context={'request': request})
            
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
            
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'previous_page': page - 1 if page > 1 else None,
                'statistics': {
                    'price_range': price_stats
                } if price_stats else None
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
            error_type = type(e).__name__
            # Get full traceback for logging
            try:
                tb_str = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            except Exception:
                tb_str = f"{error_type}: {error_msg}"
            
            if settings.DEBUG:
                print(f"❌ GET /listings/ - Exception ({error_type}): {error_msg}")
                print(f"Full traceback:\n{tb_str}")
            else:
                # Even in production, log to stderr with full traceback
                import sys
                print(f"❌ GET /listings/ - Exception ({error_type}): {error_msg}", file=sys.stderr)
                print(f"Full traceback:\n{tb_str}", file=sys.stderr)
            
            # Include more details in response for debugging
            display_msg = error_msg[:500] if len(error_msg) > 500 else error_msg
            return Response({
                'data': [],
                'count': 0,
                'error': 'Internal server error',
                'message': f'{error_type}: {display_msg}' if settings.DEBUG else 'An unexpected error occurred. Please try again later.',
                'error_type': error_type,
                'traceback': tb_str if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new listing (vehicle) or bulk create listings."""
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

            # Check for bulk creation request
            # Handle potential string 'true' from FormData or boolean True from JSON
            is_bulk = request.data.get('bulk')
            if isinstance(is_bulk, str):
                is_bulk = is_bulk.lower() == 'true'
            
            if is_bulk and 'vehicles' in request.data:
                return self._handle_bulk_create(request, partner)
            
            # Prepare listing data
            # IMPORTANT: Create a clean copy without file objects to prevent pickle errors
            listing_data = {}
            for key, value in request.data.items():
                # Skip file objects - they're handled separately via request.FILES
                if hasattr(value, 'read') or hasattr(value, 'chunks'):
                    continue  # Skip file objects
                listing_data[key] = value
            
            # Map frontend field names to backend field names (if needed)
            # Frontend might send 'brand' instead of 'make', 'model_name' instead of 'model', etc.
            field_mapping = {
                'brand': 'make',
                'model_name': 'model',
                'dailyRate': 'price_per_day',
                'price': 'price_per_day',
                'features': 'available_features',
                'description': 'vehicle_description',
            }
            
            for frontend_key, backend_key in field_mapping.items():
                if frontend_key in listing_data:
                    val = listing_data.pop(frontend_key)
                    if backend_key not in listing_data:
                        listing_data[backend_key] = val
            
            # Parse available_features if it's a string (from FormData)
            if 'available_features' in listing_data and isinstance(listing_data['available_features'], str):
                try:
                    listing_data['available_features'] = json.loads(listing_data['available_features'])
                except (json.JSONDecodeError, TypeError):
                    if settings.DEBUG:
                        print(f"⚠️ Failed to parse available_features JSON: {listing_data['available_features']}")
                    listing_data['available_features'] = []
            
            # Additional fallback: Check 'features' if available_features is empty
            if (not listing_data.get('available_features')) and 'features' in request.data:
                features_val = request.data['features']
                if isinstance(features_val, str):
                    try:
                        listing_data['available_features'] = json.loads(features_val)
                    except (json.JSONDecodeError, TypeError):
                        pass
                elif isinstance(features_val, list):
                    listing_data['available_features'] = features_val
            
            # Debug: Log what we received
            if settings.DEBUG:
                print(f"📋 POST /listings/ - Received data keys: {list(listing_data.keys())}")
                print(f"📋 POST /listings/ - Required fields check:")
                for field in ['make', 'model', 'year', 'price_per_day', 'location']:
                    value = listing_data.get(field)
                    print(f"   {field}: {value} (type: {type(value).__name__})")
            
            listing_data['partner_id'] = partner.id
            
            # Remove keys that aren't in the model to avoid issues with custom validation logic
            # This is a safety measure to ensure compatibility with older frontend code
            valid_model_fields = [
                'make', 'model', 'year', 'color', 'transmission', 'fuel_type',
                'seating_capacity', 'vehicle_style', 'price_per_day', 'location',
                'vehicle_description', 'available_features', 'images', 'is_available',
                'is_verified', 'instant_booking', 'partner_id'
            ]
            
            # Filter listing_data to only include known fields
            # We construct a new dict to avoid modifying the one we're iterating over
            filtered_data = {}
            for key, value in listing_data.items():
                if key in valid_model_fields:
                    filtered_data[key] = value
                elif settings.DEBUG:
                    print(f"⚠️ Removing unknown field from payload: {key}")
            
            listing_data = filtered_data
            
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
                    listing_data['seating_capacity'] = 5  # Default to 5 if invalid string
            
            if 'is_available' in listing_data and isinstance(listing_data['is_available'], str):
                listing_data['is_available'] = listing_data['is_available'].lower() in ('true', '1', 'yes')
            
            if 'instant_booking' in listing_data and isinstance(listing_data['instant_booking'], str):
                listing_data['instant_booking'] = listing_data['instant_booking'].lower() in ('true', '1', 'yes')
            
            # Validate required fields
            # Check if fields exist and have valid values
            required_fields = {
                'make': 'string',
                'model': 'string', 
                'year': 'number',
                'price_per_day': 'number',
                'location': 'string'
            }
            # Add defaults for optional fields if missing
            if 'fuel_type' not in listing_data or not listing_data['fuel_type']:
                listing_data['fuel_type'] = 'gasoline'
            if 'transmission' not in listing_data or not listing_data['transmission']:
                listing_data['transmission'] = 'automatic'
            if 'seating_capacity' not in listing_data:
                listing_data['seating_capacity'] = 5
            if 'vehicle_style' not in listing_data or not listing_data['vehicle_style']:
                listing_data['vehicle_style'] = 'sedan'
            if 'color' not in listing_data or not listing_data['color']:
                listing_data['color'] = 'White'
                
            missing_fields = []
            for field, field_type in required_fields.items():
                value = listing_data.get(field)
                
                # Check if field is missing or invalid
                is_missing = False
                if value is None:
                    is_missing = True
                elif field_type == 'string':
                    # String fields must not be empty after stripping
                    if not isinstance(value, str) or value.strip() == '':
                        is_missing = True
                elif field_type == 'number':
                    # Numeric fields must be valid numbers (not empty strings, None, or NaN)
                    if value == '' or value is None:
                        is_missing = True
                    elif isinstance(value, str):
                        # Try to convert string to number
                        try:
                            if field == 'year':
                                num_value = int(value)
                            else:
                                num_value = float(value)
                            # Update listing_data with converted value
                            listing_data[field] = num_value
                        except (ValueError, TypeError):
                            is_missing = True
                
                if is_missing:
                    missing_fields.append(field)
            
            if missing_fields:
                if settings.DEBUG:
                    print(f"❌ POST /listings/ - Missing required fields: {missing_fields}")
                    print(f"   Available fields: {list(listing_data.keys())}")
                    print(f"   Field values:")
                    for field in required_fields.keys():
                        print(f"     {field}: {listing_data.get(field)} (type: {type(listing_data.get(field)).__name__})")
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}',
                    'message': f'Please provide all required vehicle information: {", ".join(missing_fields)}',
                    'received_fields': list(listing_data.keys()) if settings.DEBUG else None,
                    'missing_fields': missing_fields
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle image file uploads from FormData
            uploaded_images = []
            image_errors = []
            
            # Debug: Log what we received
            if settings.DEBUG:
                print(f"📥 POST /listings/ - Received request data keys: {list(request.data.keys())}")
                print(f"📁 POST /listings/ - Received FILES keys: {list(request.FILES.keys())}")
                print(f"📋 POST /listings/ - Content-Type: {request.content_type}")
            
            # Store file objects to process AFTER listing is created (so we have listing_id)
            pending_files = []
            if 'pictures' in request.FILES:
                files = request.FILES.getlist('pictures')
                num_files = len(files)
                
                # Limit to 5 images per creation request to prevent timeout
                max_images = 5
                if num_files > max_images:
                    files = files[:max_images]
                    image_errors.append(f"Limited to {max_images} images to prevent timeout. Please add remaining images via edit.")
                
                if settings.DEBUG:
                    print(f"📸 POST /listings/ - Will process {len(files)} image(s) after listing creation")
                
                for file in files:
                    try:
                        # Quick basic validation (file size and type only)
                        if file.size > MAX_FILE_SIZE:
                            image_errors.append(f"{file.name}: File too large (max {MAX_FILE_SIZE / (1024 * 1024):.1f}MB)")
                            continue
                        
                        # Validate file
                        try:
                            from core.utils.image_utils import validate_image_file
                        except ImportError:
                            from ..utils.image_utils import validate_image_file
                        
                        is_valid, validation_error = validate_image_file(file)
                        if not is_valid:
                            image_errors.append(f"{file.name}: {validation_error}")
                            continue
                        
                        # Store for later processing
                        pending_files.append(file)
                        if settings.DEBUG:
                            print(f"✓ File queued for upload: {file.name}")
                    except Exception as e:
                        error_msg = f"Error validating {file.name}: {str(e)}"
                        image_errors.append(error_msg)
                        if settings.DEBUG:
                            print(f"❌ {error_msg}")
            
            # Handle existing images from JSON (if provided as JSON string or array)
            # Remove 'images' from listing_data first to avoid serializer validation issues
            images_data = listing_data.pop('images', [])
            existing_images = parse_images_data(images_data)
            
            # Create listing with empty images first (we'll add them after we get the listing_id)
            listing_data['images'] = []
            
            if settings.DEBUG:
                print(f"🔍 POST /listings/ - Validating listing data...")
                print(f"   Fields: {list(listing_data.keys())}")
                print(f"   Files to upload: {len(pending_files)}")
            
            # Validate and create listing with transaction for data consistency
            serializer = ListingSerializer(data=listing_data, context={'request': request})
            
            if serializer.is_valid():
                if settings.DEBUG:
                    print(f"✅ POST /listings/ - Serializer is valid, saving to database...")
                
                # Use transaction to ensure data consistency
                try:
                    with transaction.atomic():
                        listing = serializer.save()
                        
                        # NOW upload images to Pics/listings/{listing_id}/
                        if pending_files:
                            if settings.DEBUG:
                                print(f"📸 POST /listings/ - Uploading {len(pending_files)} images to Pics/listings/{listing.id}/")
                            
                            try:
                                from core.utils.image_utils import upload_file_to_supabase_storage
                            except ImportError:
                                from ..utils.image_utils import upload_file_to_supabase_storage
                            
                            for file in pending_files:
                                try:
                                    # Upload to Pics/listings/{listing_id}/
                                    supabase_url = upload_file_to_supabase_storage(
                                        file=file,
                                        bucket_name=os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'Pics'),
                                        folder='listings',
                                        listing_id=listing.id
                                    )
                                    
                                    uploaded_images.append({
                                        'url': supabase_url,
                                        'name': file.name
                                    })
                                    
                                    if settings.DEBUG:
                                        print(f"✓ Uploaded image to Supabase: {supabase_url}")
                                except Exception as e:
                                    error_msg = f"Error uploading {file.name}: {str(e)}"
                                    image_errors.append(error_msg)
                                    if settings.DEBUG:
                                        print(f"❌ {error_msg}")
                            
                            # Combine all images and update listing
                            all_images = combine_images(uploaded_images, existing_images)
                            if all_images:
                                listing.images = all_images
                                listing.save(update_fields=['images'])
                                if settings.DEBUG:
                                    print(f"✅ Updated listing {listing.id} with {len(all_images)} image(s)")
                        else:
                            all_images = existing_images
                        
                        # Skip updating partner.total_bookings here - it's not critical and causes delay
                        # This can be calculated on-demand or via a background task if needed
                        # partner.total_bookings = Booking.objects.filter(partner=partner).count()
                        # partner.save(update_fields=['total_bookings'])
                        
                        if settings.DEBUG:
                            print(f"✅ POST /listings/ - Listing created successfully with ID: {listing.id}")
                        
                        # Return created listing with full details
                        response_serializer = ListingSerializer(listing, context={'request': request})
                        
                        # Create notification using a savepoint to avoid breaking the transaction
                        try:
                            from django.db import transaction as tx
                            try:
                                with tx.atomic():
                                    Notification.objects.create(
                                        user=request.user,
                                        title="Vehicle Created",
                                        message=f"Your vehicle {listing.make} {listing.model} has been successfully created.",
                                        type="success",
                                        related_object_type="listing",
                                        related_object_id=listing.id
                                    )
                            except Exception as notif_error:
                                print(f"Warning: Failed to create notification: {notif_error}")
                        except Exception as outer_error:
                            print(f"Warning: Notification creation outer error: {outer_error}")

                        response_data = {
                            'data': response_serializer.data,
                            'message': 'Listing created successfully',
                            'id': listing.id
                        }
                        
                        # Include image upload status in response
                        if image_errors:
                            response_data['warnings'] = {
                                'image_errors': image_errors,
                                'successful_uploads': len(uploaded_images),
                                'failed_uploads': len(image_errors)
                            }
                            response_data['message'] += f'. {len(uploaded_images)} image(s) uploaded successfully.'
                        
                        return Response(response_data, status=status.HTTP_201_CREATED)
                except Exception as save_error:
                    if settings.DEBUG:
                        print(f"❌ POST /listings/ - Error saving listing: {str(save_error)}")
                        traceback.print_exc()
                    return Response({
                        'error': 'Failed to save listing',
                        'message': str(save_error) if settings.DEBUG else 'An error occurred while saving the listing'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                if settings.DEBUG:
                    print(f"❌ POST /listings/ - Serializer validation failed: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors,
                    'message': 'Please check the form data and try again'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            # Get full traceback for logging (but format it safely to avoid pickle issues)
            try:
                tb_str = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            except Exception:
                # If traceback formatting fails (e.g., due to pickle issues), use simpler format
                tb_str = f"{error_type}: {error_msg}"
            
            # Note: File objects are already cleared in the loop's finally block
            # This prevents them from being in the exception context
            
            if settings.DEBUG:
                print(f"❌ POST /listings/ - Exception ({error_type}): {error_msg}")
                print(f"Full traceback:\n{tb_str}")
            else:
                # Even in production, log to stderr with full traceback
                import sys
                print(f"❌ POST /listings/ - Exception ({error_type}): {error_msg}", file=sys.stderr)
                print(f"Full traceback:\n{tb_str}", file=sys.stderr)
            
            # Include more details in response for debugging
            # Truncate very long error messages to prevent huge responses
            display_msg = error_msg[:500] if len(error_msg) > 500 else error_msg
            return Response({
                'error': 'An error occurred while creating the listing',
                'message': f'{error_type}: {display_msg}' if settings.DEBUG else f'Error: {error_type} - {display_msg[:200]}',
                'error_type': error_type,
                'traceback': tb_str if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle_bulk_create(self, request, partner):
        """Handle bulk creation of listings."""
        try:
            vehicles_data = request.data.get('vehicles', [])
            if not isinstance(vehicles_data, list):
                return Response({
                    'error': 'Invalid format',
                    'message': 'Vehicles data must be a list'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            created_listings = []
            errors = []
            
            # Use atomic transaction to ensure all or nothing
            try:
                with transaction.atomic():
                    for idx, vehicle_data in enumerate(vehicles_data):
                        # Prepare listing data
                        listing_data = vehicle_data.copy()
                        listing_data['partner_id'] = partner.id
                        
                        # Ensure defaults
                        if 'is_available' not in listing_data:
                            listing_data['is_available'] = True
                        if 'fuel_type' not in listing_data:
                            listing_data['fuel_type'] = 'gasoline'
                        if 'transmission' not in listing_data:
                            listing_data['transmission'] = 'automatic'
                        if 'seating_capacity' not in listing_data:
                            listing_data['seating_capacity'] = 5
                        if 'vehicle_style' not in listing_data:
                            listing_data['vehicle_style'] = 'sedan'
                        if 'color' not in listing_data:
                            listing_data['color'] = 'White'
                        
                        # Ensure numeric fields are correctly typed
                        numeric_fields = ['year', 'price_per_day', 'seating_capacity']
                        for field in numeric_fields:
                            if field in listing_data and isinstance(listing_data[field], str):
                                try:
                                    if field == 'price_per_day':
                                        listing_data[field] = float(listing_data[field])
                                    else:
                                        listing_data[field] = int(listing_data[field])
                                except (ValueError, TypeError):
                                    pass

                        # Remove unknown fields that might cause issues
                        valid_model_fields = [
                            'make', 'model', 'year', 'color', 'transmission', 'fuel_type',
                            'seating_capacity', 'vehicle_style', 'price_per_day', 'location',
                            'vehicle_description', 'available_features', 'images', 'is_available',
                            'is_verified', 'instant_booking', 'partner_id'
                        ]
                        
                        filtered_data = {}
                        for key, value in listing_data.items():
                            if key in valid_model_fields:
                                filtered_data[key] = value

                        # Validate and create
                        serializer = ListingSerializer(data=filtered_data, context={'request': request})
                        if serializer.is_valid():
                            listing = serializer.save()
                            created_listings.append(ListingSerializer(listing).data)
                        else:
                            errors.append({
                                'index': idx,
                                'error': serializer.errors
                            })
                            # Rollback transaction on first error
                            raise ValueError(f"Validation failed for vehicle {idx+1}: {serializer.errors}")

                    # Create notification for bulk creation
                    Notification.objects.create(
                        user=request.user,
                        title="Vehicles Created",
                        message=f"Successfully created {len(created_listings)} vehicles.",
                        type="success",
                        related_object_type="bulk_listing",
                        related_object_id=0
                    )

                return Response({
                    'data': created_listings,
                    'count': len(created_listings),
                    'message': f'Successfully created {len(created_listings)} vehicles'
                }, status=status.HTTP_201_CREATED)
                
            except ValueError as ve:
                return Response({
                    'error': 'Bulk creation failed',
                    'message': str(ve),
                    'details': errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            if settings.DEBUG:
                traceback.print_exc()
            return Response({
                'error': 'An error occurred during bulk creation',
                'message': str(e)
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
                        
                        # OPTIMIZED: Upload directly to Supabase (no local save, no resizing)
                        # Import upload function
                        try:
                            from core.utils.image_utils import upload_file_to_supabase_storage, validate_image_file
                        except ImportError:
                            from ..utils.image_utils import upload_file_to_supabase_storage, validate_image_file
                        
                        # Lightweight validation
                        is_valid, validation_error = validate_image_file(file)
                        if not is_valid:
                            image_errors.append(f"{file.name}: {validation_error}")
                            continue
                        
                        # Upload directly to Supabase to Pics/listings/{pk}/
                        supabase_url = upload_file_to_supabase_storage(
                            file=file,
                            bucket_name=os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'Pics'),
                            folder='listings',
                            listing_id=pk
                        )
                        
                        uploaded_images.append({
                            'url': supabase_url,
                            'name': file.name
                        })
                        
                        if settings.DEBUG:
                            print(f"✓ Uploaded image to Supabase: {supabase_url}")
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
            
            # Prepare listing data - create clean copy without file objects
            listing_data = {}
            for key, value in request.data.items():
                # Skip file objects - they're handled separately via request.FILES
                if hasattr(value, 'read') or hasattr(value, 'chunks'):
                    continue
                listing_data[key] = value
            
            if settings.DEBUG:
                print(f"📋 PATCH/PUT /listings/{pk}/ - Received data keys: {list(listing_data.keys())}")
                print(f"📋 PATCH/PUT /listings/{pk}/ - Has images in data: {'images' in listing_data}")
                print(f"📋 PATCH/PUT /listings/{pk}/ - Has pictures in FILES: {'pictures' in request.FILES}")
            
            # Handle existing images from JSON (if provided as JSON string or array)
            # Remove 'images' from listing_data first to avoid serializer validation issues
            images_data = listing_data.pop('images', None)
            
            # Parse existing images from request data
            try:
                existing_images = parse_images_data(images_data) if images_data is not None else []
            except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
                if settings.DEBUG:
                    print(f"⚠️ Error parsing images data: {str(parse_error)}")
                existing_images = []
            
            # Combine uploaded images with existing images
            # If new files were uploaded, add them to existing images
            if uploaded_images:
                all_images = combine_images(uploaded_images, existing_images)
            else:
                # If no new uploads, keep existing images as-is (or use current listing images if not provided)
                if existing_images:
                    all_images = existing_images
                else:
                    # Use current listing images, but ensure they're in the right format
                    try:
                        current_images = listing.images or []
                        if isinstance(current_images, list):
                            all_images = current_images
                        else:
                            # Try to parse if it's a string or other format
                            all_images = parse_images_data(current_images)
                    except (json.JSONDecodeError, ValueError, TypeError, AttributeError):
                        # Fallback to empty list if parsing fails
                        all_images = []
            
            # Allow listing creation even if some/all images fail
            # Images are optional - user can add them later
            if image_errors:
                if settings.DEBUG:
                    print(f"⚠️ Some images failed ({len(image_errors)} errors), but proceeding with listing creation")
                    print(f"   Successful uploads: {len(uploaded_images)}, Errors: {image_errors}")
                # Don't block listing creation - just log the errors
                # The listing will be created with whatever images succeeded
            
            # Set images as a list (serializer expects JSON-serializable data)
            listing_data['images'] = all_images
            
            # Store image errors for potential warning in response
            if image_errors and settings.DEBUG:
                print(f"⚠️ Some images failed: {image_errors}")
            
            # Convert FormData string values to proper types (same as POST)
            if 'year' in listing_data and isinstance(listing_data['year'], str):
                try:
                    listing_data['year'] = int(listing_data['year'])
                except (ValueError, TypeError):
                    pass
            
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
            
            if settings.DEBUG:
                print(f"🔍 PATCH/PUT /listings/{pk}/ - Serializer data keys: {list(listing_data.keys())}")
                print(f"🔍 PATCH/PUT /listings/{pk}/ - Partial update: {partial}")
            
            serializer = ListingSerializer(
                listing,
                data=listing_data,
                partial=partial,
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Use transaction for data consistency
                try:
                    with transaction.atomic():
                        # Save the listing
                        updated_listing = serializer.save()
                        
                        # Refresh from database to get updated data (including computed fields)
                        try:
                            updated_listing.refresh_from_db()
                        except Exception as refresh_error:
                            # If refresh fails, log but continue (the save was successful)
                            if settings.DEBUG:
                                print(f"⚠️ PATCH/PUT /listings/{pk}/ - Warning: Could not refresh from DB: {str(refresh_error)}")
                        
                        if settings.DEBUG:
                            print(f"✅ PATCH/PUT /listings/{pk}/ - Listing updated successfully")
                        
                        # Serialize the updated listing for response
                        try:
                            response_serializer = ListingSerializer(updated_listing, context={'request': request})
                            response_data = response_serializer.data
                        except Exception as serialize_error:
                            # If serialization fails, return basic success response
                            if settings.DEBUG:
                                print(f"⚠️ PATCH/PUT /listings/{pk}/ - Warning: Could not serialize response: {str(serialize_error)}")
                            response_data = {'id': updated_listing.id, 'message': 'Listing updated successfully'}
                        
                        return Response({
                            'data': response_data,
                            'message': 'Listing updated successfully',
                            'id': updated_listing.id
                        }, status=status.HTTP_200_OK)
                except Exception as save_error:
                    error_type = type(save_error).__name__
                    error_msg = str(save_error)
                    if settings.DEBUG:
                        print(f"❌ PATCH/PUT /listings/{pk}/ - Error saving ({error_type}): {error_msg}")
                        traceback.print_exc()
                    return Response({
                        'error': 'Failed to save listing',
                        'message': f'{error_type}: {error_msg}' if settings.DEBUG else 'An error occurred while saving the listing. Please check your data and try again.',
                        'error_type': error_type
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                if settings.DEBUG:
                    print(f"❌ PATCH/PUT /listings/{pk}/ - Validation failed: {serializer.errors}")
                    print(f"   Data keys: {list(listing_data.keys())}")
                    print(f"   Partial: {partial}")
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors,
                    'message': 'Please check the form data and try again'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except (json.JSONDecodeError, ValueError) as parse_error:
            # Handle JSON parsing errors
            error_msg = str(parse_error)
            if settings.DEBUG:
                print(f"❌ PATCH/PUT /listings/{pk}/ - Parse error: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'Invalid data format',
                'message': f'Error parsing request data: {error_msg}' if settings.DEBUG else 'Invalid data format. Please check your input and try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except OperationalError as db_error:
            # Handle database connection errors
            error_msg = str(db_error)
            if settings.DEBUG:
                print(f"❌ PATCH/PUT /listings/{pk}/ - Database error: {error_msg}")
            return Response({
                'error': 'Database connection error',
                'message': 'Service temporarily unavailable. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            # Get full traceback for logging
            try:
                tb_str = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            except Exception:
                tb_str = f"{error_type}: {error_msg}"
            
            if settings.DEBUG:
                print(f"❌ PATCH/PUT /listings/{pk}/ - Exception ({error_type}): {error_msg}")
                print(f"Full traceback:\n{tb_str}")
            else:
                # Even in production, log to stderr with full traceback
                import sys
                print(f"❌ PATCH/PUT /listings/{pk}/ - Exception ({error_type}): {error_msg}", file=sys.stderr)
                print(f"Full traceback:\n{tb_str}", file=sys.stderr)
            
            # Include more details in response for debugging
            display_msg = error_msg[:500] if len(error_msg) > 500 else error_msg
            return Response({
                'error': 'An error occurred while updating the listing',
                'message': f'{error_type}: {display_msg}' if settings.DEBUG else 'An error occurred. Please try again later.',
                'error_type': error_type,
                'traceback': tb_str if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, pk):
        """Delete a listing."""
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to delete listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            listing = Listing.objects.select_related('partner').get(pk=pk)
            
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
            
            # Check if listing has active bookings (prevent deletion of listings with active bookings)
            active_bookings = Booking.objects.filter(
                listing=listing,
                status__in=['pending', 'confirmed', 'active']
            ).exists()
            
            if active_bookings:
                return Response({
                    'error': 'Cannot delete listing',
                    'message': 'This listing has active bookings and cannot be deleted. Please cancel or complete all bookings first.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use transaction for data consistency
            listing_id = listing.id
            listing_name = f"{listing.make} {listing.model} ({listing.year})"
            with transaction.atomic():
                listing.delete()
                
                # Create notification
                Notification.objects.create(
                    user=request.user,
                    title="Vehicle Deleted",
                    message=f"Your vehicle {listing_name} has been successfully deleted.",
                    type="success",
                    related_object_type="listing",
                    related_object_id=listing_id
                )
                
                if settings.DEBUG:
                    print(f"✅ DELETE /listings/{pk}/ - Listing {listing_id} deleted successfully")
            
            return Response({
                'message': 'Listing deleted successfully',
                'id': listing_id
            }, status=status.HTTP_200_OK)
            
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

