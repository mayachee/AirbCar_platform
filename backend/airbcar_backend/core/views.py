"""
API views for core app - using database models.
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum
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

from .models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from .serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer, PartnerSerializer
)


class ListingListView(APIView):
    """List all listings or search listings with filters. Create new listings (POST requires authentication)."""
    permission_classes = [AllowAny]  # Default for GET
    
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
        partner_id = request.query_params.get('partner_id')
        
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
                    # Partner doesn't exist, return empty result
                    return Response({
                        'data': [],
                        'count': 0,
                        'error': f'Partner with id {partner_id_int} not found',
                        'message': 'Partner not found'
                    }, status=status.HTTP_404_NOT_FOUND)
            except (ValueError, TypeError):
                queryset = Listing.objects.filter(is_available=True)
        else:
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
            # Use select_related to optimize queries - only include relationships that exist
            # Filter out listings with invalid partner relationships to avoid serialization errors
            queryset = queryset.filter(partner__isnull=False)
            
            # Try to use select_related for optimization, but handle gracefully if it fails
            try:
                queryset = queryset.select_related('partner', 'partner__user')
            except Exception:
                # If select_related fails, continue without it (slower but works)
                pass
            
            # Limit results
            queryset = queryset[:100]
            
            # Evaluate queryset with retry logic for connection issues
            listings_list = []
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    # Close any stale connections before retry
                    if retry_count > 0:
                        from django.db import connection
                        connection.close()
                    
                    # Evaluate queryset and serialize
                    listings_list = list(queryset)
                    break  # Success, exit retry loop
                    
                except OperationalError as retry_err:
                    retry_count += 1
                    if retry_count >= max_retries:
                        # Final attempt failed, re-raise to outer handler
                        raise
                    # Wait before retry (exponential backoff)
                    import time
                    time.sleep(0.5 * retry_count)
                    continue
            
            serializer = ListingSerializer(listings_list, many=True, context={'request': request})
            
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'message': 'Listings retrieved successfully'
            })
        except OperationalError as db_err:
            # Database connection error
            if settings.DEBUG:
                import traceback
                print(f"❌ ListingListView OperationalError: {str(db_err)}")
                traceback.print_exc()
            return Response({
                'data': [],
                'count': 0,
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Handle other errors with better logging
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"❌ ListingListView Error ({error_type}): {error_msg}")
                print(f"Query params: partner_id={partner_id}, location={location}")
                traceback.print_exc()
            else:
                # Log error even in production for debugging
                print(f"❌ ListingListView Error ({error_type}): {error_msg}")
            
            # Return a more helpful error response
            return Response({
                'data': [],
                'count': 0,
                'error': f'An error occurred while fetching listings: {error_msg}' if settings.DEBUG else 'An error occurred while fetching listings',
                'error_type': error_type
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new listing (vehicle) or multiple listings (bulk create). Requires authentication and partner profile."""
        # Check authentication for POST
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to create listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Get the partner from the authenticated user
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found. Please complete your partner profile first.',
                    'message': 'You must have a partner profile to create listings'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if this is a bulk create request
            if 'vehicles' in request.data and isinstance(request.data['vehicles'], list):
                return self._bulk_create_listings(request, partner)
            else:
                return self._create_single_listing(request, partner)
                
        except Exception as e:
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"Error in ListingListView POST ({error_type}): {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while creating the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _create_single_listing(self, request, partner):
        """Create a single listing."""
        # Prepare data for serializer
        # Map frontend field names to backend field names
        listing_data = {
            'partner_id': partner.id,
            'make': request.data.get('make', '').strip(),
            'model': request.data.get('model', '').strip(),
            'year': request.data.get('year'),
            'color': request.data.get('color', 'White').strip(),  # Default to 'White' if not provided
            'transmission': request.data.get('transmission', 'automatic'),
            'fuel_type': request.data.get('fuel_type', 'gasoline'),
            'seating_capacity': request.data.get('seating_capacity') or request.data.get('seats') or 5,  # Default to 5 if not provided
            'vehicle_style': request.data.get('vehicle_style') or request.data.get('style', 'sedan'),
            'price_per_day': request.data.get('price_per_day') or request.data.get('dailyRate') or request.data.get('price'),
            'location': request.data.get('location', '').strip(),
            'vehicle_description': request.data.get('description') or request.data.get('vehicle_description', ''),
            'available_features': request.data.get('features') or request.data.get('available_features', []),
            'is_available': request.data.get('is_available', True) if request.data.get('is_available') is not None else True,
            'instant_booking': request.data.get('instant_booking') or request.data.get('instantBooking', False),
        }
        
        # Convert year to int if it's a string
        if listing_data['year'] and isinstance(listing_data['year'], str):
            try:
                listing_data['year'] = int(listing_data['year'])
            except ValueError:
                listing_data['year'] = None
        
        # Convert price_per_day to Decimal if it's a string
        if listing_data['price_per_day'] and isinstance(listing_data['price_per_day'], str):
            try:
                listing_data['price_per_day'] = float(listing_data['price_per_day'])
            except ValueError:
                listing_data['price_per_day'] = None
        
        # Convert seating_capacity to int if it's a string
        if listing_data['seating_capacity'] and isinstance(listing_data['seating_capacity'], str):
            try:
                listing_data['seating_capacity'] = int(listing_data['seating_capacity'])
            except ValueError:
                listing_data['seating_capacity'] = 5
        
        # Handle features - could be JSON string or array
        if isinstance(listing_data['available_features'], str):
            try:
                listing_data['available_features'] = json.loads(listing_data['available_features'])
            except json.JSONDecodeError:
                listing_data['available_features'] = []
        
        # Handle images - could be files or URLs
        images = []
        if 'pictures' in request.FILES:
            # Handle file uploads - try Supabase Storage first, fallback to local
            uploaded_files = request.FILES.getlist('pictures')
            from .supabase_storage import upload_file_to_supabase, generate_file_path
            
            for file in uploaded_files:
                import uuid
                from django.utils.text import get_valid_filename
                
                # Get file extension
                file_ext = os.path.splitext(file.name)[1] or '.jpg'
                # Create unique filename
                unique_filename = f"{uuid.uuid4()}{file_ext}"
                
                # Try to upload to Supabase Storage first
                supabase_url = None
                try:
                    # Generate file path for Supabase
                    file_path = f"listings/{unique_filename}"
                    # Reset file pointer
                    file.seek(0)
                    # Upload to Supabase Storage
                    supabase_url = upload_file_to_supabase(
                        file,
                        'listings',  # bucket name
                        file_path,
                        content_type=file.content_type
                    )
                except Exception as e:
                    if settings.DEBUG:
                        print(f"⚠️ Supabase upload failed for {file.name}: {str(e)}")
                
                if supabase_url:
                    # Use Supabase URL
                    images.append({
                        'name': file.name,
                        'url': supabase_url
                    })
                else:
                        # Supabase upload failed - don't use local storage fallback
                        # Images must be hosted in Supabase
                        if settings.DEBUG:
                            print(f"❌ Failed to upload image to Supabase: {file.name}")
                        # Skip this file - don't add to images array
                        continue
        elif 'images' in request.data:
            # Handle JSON array of image URLs (can be strings or objects with url property)
            images_data = request.data.get('images')
            if isinstance(images_data, str):
                try:
                    images = json.loads(images_data)
                except json.JSONDecodeError:
                    # If it's a single URL string, convert to array
                    if images_data.startswith('http://') or images_data.startswith('https://'):
                        images = [images_data]
                    else:
                        images = []
            else:
                images = images_data if isinstance(images_data, list) else []
            
            # Normalize images to ensure they're in the correct format
            # Support both string URLs and objects with 'url' property
            normalized_images = []
            for img in images:
                if isinstance(img, str):
                    # If it's a string URL (like Google profile picture), store as string
                    normalized_images.append(img)
                elif isinstance(img, dict) and 'url' in img:
                    # If it's an object with url property, keep the object format
                    normalized_images.append(img)
                elif isinstance(img, dict):
                    # If it's an object without url, try to use it as-is or extract url
                    normalized_images.append(img)
            images = normalized_images
        
        listing_data['images'] = images
        
        # Validate required fields
        required_fields = ['make', 'model', 'year', 'price_per_day', 'location']
        missing_fields = [field for field in required_fields if not listing_data.get(field)]
        if missing_fields:
            return Response({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'message': 'Please provide all required vehicle information'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer and validate
        serializer = ListingSerializer(data=listing_data)
        if serializer.is_valid():
            listing = serializer.save()
            return Response({
                'data': ListingSerializer(listing, context={'request': request}).data,
                'message': 'Listing created successfully'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Validation failed',
                'errors': serializer.errors,
                'message': 'Please check your input and try again'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _bulk_create_listings(self, request, partner):
        """Create multiple listings at once. Optimized with database transactions."""
        from django.db.utils import OperationalError
        
        # Wrap entire method in try-except to ensure all errors return JSON, not HTML
        try:
            vehicles_data = request.data.get('vehicles', [])
            
            if not vehicles_data or not isinstance(vehicles_data, list):
                return Response({
                    'error': 'Invalid request',
                    'message': 'vehicles must be a non-empty array'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(vehicles_data) > 10:  # Limit bulk create to 10 at a time
                return Response({
                    'error': 'Too many vehicles',
                    'message': 'You can create up to 10 vehicles at once'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Ensure database connection is active before starting
            try:
                from django.db import connection
                connection.ensure_connection()
            except OperationalError as conn_err:
                if settings.DEBUG:
                    import traceback
                    print(f"❌ Bulk create - Database connection error: {str(conn_err)}")
                    traceback.print_exc()
                return Response({
                    'error': 'Database connection error',
                    'message': 'Database connection error. Please try again later.',
                    'data': [],
                    'created_count': 0,
                    'total_count': len(vehicles_data)
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            created_listings = []
            errors = []
            
            # Use database transaction for better performance and atomicity
            # This ensures all vehicles are created together or none if there's a critical error
            try:
                with transaction.atomic():
                    # Prepare all listings data first (validation phase)
                    prepared_listings = []
                    for idx, vehicle_data in enumerate(vehicles_data):
                        try:
                            # Prepare data for serializer (same as single create)
                            listing_data = {
                                'partner_id': partner.id,
                                'make': vehicle_data.get('make', '').strip(),
                                'model': vehicle_data.get('model', '').strip(),
                                'year': vehicle_data.get('year'),
                                'color': vehicle_data.get('color', 'White').strip(),
                                'transmission': vehicle_data.get('transmission', 'automatic'),
                                'fuel_type': vehicle_data.get('fuel_type', 'gasoline'),
                                'seating_capacity': vehicle_data.get('seating_capacity') or vehicle_data.get('seats') or 5,
                                'vehicle_style': vehicle_data.get('vehicle_style') or vehicle_data.get('style', 'sedan'),
                                'price_per_day': vehicle_data.get('price_per_day') or vehicle_data.get('dailyRate') or vehicle_data.get('price'),
                                'location': vehicle_data.get('location', '').strip(),
                                'vehicle_description': vehicle_data.get('description') or vehicle_data.get('vehicle_description', ''),
                                'available_features': vehicle_data.get('features') or vehicle_data.get('available_features', []),
                                'is_available': vehicle_data.get('is_available', True) if vehicle_data.get('is_available') is not None else True,
                                'instant_booking': vehicle_data.get('instant_booking') or vehicle_data.get('instantBooking', False),
                            }
                            
                            # Type conversions
                            if listing_data['year'] and isinstance(listing_data['year'], str):
                                try:
                                    listing_data['year'] = int(listing_data['year'])
                                except ValueError:
                                    listing_data['year'] = None
                            
                            if listing_data['price_per_day'] and isinstance(listing_data['price_per_day'], str):
                                try:
                                    listing_data['price_per_day'] = float(listing_data['price_per_day'])
                                except ValueError:
                                    listing_data['price_per_day'] = None
                            
                            if listing_data['seating_capacity'] and isinstance(listing_data['seating_capacity'], str):
                                try:
                                    listing_data['seating_capacity'] = int(listing_data['seating_capacity'])
                                except ValueError:
                                    listing_data['seating_capacity'] = 5
                            
                            # Handle features
                            if isinstance(listing_data['available_features'], str):
                                try:
                                    listing_data['available_features'] = json.loads(listing_data['available_features'])
                                except json.JSONDecodeError:
                                    listing_data['available_features'] = []
                            
                            # Handle images
                            images = vehicle_data.get('images', [])
                            if settings.DEBUG:
                                print(f"📸 Bulk create - Vehicle {idx} - Raw images data: {images}, type: {type(images)}")
                            
                            if isinstance(images, str):
                                try:
                                    images = json.loads(images)
                                    if settings.DEBUG:
                                        print(f"📸 Bulk create - Vehicle {idx} - Parsed JSON images: {images}")
                                except json.JSONDecodeError:
                                    images = []
                                    if settings.DEBUG:
                                        print(f"⚠️ Bulk create - Vehicle {idx} - Failed to parse images JSON string")
                            
                            # Ensure images is a list and format is correct
                            if isinstance(images, list):
                                # Validate and format each image
                                formatted_images = []
                                for img in images:
                                    if isinstance(img, dict) and 'url' in img:
                                        # Already in correct format
                                        formatted_images.append(img)
                                    elif isinstance(img, str):
                                        # Convert string URL to object format
                                        formatted_images.append({'url': img, 'name': ''})
                                    elif isinstance(img, dict):
                                        # Ensure it has url property
                                        if 'url' in img:
                                            formatted_images.append(img)
                                images = formatted_images
                                if settings.DEBUG:
                                    print(f"📸 Bulk create - Vehicle {idx} - Formatted images: {images}")
                            else:
                                images = []
                                if settings.DEBUG:
                                    print(f"⚠️ Bulk create - Vehicle {idx} - Images is not a list, setting to empty")
                            
                            listing_data['images'] = images
                            
                            # Validate required fields
                            required_fields = ['make', 'model', 'year', 'price_per_day', 'location']
                            missing_fields = [field for field in required_fields if not listing_data.get(field)]
                            if missing_fields:
                                errors.append({
                                    'index': idx,
                                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                                })
                                continue
                            
                            # Store prepared data for batch processing
                            prepared_listings.append((idx, listing_data))
                            
                        except Exception as e:
                            errors.append({
                                'index': idx,
                                'error': f'Data preparation failed: {str(e)}'
                            })
                    
                    # Create all valid listings in batch (within transaction)
                    # Use savepoint for each vehicle to allow partial success
                    for idx, listing_data in prepared_listings:
                        try:
                            # Create serializer and validate
                            if settings.DEBUG:
                                print(f"📝 Bulk create - Vehicle {idx} - Listing data before serializer: {listing_data.get('make')} {listing_data.get('model')}, images: {listing_data.get('images')}")
                            
                            serializer = ListingSerializer(data=listing_data, context={'request': request})
                            if serializer.is_valid():
                                try:
                                    listing = serializer.save()
                                    
                                    # Verify images were saved
                                    if settings.DEBUG:
                                        saved_images = listing.images if hasattr(listing, 'images') else []
                                        print(f"✅ Bulk create - Vehicle {idx} - Saved listing ID: {listing.id}, images count: {len(saved_images) if isinstance(saved_images, list) else 0}, images: {saved_images}")
                                    
                                    created_listings.append(ListingSerializer(listing, context={'request': request}).data)
                                except Exception as save_err:
                                    # Database error during save (constraint violation, etc.)
                                    error_type = type(save_err).__name__
                                    errors.append({
                                        'index': idx,
                                        'error': f'Failed to save listing: {str(save_err)}',
                                        'error_type': error_type
                                    })
                                    if settings.DEBUG:
                                        import traceback
                                        print(f"⚠️ Failed to save listing at index {idx}: {str(save_err)}")
                                        traceback.print_exc()
                            else:
                                errors.append({
                                    'index': idx,
                                    'error': 'Validation failed',
                                    'errors': serializer.errors
                                })
                        except OperationalError as db_err:
                            # Database connection error during creation
                            error_msg = str(db_err)
                            errors.append({
                                'index': idx,
                                'error': f'Database error: {error_msg}',
                                'error_type': 'OperationalError'
                            })
                            if settings.DEBUG:
                                import traceback
                                print(f"⚠️ Database error at index {idx}: {error_msg}")
                                traceback.print_exc()
                            # Only re-raise if it's a connection error (not a constraint violation)
                            # Connection errors usually indicate the DB is down, so rollback makes sense
                            if 'connection' in error_msg.lower() or 'timeout' in error_msg.lower():
                                raise
                            # Otherwise, continue (might be a constraint issue that we can skip)
                        except Exception as e:
                            error_type = type(e).__name__
                            errors.append({
                                'index': idx,
                                'error': f'Creation failed: {str(e)}',
                                'error_type': error_type
                            })
                            if settings.DEBUG:
                                import traceback
                                print(f"⚠️ Error creating listing at index {idx} ({error_type}): {str(e)}")
                                traceback.print_exc()
                            # Continue with next vehicle even if this one fails
                            # Transaction will commit successful ones
                    
                    # Return response with created listings and any errors (after transaction completes)
                    response_data = {
                        'data': created_listings,
                        'created_count': len(created_listings),
                        'total_count': len(vehicles_data),
                        'message': f'Successfully created {len(created_listings)} out of {len(vehicles_data)} vehicles'
                    }
                    
                    if errors:
                        response_data['errors'] = errors
                    
                    status_code = status.HTTP_201_CREATED if created_listings else status.HTTP_400_BAD_REQUEST
                    return Response(response_data, status=status_code)
            
            except OperationalError as db_err:
                # Database connection error - transaction will be rolled back automatically
                if settings.DEBUG:
                    import traceback
                    print(f"❌ Bulk create - OperationalError: {str(db_err)}")
                    traceback.print_exc()
                return Response({
                    'error': 'Database connection error',
                    'message': 'Database connection error. Please try again later.',
                    'data': [],
                    'created_count': 0,
                    'total_count': len(vehicles_data),
                    'errors': [{
                        'index': -1,
                        'error': 'Database connection error during bulk create'
                    }]
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except Exception as e:
                # Only rollback on critical errors (database issues, etc.)
                error_type = type(e).__name__
                if settings.DEBUG:
                    import traceback
                    print(f"❌ Bulk create critical error ({error_type}): {str(e)}")
                    traceback.print_exc()
                else:
                    # Log error even in production
                    print(f"❌ Bulk create critical error ({error_type}): {str(e)}")
                # Add critical error to response
                errors.append({
                    'index': -1,
                    'error': f'Critical error during bulk create: {str(e)}',
                    'error_type': error_type
                })
                
                # Return response with created listings and any errors (even if there were critical errors)
                response_data = {
                    'data': created_listings,
                    'created_count': len(created_listings),
                    'total_count': len(vehicles_data),
                    'message': f'Successfully created {len(created_listings)} out of {len(vehicles_data)} vehicles'
                }
                
                if errors:
                    response_data['errors'] = errors
                
                status_code = status.HTTP_201_CREATED if created_listings else status.HTTP_400_BAD_REQUEST
                return Response(response_data, status=status_code)
                
        except Exception as outer_err:
            # Catch any exception that wasn't caught above (safety net)
            error_type = type(outer_err).__name__
            error_msg = str(outer_err)
            if settings.DEBUG:
                import traceback
                print(f"❌ Bulk create - Unhandled exception ({error_type}): {error_msg}")
                traceback.print_exc()
            else:
                print(f"❌ Bulk create - Unhandled exception ({error_type}): {error_msg}")
            
            # Return JSON error response instead of letting Django return HTML
            return Response({
                'error': 'An unexpected error occurred',
                'message': f'Error creating vehicles: {error_msg}' if settings.DEBUG else 'An error occurred while creating vehicles. Please try again.',
                'error_type': error_type,
                'data': [],
                'created_count': 0,
                'total_count': len(vehicles_data) if 'vehicles_data' in locals() else 0,
                'errors': [{
                    'index': -1,
                    'error': error_msg,
                    'error_type': error_type
                }]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListingDetailView(APIView):
    """Get a single listing by ID."""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        from django.db import connection
        from django.db.utils import OperationalError
        
        try:
            # Test database connection first
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'error': 'Database connection error. Please try again later.',
                    'message': 'Service temporarily unavailable'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Try to get listing - don't filter by is_available to show even unavailable listings
            try:
                listing = Listing.objects.select_related('partner', 'partner__user').get(pk=pk)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Serialize with context for URL building
            serializer = ListingSerializer(listing, context={'request': request})
            
            return Response({
                'data': serializer.data,
                'message': 'Listing retrieved successfully'
            })
        except OperationalError as db_err:
            # Close connection on error to force reconnection
            connection.close()
            if settings.DEBUG:
                print(f"❌ ListingDetailView DB Error: {str(db_err)}")
            return Response({
                'error': 'Database connection error. Please try again later.',
                'message': 'Service temporarily unavailable'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            # Close connection on error to force reconnection
            try:
                connection.close()
            except:
                pass
            
            # Handle other errors
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"❌ ListingDetailView Error ({error_type}): {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred while fetching the listing',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, pk):
        """Update a listing. Treats PUT as partial update since frontend sends partial data."""
        # Use partial=True for PUT as well, since frontend typically sends partial updates
        return self._update_listing(request, pk, partial=True)
    
    def patch(self, request, pk):
        """Update a listing (partial update). Requires authentication and ownership."""
        return self._update_listing(request, pk, partial=True)
    
    def delete(self, request, pk):
        """Delete a listing. Requires authentication and ownership."""
        # Check authentication
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to delete listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Get the listing
            try:
                listing = Listing.objects.get(pk=pk)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check ownership - user must be the partner who owns this listing
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
            
            # Delete the listing
            listing.delete()
            
            return Response({
                'message': 'Listing deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"Error in ListingDetailView DELETE ({error_type}): {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while deleting the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _update_listing(self, request, pk, partial=False):
        """Helper method to update a listing."""
        # Check authentication
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to update listings'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Get the listing
            try:
                listing = Listing.objects.get(pk=pk)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check ownership - user must be the partner who owns this listing
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
            
            # Prepare data for serializer with comprehensive field mapping
            listing_data = {}
            
            # Helper function to safely extract and validate field values
            def get_field_value(*field_names, default=None, validator=None, transform=None):
                """Get field value from request.data, checking multiple possible field names."""
                for field_name in field_names:
                    if field_name in request.data:
                        value = request.data.get(field_name, default)
                        # Skip None, empty strings (unless explicitly allowed)
                        if value is None or (isinstance(value, str) and value.strip() == '' and default is None):
                            continue
                        # Apply transform if provided
                        if transform:
                            try:
                                value = transform(value)
                            except (ValueError, TypeError):
                                continue
                        # Apply validator if provided
                        if validator and not validator(value):
                            continue
                        return value
                return None
            
            # Map frontend field names to backend field names with comprehensive support
            # Make/Brand
            make_value = get_field_value('make', 'brand', transform=lambda x: x.strip() if isinstance(x, str) else x)
            if make_value:
                listing_data['make'] = make_value
            
            # Model
            model_value = get_field_value('model', 'model_name', transform=lambda x: x.strip() if isinstance(x, str) else x)
            if model_value:
                listing_data['model'] = model_value
            
            # Year
            year_value = get_field_value('year', transform=lambda x: int(x) if isinstance(x, (str, int)) and str(x).isdigit() else x)
            if year_value is not None:
                listing_data['year'] = year_value
            
            # Color
            color_value = get_field_value('color', transform=lambda x: x.strip() if isinstance(x, str) else x)
            if color_value:
                listing_data['color'] = color_value
            
            # Transmission
            transmission_value = get_field_value(
                'transmission',
                validator=lambda x: x in ['manual', 'automatic'],
                transform=lambda x: x.strip().lower() if isinstance(x, str) else x
            )
            if transmission_value:
                listing_data['transmission'] = transmission_value
            
            # Fuel Type
            fuel_type_value = get_field_value(
                'fuel_type', 'fuelType',
                validator=lambda x: x in ['gasoline', 'diesel', 'electric', 'hybrid'],
                transform=lambda x: x.strip().lower() if isinstance(x, str) else x
            )
            if fuel_type_value:
                listing_data['fuel_type'] = fuel_type_value
            
            # Seating Capacity / Seats
            seats_value = get_field_value('seating_capacity', 'seats', transform=lambda x: int(x) if str(x).isdigit() else None)
            if seats_value is not None:
                listing_data['seating_capacity'] = seats_value
            
            # Vehicle Style
            style_value = get_field_value(
                'vehicle_style', 'style',
                validator=lambda x: x in ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van'],
                transform=lambda x: x.strip().lower() if isinstance(x, str) else x
            )
            if style_value:
                listing_data['vehicle_style'] = style_value
            
            # Price per day
            price_value = get_field_value(
                'price_per_day', 'dailyRate', 'price',
                transform=lambda x: float(x) if x and (isinstance(x, (int, float)) or (isinstance(x, str) and x.replace('.', '').isdigit())) else None
            )
            if price_value is not None and price_value >= 0:
                listing_data['price_per_day'] = price_value
            
            # Location
            location_value = get_field_value('location', transform=lambda x: x.strip() if isinstance(x, str) else x)
            if location_value:
                listing_data['location'] = location_value
            
            # Description
            desc_value = get_field_value('description', 'vehicle_description', default='')
            if desc_value is not None:
                listing_data['vehicle_description'] = desc_value.strip() if isinstance(desc_value, str) else str(desc_value)
            
            # Features
            features_value = get_field_value('features', 'available_features', default=[])
            if features_value is not None:
                if isinstance(features_value, str):
                    try:
                        listing_data['available_features'] = json.loads(features_value)
                    except json.JSONDecodeError:
                        listing_data['available_features'] = []
                else:
                    listing_data['available_features'] = features_value if isinstance(features_value, list) else []
            
            # Availability
            is_available_value = get_field_value('is_available', 'isAvailable')
            if is_available_value is not None:
                listing_data['is_available'] = bool(is_available_value)
            
            # Instant Booking
            instant_booking_value = get_field_value('instant_booking', 'instantBooking')
            if instant_booking_value is not None:
                listing_data['instant_booking'] = bool(instant_booking_value)
            
            # Images - handle both replacement and addition
            images_value = get_field_value('images', 'pictures', default=[])
            if images_value is not None:
                if isinstance(images_value, str):
                    try:
                        listing_data['images'] = json.loads(images_value)
                    except json.JSONDecodeError:
                        # If it's a single URL string, convert to array format
                        if images_value.startswith('http') or images_value.startswith('/'):
                            listing_data['images'] = [{'url': images_value}]
                        else:
                            listing_data['images'] = []
                elif isinstance(images_value, list):
                    # Ensure images are in correct format
                    formatted_images = []
                    for img in images_value:
                        if isinstance(img, str):
                            formatted_images.append({'url': img})
                        elif isinstance(img, dict) and 'url' in img:
                            formatted_images.append(img)
                    listing_data['images'] = formatted_images
                else:
                    listing_data['images'] = []
            
            # Handle file uploads for images (new files to add)
            if 'pictures' in request.FILES:
                uploaded_files = request.FILES.getlist('pictures')
                # Get existing images or start with empty list
                images = listing_data.get('images', [])
                # If images weren't in request.data, preserve existing images
                if 'images' not in request.data and 'pictures' not in request.data:
                    images = list(listing.images) if listing.images else []
                
                from .supabase_storage import upload_file_to_supabase
                import uuid
                
                for file in uploaded_files:
                    # Get file extension
                    file_ext = os.path.splitext(file.name)[1] or '.jpg'
                    # Create unique filename
                    unique_filename = f"{uuid.uuid4()}{file_ext}"
                    file_path = f"listings/{unique_filename}"
                    
                    # Try to upload to Supabase Storage first
                    supabase_url = None
                    try:
                        # Reset file pointer
                        file.seek(0)
                        # Upload to Supabase Storage
                        supabase_url = upload_file_to_supabase(
                            file,
                            'listings',  # bucket name
                            file_path,
                            content_type=file.content_type
                        )
                    except Exception as e:
                        if settings.DEBUG:
                            print(f"⚠️ Supabase upload failed for {file.name}: {str(e)}")
                    
                    if supabase_url:
                        # Use Supabase URL
                        images.append({
                            'name': file.name,
                            'url': supabase_url
                        })
                    else:
                        # Supabase upload failed - don't use local storage fallback
                        # Images must be hosted in Supabase
                        if settings.DEBUG:
                            print(f"❌ Failed to upload image to Supabase: {file.name}")
                        # Skip this file - don't add to images array
                        continue
                listing_data['images'] = images
            
            # For partial updates, ensure we don't accidentally clear required fields
            # Only include fields that were actually provided in the request
            # The serializer will use existing values for fields not in listing_data when partial=True
            
            # Debug: Log what we're sending to serializer
            if settings.DEBUG:
                print(f"🔍 Update Listing {pk}:")
                print(f"   Partial mode: {partial}")
                print(f"   Listing data keys: {list(listing_data.keys())}")
                print(f"   Request data keys: {list(request.data.keys())}")
                print(f"   Existing listing: make={listing.make}, model={listing.model}, year={listing.year}")
            
            # Create serializer and validate
            serializer = ListingSerializer(listing, data=listing_data, partial=partial, context={'request': request})
            if serializer.is_valid():
                updated_listing = serializer.save()
                
                # Return comprehensive response with updated data
                response_data = ListingSerializer(updated_listing, context={'request': request}).data
                return Response({
                    'data': response_data,
                    'message': 'Vehicle updated successfully',
                    'success': True,
                    'updated_fields': list(listing_data.keys()),  # Show what was updated
                    'listing_id': updated_listing.id
                }, status=status.HTTP_200_OK)
            else:
                # Log validation errors for debugging
                if settings.DEBUG:
                    print(f"Validation errors: {serializer.errors}")
                    print(f"Listing data: {listing_data}")
                    print(f"Request data: {request.data}")
                
                # Format error message for frontend
                error_messages = []
                for field, errors in serializer.errors.items():
                    if isinstance(errors, list):
                        error_messages.append(f"{field}: {', '.join([str(e) for e in errors])}")
                    else:
                        error_messages.append(f"{field}: {str(errors)}")
                
                error_summary = '; '.join(error_messages) if error_messages else str(serializer.errors)
                
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors,
                    'message': f'Validation failed: {error_summary}',
                    'details': error_summary,
                    'validation_errors': serializer.errors,  # Always include for frontend debugging
                    'debug_info': {
                        'partial': partial,
                        'listing_data_keys': list(listing_data.keys()),
                        'request_data_keys': list(request.data.keys()) if hasattr(request, 'data') else []
                    } if settings.DEBUG else None
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import traceback
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"Error in ListingDetailView UPDATE ({error_type}): {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while updating the listing',
                'message': error_msg if settings.DEBUG else 'Please try again later'
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
        # Only admins or superusers can list all users
        if request.user.role != 'admin' and not request.user.is_superuser:
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
            
            user = request.user
            if settings.DEBUG:
                print(f"🔍 UserMeView GET - User: {user.username}, Email: {user.email}")
                print(f"📋 User fields - first_name: {user.first_name}, last_name: {user.last_name}, phone: {user.phone_number}")
            
            serializer = UserSerializer(user, context={'request': request})
            serialized_data = serializer.data
            
            if settings.DEBUG:
                print(f"📤 Serialized data keys: {list(serialized_data.keys())}")
                print(f"📤 Profile picture URL: {serialized_data.get('profile_picture_url')}")
                print(f"📤 Profile picture base64: {serialized_data.get('profile_picture_base64')}")
                print(f"📤 Profile picture base64 exists: {hasattr(user, 'profile_picture_base64')}")
                if hasattr(user, 'profile_picture_base64'):
                    print(f"📤 Profile picture base64 value: {user.profile_picture_base64[:100] if user.profile_picture_base64 else None}...")
            
            return Response({
                'data': serialized_data
            })
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ UserMeView.get Error: {str(e)}")
                traceback.print_exc()
            
            return Response({
                'error': 'Failed to load user data. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
            supabase_url = upload_file_to_supabase(file, 'license-documents', file_path, file.content_type)
            
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
            supabase_url = upload_file_to_supabase(file, 'license-documents', file_path, file.content_type)
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_back_document_url'] = supabase_url
                request.data['license_back_document'] = None  # Clear local file
                request.data._mutable = False
        
        # Handle base64 profile picture if provided (stored directly in database)
        if 'profile_picture_base64' in request.data:
            # Validate that it's a data URL
            base64_data = request.data.get('profile_picture_base64', '').strip()
            if base64_data and base64_data.startswith('data:image/'):
                # Store base64 data URL directly in database
                request.data._mutable = True
                request.data['profile_picture_base64'] = base64_data
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
            # Delete old file from Supabase if exists (non-blocking - don't wait if it fails)
            if user.id_front_document_url:
                old_url = user.id_front_document_url
                if 'storage/v1/object/public' in old_url:
                    # Extract path from Supabase URL
                    parts = old_url.split('/storage/v1/object/public/')
                    if len(parts) > 1:
                        bucket_and_path = parts[1]
                        bucket_name = bucket_and_path.split('/')[0]
                        file_path = '/'.join(bucket_and_path.split('/')[1:])
                        # Don't block on delete - just try it, continue even if it fails
                        try:
                            delete_file_from_supabase(bucket_name, file_path)
                        except Exception:
                            pass  # Continue even if delete fails
            
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
                'license-documents',  # Fixed: use correct bucket name for license documents
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
                'license-documents',  # Fixed: use correct bucket name for license documents
                file_path,
                file.content_type
            )
            
            if supabase_url:
                request.data._mutable = True
                request.data['license_back_document_url'] = supabase_url
                request.data['license_back_document'] = None
                request.data._mutable = False
        
        # Handle base64 profile picture if provided (stored directly in database)
        if 'profile_picture_base64' in request.data:
            # Validate that it's a data URL
            base64_data = request.data.get('profile_picture_base64', '').strip()
            if base64_data and base64_data.startswith('data:image/'):
                # Store base64 data URL directly in database
                request.data._mutable = True
                request.data['profile_picture_base64'] = base64_data
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
        # Users can only view their own profile unless admin or superuser
        if request.user.pk != pk and request.user.role != 'admin' and not request.user.is_superuser:
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
            # Reduced limit to 30 for better performance and faster response
            base_query = Booking.objects.select_related(
                'listing', 
                'customer', 
                'partner',
                'partner__user',
                'listing__partner',
                'listing__partner__user'
            ).order_by('-created_at')
            
            # Apply filters BEFORE slicing to avoid "Cannot filter a query once a slice has been taken" error
            if request.user.role == 'admin' or request.user.is_superuser:
                bookings = base_query[:30]
            elif request.user.role == 'partner':
                try:
                    partner = request.user.partner_profile
                    bookings = base_query.filter(partner=partner)[:30]
                except Partner.DoesNotExist:
                    bookings = Booking.objects.none()
            else:
                # Customer role - filter by customer first, then slice
                bookings = base_query.filter(customer=request.user)[:30]
            
            # Convert to list to avoid lazy evaluation issues
            bookings_list = list(bookings)
            
            serializer = BookingSerializer(bookings_list, many=True, context={'request': request})
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
            from .supabase_storage import upload_file_to_supabase, generate_file_path, delete_file_from_supabase
            
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
            
            # Process license_front_document if provided - also save to user profile
            license_front_document_url = None
            if 'license_front_document' in request.FILES:
                file = request.FILES['license_front_document']
                # Delete old file from Supabase if exists
                if request.user.license_front_document_url:
                    old_url = request.user.license_front_document_url
                    if 'storage/v1/object/public' in old_url:
                        parts = old_url.split('/storage/v1/object/public/')
                        if len(parts) > 1:
                            bucket_and_path = parts[1]
                            bucket_name = bucket_and_path.split('/')[0]
                            file_path_old = '/'.join(bucket_and_path.split('/')[1:])
                            delete_file_from_supabase(bucket_name, file_path_old)
                
                # Upload new file to Supabase
                file_path = generate_file_path(request.user.id, file.name, 'license_documents')
                supabase_url = upload_file_to_supabase(
                    file,
                    'license-documents',
                    file_path,
                    file.content_type
                )
                if supabase_url:
                    license_front_document_url = supabase_url
                    # Save to user profile
                    request.user.license_front_document_url = supabase_url
                    request.user.save(update_fields=['license_front_document_url'])
            elif request.user.license_front_document_url:
                # Use existing document from profile
                license_front_document_url = request.user.license_front_document_url
            
            # Process license_back_document if provided - also save to user profile
            license_back_document_url = None
            if 'license_back_document' in request.FILES:
                file = request.FILES['license_back_document']
                # Delete old file from Supabase if exists
                if request.user.license_back_document_url:
                    old_url = request.user.license_back_document_url
                    if 'storage/v1/object/public' in old_url:
                        parts = old_url.split('/storage/v1/object/public/')
                        if len(parts) > 1:
                            bucket_and_path = parts[1]
                            bucket_name = bucket_and_path.split('/')[0]
                            file_path_old = '/'.join(bucket_and_path.split('/')[1:])
                            delete_file_from_supabase(bucket_name, file_path_old)
                
                # Upload new file to Supabase
                file_path = generate_file_path(request.user.id, file.name, 'license_documents')
                supabase_url = upload_file_to_supabase(
                    file,
                    'license-documents',
                    file_path,
                    file.content_type
                )
                if supabase_url:
                    license_back_document_url = supabase_url
                    # Save to user profile
                    request.user.license_back_document_url = supabase_url
                    request.user.save(update_fields=['license_back_document_url'])
            elif request.user.license_back_document_url:
                # Use existing document from profile
                license_back_document_url = request.user.license_back_document_url
            
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
                'error': 'Only partners can view pending requests',
                'data': []
            }, status=status.HTTP_403_FORBIDDEN)


class BookingUpcomingView(APIView):
    """Get upcoming bookings."""
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
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            from django.utils import timezone
            
            # Use select_related to optimize queries and limit results to prevent timeout
            base_query = Booking.objects.select_related(
                'listing', 
                'customer', 
                'partner',
                'partner__user',
                'listing__partner',
                'listing__partner__user'
            ).filter(
                pickup_date__gte=timezone.now().date(),
                status__in=['confirmed', 'active']
            ).order_by('pickup_date')
            
            if request.user.role == 'admin' or request.user.is_superuser:
                # Admins and superusers see all upcoming bookings
                bookings = base_query[:50]
            elif request.user.role == 'partner':
                try:
                    partner = Partner.objects.get(user=request.user)
                    bookings = base_query.filter(partner=partner)[:50]
                except Partner.DoesNotExist:
                    bookings = Booking.objects.none()
            else:
                # Customers see their own upcoming bookings
                bookings = base_query.filter(customer=request.user)[:50]
            
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data)
            })
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            try:
                connection.close()
            except:
                pass
            
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingUpcomingView Error: {str(e)}")
                traceback.print_exc()
            
            # Return empty array instead of error to prevent page crash
            return Response({
                'data': [],
                'count': 0,
                'error': 'Failed to load upcoming bookings. Please try again later.'
            }, status=status.HTTP_200_OK)


class BookingCancelView(APIView):
    """Cancel a booking."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Cancel a booking by ID."""
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
            
            # Get the booking
            try:
                booking = Booking.objects.select_related('customer', 'partner', 'listing').get(pk=pk)
            except Booking.DoesNotExist:
                return Response({
                    'error': 'Booking not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions: customer can cancel their own bookings, partner can cancel their listings' bookings, admin/superuser can cancel any
            user = request.user
            can_cancel = False
            
            if user.role == 'admin' or user.is_superuser:
                can_cancel = True
            elif user.role == 'partner':
                # Partner can cancel bookings for their listings
                try:
                    partner = user.partner_profile
                    can_cancel = (booking.partner == partner)
                except Partner.DoesNotExist:
                    can_cancel = False
            else:
                # Customer can cancel their own bookings
                can_cancel = (booking.customer == user)
            
            if not can_cancel:
                return Response({
                    'error': 'You do not have permission to cancel this booking'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if booking can be cancelled
            if booking.status == 'cancelled':
                return Response({
                    'error': 'Booking is already cancelled',
                    'booking': BookingSerializer(booking, context={'request': request}).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if booking.status == 'completed':
                return Response({
                    'error': 'Cannot cancel a completed booking'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cancel the booking
            booking.status = 'cancelled'
            
            # If payment was made, mark payment status as refunded (or keep as paid if already processed)
            if booking.payment_status == 'paid':
                # Optionally set to refunded, or leave as paid if refund is handled separately
                # booking.payment_status = 'refunded'
                pass
            
            booking.save()
            
            if settings.DEBUG:
                print(f"✅ Booking {booking.id} cancelled by {user.username}")
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking cancelled successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingCancelView Error: {str(e)}")
                traceback.print_exc()
            
            return Response({
                'error': 'Failed to cancel booking. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingAcceptView(APIView):
    """
    Accept a booking (change status from pending to confirmed).
    
    Endpoint: POST /bookings/<id>/accept/
    Requires: Authentication, Partner ownership of listing
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Accept a booking by ID."""
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
            
            # Get the booking
            try:
                booking = Booking.objects.select_related('customer', 'partner', 'listing', 'listing__partner').get(pk=pk)
            except Booking.DoesNotExist:
                # Provide more detailed error for debugging
                if settings.DEBUG:
                    print(f"❌ Booking {pk} not found in database")
                    # Check if booking exists with different query
                    try:
                        all_bookings = Booking.objects.all().values_list('id', flat=True)
                        print(f"Available booking IDs: {list(all_bookings)}")
                    except:
                        pass
                return Response({
                    'error': 'Booking not found',
                    'detail': f'Booking with ID {pk} does not exist in the database'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions: only partner who owns the listing can accept
            user = request.user
            can_accept = False
            
            if user.role == 'admin' or user.is_superuser:
                can_accept = True
            elif user.role == 'partner':
                # Partner can accept bookings for their listings
                try:
                    partner = user.partner_profile
                    # Check both booking.partner and listing.partner (in case booking.partner is null)
                    booking_partner = booking.partner
                    listing_partner = booking.listing.partner if booking.listing else None
                    
                    if settings.DEBUG:
                        print(f"🔍 Permission check for booking {pk}:")
                        print(f"   User: {user.username} (role: {user.role})")
                        print(f"   User's partner: {partner.id if partner else None}")
                        print(f"   Booking partner: {booking_partner.id if booking_partner else None}")
                        print(f"   Listing partner: {listing_partner.id if listing_partner else None}")
                    
                    # Accept if booking.partner matches OR listing.partner matches
                    can_accept = (booking_partner == partner) or (listing_partner == partner)
                except Partner.DoesNotExist:
                    if settings.DEBUG:
                        print(f"❌ User {user.username} does not have a partner profile")
                    can_accept = False
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Error checking partner permission: {str(e)}")
                    can_accept = False
            else:
                can_accept = False
            
            if not can_accept:
                # Provide more detailed error message
                error_detail = 'You do not have permission to accept this booking'
                if settings.DEBUG:
                    try:
                        partner = user.partner_profile if user.role == 'partner' else None
                        booking_partner = booking.partner
                        listing_partner = booking.listing.partner if booking.listing else None
                        error_detail += f'. Your partner ID: {partner.id if partner else "N/A"}, Booking partner ID: {booking_partner.id if booking_partner else "N/A"}, Listing partner ID: {listing_partner.id if listing_partner else "N/A"}'
                    except:
                        pass
                return Response({
                    'error': 'You do not have permission to accept this booking',
                    'detail': error_detail
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if booking can be accepted
            if booking.status != 'pending':
                return Response({
                    'error': f'Cannot accept booking with status: {booking.status}',
                    'detail': 'Only pending bookings can be accepted'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Accept the booking (change status to confirmed)
            booking.status = 'confirmed'
            booking.save()
            
            if settings.DEBUG:
                print(f"✅ Booking {booking.id} accepted by {user.username}")
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking accepted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingAcceptView Error: {str(e)}")
                traceback.print_exc()
            
            return Response({
                'error': 'Failed to accept booking. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingRejectView(APIView):
    """
    Reject a booking (change status from pending to cancelled).
    
    Endpoint: POST /bookings/<id>/reject/
    Requires: Authentication, Partner ownership of listing
    Body: { "rejection_reason": "optional reason" }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Reject a booking by ID."""
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
            
            # Get the booking
            try:
                booking = Booking.objects.select_related('customer', 'partner', 'listing', 'listing__partner').get(pk=pk)
            except Booking.DoesNotExist:
                # Provide more detailed error for debugging
                if settings.DEBUG:
                    print(f"❌ Booking {pk} not found in database")
                    # Check if booking exists with different query
                    try:
                        all_bookings = Booking.objects.all().values_list('id', flat=True)
                        print(f"Available booking IDs: {list(all_bookings)}")
                    except:
                        pass
                return Response({
                    'error': 'Booking not found',
                    'detail': f'Booking with ID {pk} does not exist in the database'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions: only partner who owns the listing can reject
            user = request.user
            can_reject = False
            
            if user.role == 'admin' or user.is_superuser:
                can_reject = True
            elif user.role == 'partner':
                # Partner can reject bookings for their listings
                try:
                    partner = user.partner_profile
                    # Check both booking.partner and listing.partner (in case booking.partner is null)
                    booking_partner = booking.partner
                    listing_partner = booking.listing.partner if booking.listing else None
                    
                    if settings.DEBUG:
                        print(f"🔍 Permission check for booking {pk}:")
                        print(f"   User: {user.username} (role: {user.role})")
                        print(f"   User's partner: {partner.id if partner else None}")
                        print(f"   Booking partner: {booking_partner.id if booking_partner else None}")
                        print(f"   Listing partner: {listing_partner.id if listing_partner else None}")
                    
                    # Accept if booking.partner matches OR listing.partner matches
                    can_reject = (booking_partner == partner) or (listing_partner == partner)
                except Partner.DoesNotExist:
                    if settings.DEBUG:
                        print(f"❌ User {user.username} does not have a partner profile")
                    can_reject = False
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Error checking partner permission: {str(e)}")
                    can_reject = False
            else:
                can_reject = False
            
            if not can_reject:
                # Provide more detailed error message
                error_detail = 'You do not have permission to reject this booking'
                if settings.DEBUG:
                    try:
                        partner = user.partner_profile if user.role == 'partner' else None
                        booking_partner = booking.partner
                        listing_partner = booking.listing.partner if booking.listing else None
                        error_detail += f'. Your partner ID: {partner.id if partner else "N/A"}, Booking partner ID: {booking_partner.id if booking_partner else "N/A"}, Listing partner ID: {listing_partner.id if listing_partner else "N/A"}'
                    except:
                        pass
                return Response({
                    'error': 'You do not have permission to reject this booking',
                    'detail': error_detail
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if booking can be rejected
            if booking.status != 'pending':
                return Response({
                    'error': f'Cannot reject booking with status: {booking.status}',
                    'detail': 'Only pending bookings can be rejected'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get rejection reason if provided (check both 'reason' and 'rejection_reason')
            rejection_reason = request.data.get('reason', '').strip() or request.data.get('rejection_reason', '').strip()
            
            # Reject the booking (change status to cancelled)
            booking.status = 'cancelled'
            booking.save()
            
            if settings.DEBUG:
                print(f"❌ Booking {booking.id} rejected by {user.username}")
                if rejection_reason:
                    print(f"   Reason: {rejection_reason}")
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking rejected successfully',
                'rejection_reason': rejection_reason if rejection_reason else None
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Close database connection on error to force reconnection
            from django.db import connection
            connection.close()
            
            if settings.DEBUG:
                import traceback
                print(f"❌ BookingRejectView Error: {str(e)}")
                traceback.print_exc()
            
            return Response({
                'error': 'Failed to reject booking. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingDetailView(APIView):
    """Get booking by ID."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if request.user.role != 'admin' and not request.user.is_superuser and booking.customer != request.user:
                if request.user.role == 'partner' and booking.partner.user != request.user:
                    return Response({
                        'error': 'Permission denied'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = BookingSerializer(booking, context={'request': request})
            
            # If partner is viewing, include full customer documents
            response_data = serializer.data
            if request.user.role == 'partner' and booking.partner.user == request.user:
                customer = booking.customer
                customer_serializer = UserSerializer(customer, context={'request': request})
                response_data['customer_details'] = customer_serializer.data
            
            return Response({
                'data': response_data
            })
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)


class PartnerCustomerInfoView(APIView):
    """Get customer information with all documents for a booking. Partner only."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, booking_id):
        try:
            # Get the booking
            try:
                booking = Booking.objects.select_related('customer', 'partner', 'partner__user').get(pk=booking_id)
            except Booking.DoesNotExist:
                return Response({
                    'error': 'Booking not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verify the partner owns this booking and user has a partner profile
            try:
                partner = Partner.objects.get(user=request.user)
                if booking.partner != partner:
                    return Response({
                        'error': 'Permission denied. This booking does not belong to your vehicles.'
                    }, status=status.HTTP_403_FORBIDDEN)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Only partners can access customer information'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get customer with all documents
            customer = booking.customer
            customer_serializer = UserSerializer(customer, context={'request': request})
            
            # Also include booking-specific documents
            booking_documents = {
                'id_front_document_url': booking.id_front_document_url or None,
                'id_back_document_url': booking.id_back_document_url or None
            }
            
            # Build absolute URLs for booking documents if they exist
            if booking.id_front_document:
                booking_documents['id_front_document_url'] = request.build_absolute_uri(booking.id_front_document.url)
            if booking.id_back_document:
                booking_documents['id_back_document_url'] = request.build_absolute_uri(booking.id_back_document.url)
            
            return Response({
                'data': {
                    'customer': customer_serializer.data,
                    'booking_documents': booking_documents,
                    'booking_id': booking.id,
                    'booking_status': booking.status
                }
            })
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerCustomerInfoView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load customer information',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerListView(APIView):
    """List partners."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Check if user is admin/staff - admins see all partners, others see only verified
            is_admin = request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)
            
            if is_admin:
                # Admin users see all partners for management
                partners = Partner.objects.select_related('user').all().order_by('-created_at')
            else:
                # Regular users only see verified partners
                partners = Partner.objects.select_related('user').filter(is_verified=True).order_by('-created_at')
            
            serializer = PartnerSerializer(partners, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'message': 'Partners retrieved successfully'
            })
        except OperationalError as e:
            # Handle database connection errors gracefully
            return Response({
                'error': 'Database connection error. Please try again later.',
                'message': 'Unable to connect to the database. The service may be temporarily unavailable.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


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
            # Ensure database connection is active
            from django.db import connection
            from django.db.utils import OperationalError
            try:
                connection.ensure_connection()
            except OperationalError:
                return Response({
                    'error': 'Database connection error. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            partner = Partner.objects.select_related('user').prefetch_related('listings').get(pk=pk)
            serializer = PartnerSerializer(partner, context={'request': request})
            
            # Get partner's listings
            listings = partner.listings.all()
            from .serializers import ListingSerializer
            listings_serializer = ListingSerializer(listings, many=True, context={'request': request})
            
            partner_data = serializer.data
            partner_data['listings'] = listings_serializer.data
            partner_data['vehicles'] = listings_serializer.data  # Alias for compatibility
            
            return Response({
                'data': partner_data
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerDetailView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load partner details. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerEarningsView(APIView):
    """Get partner earnings and revenue statistics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
            
            # Get all bookings for this partner
            bookings = Booking.objects.filter(partner=partner)
            
            # Calculate total earnings (from completed bookings)
            completed_bookings = bookings.filter(status='completed', payment_status='paid')
            total_earnings = sum(float(b.total_amount) for b in completed_bookings)
            
            # Calculate monthly earnings
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_bookings = completed_bookings.filter(created_at__gte=current_month)
            monthly_earnings = sum(float(b.total_amount) for b in monthly_bookings)
            
            # Calculate pending payouts (completed but not paid)
            pending_bookings = bookings.filter(status='completed', payment_status='pending')
            pending_payouts = sum(float(b.total_amount) for b in pending_bookings)
            
            # Calculate completed payouts
            completed_payouts = sum(float(b.total_amount) for b in completed_bookings.filter(payment_status='paid'))
            
            # Calculate average per booking
            avg_per_booking = total_earnings / len(completed_bookings) if completed_bookings.exists() else 0
            
            # Calculate growth rate (compare this month to last month)
            last_month = current_month - timedelta(days=32)
            last_month_start = last_month.replace(day=1)
            last_month_bookings = completed_bookings.filter(
                created_at__gte=last_month_start,
                created_at__lt=current_month
            )
            last_month_earnings = sum(float(b.total_amount) for b in last_month_bookings)
            growth_rate = ((monthly_earnings - last_month_earnings) / last_month_earnings * 100) if last_month_earnings > 0 else 0
            
            # Get earnings by month for chart
            earnings_by_month = []
            for i in range(6):  # Last 6 months
                month_start = (current_month - timedelta(days=32 * i)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1)
                month_bookings = completed_bookings.filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end
                )
                month_earnings = sum(float(b.total_amount) for b in month_bookings)
                earnings_by_month.append({
                    'month': month_start.strftime('%Y-%m'),
                    'earnings': float(month_earnings)
                })
            earnings_by_month.reverse()
            
            return Response({
                'data': {
                    'totalEarnings': float(total_earnings),
                    'monthlyEarnings': float(monthly_earnings),
                    'pendingPayouts': float(pending_payouts),
                    'completedPayouts': float(completed_payouts),
                    'averagePerBooking': float(avg_per_booking),
                    'growthRate': float(growth_rate),
                    'earningsByMonth': earnings_by_month,
                    'totalBookings': completed_bookings.count(),
                    'monthlyBookings': monthly_bookings.count()
                }
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerEarningsView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load earnings data',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerAnalyticsView(APIView):
    """Get partner analytics and performance metrics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
            
            # Get time range from query params
            time_range = request.query_params.get('range', '30d')
            days = 30 if time_range == '30d' else (7 if time_range == '7d' else 90)
            start_date = timezone.now() - timedelta(days=days)
            
            # Get bookings in range
            bookings = Booking.objects.filter(
                partner=partner,
                created_at__gte=start_date
            )
            
            # Get vehicles
            vehicles = Listing.objects.filter(partner=partner)
            
            # Calculate revenue by day
            revenue_by_day = []
            for i in range(days):
                day = timezone.now().date() - timedelta(days=days - 1 - i)
                day_bookings = bookings.filter(
                    created_at__date=day,
                    status='completed',
                    payment_status='paid'
                )
                day_revenue = sum(float(b.total_amount) for b in day_bookings)
                revenue_by_day.append({
                    'date': day.isoformat(),
                    'revenue': float(day_revenue),
                    'bookings': day_bookings.count()
                })
            
            # Booking status distribution
            status_counts = {}
            for status_choice in ['pending', 'confirmed', 'active', 'completed', 'cancelled']:
                status_counts[status_choice] = bookings.filter(status=status_choice).count()
            
            # Vehicle performance
            vehicle_performance = []
            for vehicle in vehicles:
                vehicle_bookings = bookings.filter(listing=vehicle, status='completed', payment_status='paid')
                vehicle_revenue = sum(float(b.total_amount) for b in vehicle_bookings)
                vehicle_performance.append({
                    'id': vehicle.id,
                    'name': f"{vehicle.make} {vehicle.model}",
                    'revenue': float(vehicle_revenue),
                    'bookings': vehicle_bookings.count(),
                    'utilization': (vehicle_bookings.count() / days * 100) if days > 0 else 0
                })
            vehicle_performance.sort(key=lambda x: x['revenue'], reverse=True)
            
            # Calculate trends
            first_half = revenue_by_day[:len(revenue_by_day)//2]
            second_half = revenue_by_day[len(revenue_by_day)//2:]
            first_avg = sum(d['revenue'] for d in first_half) / len(first_half) if first_half else 0
            second_avg = sum(d['revenue'] for d in second_half) / len(second_half) if second_half else 0
            revenue_trend = ((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0
            
            first_avg_bookings = sum(d['bookings'] for d in first_half) / len(first_half) if first_half else 0
            second_avg_bookings = sum(d['bookings'] for d in second_half) / len(second_half) if second_half else 0
            bookings_trend = ((second_avg_bookings - first_avg_bookings) / first_avg_bookings * 100) if first_avg_bookings > 0 else 0
            
            return Response({
                'data': {
                    'revenueByDay': revenue_by_day,
                    'statusDistribution': status_counts,
                    'vehiclePerformance': vehicle_performance[:10],  # Top 10
                    'totalRevenue': sum(d['revenue'] for d in revenue_by_day),
                    'totalBookings': bookings.count(),
                    'activeVehicles': vehicles.filter(is_available=True).count(),
                    'averageDailyRate': sum(float(v.price_per_day) for v in vehicles) / vehicles.count() if vehicles.exists() else 0,
                    'revenueTrend': float(revenue_trend),
                    'bookingsTrend': float(bookings_trend)
                }
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerAnalyticsView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load analytics data',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerReviewsView(APIView):
    """Get reviews for partner's vehicles."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
            
            # Get all listings for this partner
            listings = Listing.objects.filter(partner=partner)
            
            # Get all reviews for these listings
            reviews = Review.objects.filter(
                listing__in=listings,
                is_published=True
            ).select_related('user', 'listing').order_by('-created_at')
            
            # Calculate average rating
            if reviews.exists():
                avg_rating = reviews.aggregate(
                    avg_rating=models.Avg('rating')
                )['avg_rating'] or 0
            else:
                avg_rating = 0
            
            # Rating distribution
            rating_distribution = {}
            for i in range(1, 6):
                rating_distribution[i] = reviews.filter(rating=i).count()
            
            # Reviews by vehicle
            reviews_by_vehicle = []
            for listing in listings:
                listing_reviews = reviews.filter(listing=listing)
                if listing_reviews.exists():
                    listing_avg = listing_reviews.aggregate(
                        avg_rating=models.Avg('rating')
                    )['avg_rating'] or 0
                    reviews_by_vehicle.append({
                        'vehicleId': listing.id,
                        'vehicleName': f"{listing.make} {listing.model}",
                        'reviewCount': listing_reviews.count(),
                        'averageRating': float(listing_avg),
                        'reviews': [
                            {
                                'id': r.id,
                                'userName': f"{r.user.first_name} {r.user.last_name}".strip() or r.user.username,
                                'rating': r.rating,
                                'comment': r.comment,
                                'createdAt': r.created_at.isoformat()
                            }
                            for r in listing_reviews[:5]  # Latest 5 per vehicle
                        ]
                    })
            
            from .serializers import ReviewSerializer
            reviews_serializer = ReviewSerializer(reviews, many=True, context={'request': request})
            
            return Response({
                'data': {
                    'reviews': reviews_serializer.data,
                    'averageRating': float(avg_rating),
                    'totalReviews': reviews.count(),
                    'ratingDistribution': rating_distribution,
                    'reviewsByVehicle': reviews_by_vehicle
                }
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerReviewsView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load reviews',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerActivityView(APIView):
    """Get recent activity for partner (bookings, reviews, etc.)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
            
            activities = []
            
            # Recent bookings
            recent_bookings = Booking.objects.filter(
                partner=partner
            ).select_related('customer', 'listing').order_by('-created_at')[:10]
            
            for booking in recent_bookings:
                activities.append({
                    'id': f"booking_{booking.id}",
                    'type': 'booking',
                    'action': booking.status,
                    'title': f"New booking for {booking.listing.make} {booking.listing.model}",
                    'message': f"Customer {booking.customer.first_name} {booking.customer.last_name} booked your vehicle",
                    'timestamp': booking.created_at.isoformat(),
                    'metadata': {
                        'bookingId': booking.id,
                        'vehicleId': booking.listing.id,
                        'amount': float(booking.total_amount)
                    }
                })
            
            # Recent reviews
            listings = Listing.objects.filter(partner=partner)
            recent_reviews = Review.objects.filter(
                listing__in=listings,
                is_published=True
            ).select_related('user', 'listing').order_by('-created_at')[:10]
            
            for review in recent_reviews:
                activities.append({
                    'id': f"review_{review.id}",
                    'type': 'review',
                    'action': 'reviewed',
                    'title': f"New review for {review.listing.make} {review.listing.model}",
                    'message': f"{review.user.first_name} {review.user.last_name} left a {review.rating}-star review",
                    'timestamp': review.created_at.isoformat(),
                    'metadata': {
                        'reviewId': review.id,
                        'vehicleId': review.listing.id,
                        'rating': review.rating
                    }
                })
            
            # Sort by timestamp and return latest 20
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            activities = activities[:20]
            
            return Response({
                'data': activities
            })
        except Partner.DoesNotExist:
            return Response({
                'error': 'Partner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            if settings.DEBUG:
                import traceback
                print(f"❌ PartnerActivityView Error: {str(e)}")
                traceback.print_exc()
            return Response({
                'error': 'Failed to load activity',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RootView(APIView):
    """Root API endpoint - provides API information."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'AirbCar Backend API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health/',
                'auth': {
                    'login': '/api/login/',
                    'register': '/api/register/',
                    'token_refresh': '/api/token/refresh/',
                },
                'listings': '/listings/',
                'partners': '/partners/',
                'bookings': '/bookings/',
            },
            'docs': 'See API documentation for more details'
        })


class HealthCheckView(APIView):
    """Simple health check endpoint to test CORS and server status."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """Health check endpoint - should always return 200 if server is running."""
        try:
            # Try a simple database query to check DB connectivity
            try:
                # Just check if we can query the database (count users, but don't fail if DB is slow)
                User.objects.exists()
                db_status = 'connected'
            except Exception as db_error:
                # Database might be slow or unavailable, but server is still running
                db_status = 'slow_or_unavailable'
                if settings.DEBUG:
                    print(f"Health check - DB check failed (non-critical): {db_error}")
            
        return Response({
            'status': 'ok',
            'message': 'Backend is running',
                'cors_enabled': True,
                'database': db_status,
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Even if something goes wrong, return a response (don't crash)
            if settings.DEBUG:
                print(f"Health check error: {e}")
                import traceback
                traceback.print_exc()
            return Response({
                'status': 'error',
                'message': 'Backend is running but encountered an error',
            'cors_enabled': True
            }, status=status.HTTP_200_OK)  # Still return 200 so health checks don't fail
    
    def post(self, request):
        """Test POST endpoint."""
        try:
        return Response({
            'status': 'ok',
            'method': 'POST',
            'data_received': str(request.data) if hasattr(request, 'data') else 'No data',
            'cors_enabled': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            if settings.DEBUG:
                print(f"Health check POST error: {e}")
            return Response({
                'status': 'error',
                'message': 'Backend is running but encountered an error',
                'cors_enabled': True
            }, status=status.HTTP_200_OK)
    
    def options(self, request):
        """Handle OPTIONS preflight request."""
        return Response({}, status=status.HTTP_200_OK)


class LoginView(APIView):
    """User login with JWT."""
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for login endpoint
    
    def post(self, request):
        """Handle login POST request."""
        # Start with minimal error handling
        try:
            # Log that we received the request
            print("🔍 LoginView: POST request received")
            
            # Get email and password from request
            email = None
            password = None
            
            try:
                if hasattr(request, 'data'):
                    email = request.data.get('email', '').strip() if request.data.get('email') else ''
                    password = request.data.get('password', '') if request.data.get('password') else ''
                else:
                    # Fallback: try to parse JSON body manually
                    import json
                    body = request.body.decode('utf-8') if hasattr(request, 'body') else '{}'
                    data = json.loads(body) if body else {}
                    email = data.get('email', '').strip()
                    password = data.get('password', '')
            except Exception as parse_err:
                print(f"❌ LoginView: Error parsing request - {str(parse_err)}")
                import traceback
                traceback.print_exc()
                return Response({
                    'error': 'Invalid request format',
                    'message': f'Could not parse request: {str(parse_err)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"🔍 LoginView: Email={email}, Password={'***' if password else 'None'}")
            
            if not email or not password:
                return Response({
                    'error': 'Email and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import required modules
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                from django.contrib.auth import authenticate
                from django.db.utils import OperationalError
            except ImportError as import_err:
                print(f"❌ LoginView: Import error - {str(import_err)}")
                import traceback
                traceback.print_exc()
                return Response({
                    'error': 'Server configuration error',
                    'message': f'Import error: {str(import_err)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
                try:
                    user = authenticate(username=email, password=password)
                    if user and settings.DEBUG:
                        print(f"Authenticated via username field for {email}")
                except Exception as auth_err:
                    if settings.DEBUG:
                        print(f"Authentication error: {str(auth_err)}")
            except OperationalError as db_err:
                if settings.DEBUG:
                    print(f"Database connection error during login: {str(db_err)}")
                    traceback.print_exc()
                return Response({
                    'error': 'Database connection error. Please try again later.',
                    'message': 'Service temporarily unavailable'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
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
                except OperationalError as db_err:
                    if settings.DEBUG:
                        print(f"Database connection error: {str(db_err)}")
                    return Response({
                        'error': 'Database connection error. Please try again later.',
                        'message': 'Service temporarily unavailable'
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
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
            try:
                refresh = RefreshToken.for_user(user)
                
                # Serialize user with request context to build proper URLs
                try:
                    user_serializer = UserSerializer(user, context={'request': request})
                    user_data = user_serializer.data
                except Exception as serialize_err:
                    if settings.DEBUG:
                        print(f"⚠️ Error serializing user: {str(serialize_err)}")
                        traceback.print_exc()
                    # Fallback: return basic user data without serialization
                    user_data = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_verified': user.is_verified,
                    }
                
                if settings.DEBUG:
                    print(f"✅ Login successful for {email}")
                
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': user_data,
                    'message': 'Login successful'
                })
            except Exception as token_err:
                error_type = type(token_err).__name__
                if settings.DEBUG:
                    print(f"❌ Error generating tokens ({error_type}): {str(token_err)}")
                    traceback.print_exc()
                return Response({
                    'error': 'Failed to generate authentication tokens. Please try again.',
                    'message': f'{error_type}: {str(token_err)}' if settings.DEBUG else None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            if settings.DEBUG:
                print(f"❌ LoginView Error ({error_type}): {error_msg}")
                traceback.print_exc()
            else:
                print(f"❌ LoginView Error ({error_type}): {error_msg}")
            
            return Response({
                'error': 'An error occurred during login. Please try again.',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    """User registration."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .utils import send_verification_email
        
        try:
            email = request.data.get('email', '').strip()
            password = request.data.get('password', '')
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            phone_number = request.data.get('phone_number', '').strip()
            role = request.data.get('role', 'customer').strip()
        
        # Partner-specific fields
            business_name = request.data.get('business_name', '').strip()
            tax_id = request.data.get('tax_id', '').strip()
            business_type = request.data.get('business_type', 'individual').strip()
            
            # Validate required fields
            if not email:
            return Response({
                    'error': 'Email is required',
                    'detail': 'Please provide a valid email address'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not password:
                return Response({
                    'error': 'Password is required',
                    'detail': 'Please provide a password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(password) < 8:
                return Response({
                    'error': 'Password is too short',
                    'detail': 'Password must be at least 8 characters long'
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
                phone_number=phone_number if phone_number else None,
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
                import traceback
                error_msg = str(e)
                if settings.DEBUG:
                    print(f"Error during registration: {error_msg}")
                    print(traceback.format_exc())
                return Response({
                    'error': 'An error occurred during registration'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            import traceback
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
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
            'is_admin': request.user.role == 'admin' or request.user.is_superuser,
            'role': request.user.role
        })


class VerifyEmailView(APIView):
    """Verify user email address."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from .utils import verify_email_token
        from .models import EmailVerification
        
        token = request.query_params.get('token')
        
        if not token:
            return Response({
                'error': 'Verification token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Debug: Check if token exists in database
        if settings.DEBUG:
            try:
                verification = EmailVerification.objects.get(token=token)
                print(f"Token found: used={verification.is_used}, expired={verification.is_expired()}, user={verification.user.email}")
            except EmailVerification.DoesNotExist:
                print(f"Token not found in database: {token[:20]}...")
                # Check if there are any verifications for debugging
                total_verifications = EmailVerification.objects.count()
                print(f"Total email verifications in database: {total_verifications}")
        
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
        import threading
        from .utils import send_password_reset_email
        
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Create password reset token immediately (before sending email)
            token = PasswordReset.generate_token()
            password_reset = PasswordReset.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # Send email asynchronously to avoid blocking the response
            # This prevents timeouts on slow email servers (like Render free tier)
            def send_email_async():
                try:
                    # Use the existing password_reset object to send email
                    # We need to modify send_password_reset_email to accept password_reset or user
                    from django.core.mail import send_mail
                    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
                    subject = 'Reset your AirbCar password'
                    message = f"""
Hello {user.first_name or user.email},

You requested to reset your password for your AirbCar account.

Click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The AirbCar Team
"""
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    if settings.DEBUG:
                        print(f"Error sending password reset email asynchronously: {e}")
                        print(traceback.format_exc())

            # Start email sending in background thread
            email_thread = threading.Thread(target=send_email_async)
            email_thread.daemon = True
            email_thread.start()

            # Return immediately - don't wait for email to be sent
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.',
                'email_sent': True
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in password reset request: {error_msg}")
                print(traceback.format_exc())
            return Response({
                'error': 'An error occurred while processing your request'
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
                # Save Google profile picture URL
                if google_picture:
                    user.profile_picture_url = google_picture
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
                    is_active=True,
                    profile_picture_url=google_picture if google_picture else None
                )
            
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


# Import admin views
from .admin_views import AdminStatsView, AdminAnalyticsView, AdminRevenueView


def serve_media(request, path):
    """
    Serve media files in production.
    This view handles requests to /media/... paths.
    """
    from django.http import FileResponse, Http404
    import mimetypes
    
    # Security: Prevent directory traversal
    if '..' in path or path.startswith('/'):
        raise Http404("Invalid path")
    
    # Construct full file path
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Ensure the file is within MEDIA_ROOT (security check)
    file_path = os.path.normpath(file_path)
    if not file_path.startswith(os.path.normpath(settings.MEDIA_ROOT)):
        raise Http404("Invalid path")
    
    # Check if file exists
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Serve the file
    try:
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type
        )
        # Add headers for better caching and security
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        # Cache for 1 hour
        response['Cache-Control'] = 'public, max-age=3600'
        return response
    except (IOError, OSError):
        raise Http404("File not found")
