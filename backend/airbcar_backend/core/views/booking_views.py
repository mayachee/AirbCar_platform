"""
Booking-related views.
"""
from decimal import Decimal
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.db import transaction, OperationalError, IntegrityError
from django.db.utils import ProgrammingError, DatabaseError
from datetime import datetime, timedelta
from django.conf import settings
import traceback
import json
import os

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset, Notification
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)
from ..supabase_storage import upload_file_to_supabase


SAFE_DEPOSIT_AMOUNT = Decimal('5000.00')
SERVICE_FEE_AMOUNT = Decimal('25.00')


def _create_notification_safe(**kwargs):
    """Best-effort notification creation.

    Production sometimes runs with migrations not applied (e.g. missing
    `core_notification` table). Notifications should never block booking flows.
    """
    try:
        # IMPORTANT: database errors inside an outer transaction.atomic() will
        # mark the whole transaction as broken, even if caught.
        # Using a nested atomic() creates a savepoint so failures roll back
        # cleanly without aborting the outer transaction.
        with transaction.atomic():
            Notification.objects.create(**kwargs)
    except (ProgrammingError, OperationalError, DatabaseError) as e:
        if settings.DEBUG:
            print(f"Notification creation skipped (non-blocking): {e}")
    except Exception as e:
        if settings.DEBUG:
            print(f"Notification creation failed (non-blocking): {e}")


class BookingListView(APIView):
    """List all bookings or create a new booking."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List user's bookings (as customer) or partner's bookings (as partner)."""
        try:
            user = request.user
            
            # Filter by status if provided
            status_filter = request.query_params.get('status')
            
            # Check if user is a partner
            try:
                partner = Partner.objects.get(user=user)
                # If user is a partner, get bookings for their listings
                bookings = Booking.objects.filter(listing__partner=partner)
            except Partner.DoesNotExist:
                # If user is not a partner, get bookings where they are the customer
                bookings = Booking.objects.filter(customer=user)
            
            if status_filter:
                bookings = bookings.filter(status=status_filter)
            
            # Filter by date range if provided
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    bookings = bookings.filter(pickup_date__gte=start)
                except ValueError:
                    pass
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    bookings = bookings.filter(return_date__lte=end)
                except ValueError:
                    pass
            
            # Optimize: prefetch customer user data for partner bookings
            bookings = bookings.select_related(
                'listing', 'listing__partner', 'listing__partner__user', 'partner', 'customer'
            ).order_by('-created_at')
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)
            
            total_count = bookings.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            bookings = bookings[start:end]
            
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingListView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new booking."""
        try:
            listing_id = request.data.get('listing_id') or request.data.get('listing') or request.data.get('listingId')
            if listing_id in (None, '', 'null', 'None'):
                return Response({
                    'error': 'listing_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Normalize listing_id to int when possible
            try:
                if isinstance(listing_id, str):
                    listing_id = listing_id.strip()
                listing_id = int(listing_id)
            except (TypeError, ValueError):
                return Response({
                    'error': 'Invalid listing_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                listing = Listing.objects.get(pk=listing_id)
            except Listing.DoesNotExist:
                return Response({
                    'error': 'Listing not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if listing is available
            if not listing.is_available:
                return Response({
                    'error': 'Listing is not available'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if instant booking is enabled (if not, booking needs partner approval)
            # For now, all bookings go to pending status
            
            # Get partner
            partner = listing.partner

            if not partner:
                return Response({
                    'error': 'Listing does not have an owner (partner)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate and parse dates
            pickup_date_str = request.data.get('pickup_date')
            return_date_str = request.data.get('return_date')
            
            if not pickup_date_str or not return_date_str:
                return Response({
                    'error': 'pickup_date and return_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                pickup_date = datetime.strptime(pickup_date_str, '%Y-%m-%d').date()
                return_date = datetime.strptime(return_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate dates
            today = timezone.now().date()
            if pickup_date < today:
                return Response({
                    'error': 'Pickup date cannot be in the past'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if return_date <= pickup_date:
                return Response({
                    'error': 'Return date must be after pickup date'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate optional times (if provided)
            pickup_time = request.data.get('pickup_time')
            return_time = request.data.get('return_time')
            time_format = '%H:%M'
            if pickup_time not in (None, '', 'null', 'None'):
                try:
                    datetime.strptime(str(pickup_time), time_format)
                except ValueError:
                    return Response({
                        'error': 'Invalid pickup_time format. Use HH:MM'
                    }, status=status.HTTP_400_BAD_REQUEST)
            if return_time not in (None, '', 'null', 'None'):
                try:
                    datetime.strptime(str(return_time), time_format)
                except ValueError:
                    return Response({
                        'error': 'Invalid return_time format. Use HH:MM'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Validate payment method
            payment_method = request.data.get('payment_method')
            if payment_method in (None, '', 'null', 'None'):
                payment_method = 'online'
            if str(payment_method) not in ('online', 'cash'):
                return Response({
                    'error': 'Invalid payment_method. Use online or cash'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for date conflicts
            conflicting_bookings = Booking.objects.filter(
                listing=listing,
                status__in=['pending', 'confirmed', 'active'],
                pickup_date__lt=return_date,
                return_date__gt=pickup_date
            ).exists()
            
            if conflicting_bookings:
                return Response({
                    'error': 'Listing is not available for the selected dates'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate total amount
            # return_date is treated as checkout date (exclusive), so day-count is the difference
            days = (return_date - pickup_date).days
            total_amount = (listing.price_per_day * days) + SAFE_DEPOSIT_AMOUNT + SERVICE_FEE_AMOUNT
            
            # Determine booking status based on instant_booking setting
            booking_status = 'confirmed' if listing.instant_booking else 'pending'
            
            # Prepare booking data - create clean copy without file objects
            booking_data = {}
            for key, value in request.data.items():
                # Skip file objects - they're handled separately via request.FILES
                if hasattr(value, 'read') or hasattr(value, 'chunks'):
                    continue
                booking_data[key] = value
            
            # Set required fields
            booking_data['listing'] = listing.id
            booking_data['customer'] = request.user.id
            booking_data['partner'] = partner.id
            booking_data['pickup_date'] = pickup_date
            booking_data['return_date'] = return_date
            booking_data['total_amount'] = total_amount
            booking_data['status'] = booking_status
            booking_data['payment_status'] = 'pending'
            booking_data['payment_method'] = payment_method

            # Ensure required location fields are present (some clients don't send them)
            if booking_data.get('pickup_location') in (None, '', 'null', 'None'):
                booking_data['pickup_location'] = listing.location
            if booking_data.get('return_location') in (None, '', 'null', 'None'):
                booking_data['return_location'] = listing.location
            
            # Use serializer to create booking (handles document uploads to Supabase)
            serializer = BookingSerializer(data=booking_data, context={'request': request})
            
            if serializer.is_valid():
                try:
                    # Handle License Uploads
                    license_front_url = None
                    license_back_url = None
                    
                    if 'license_front_document' in request.FILES:
                        try:
                            # Use timestamp to ensure unique filenames
                            ts = int(datetime.now().timestamp())
                            pics_bucket = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'pics')
                            license_front_url = upload_file_to_supabase(
                                request.FILES['license_front_document'], 
                                bucket_name=pics_bucket, 
                                file_path=f"licenses/user_{request.user.id}_{ts}_front"
                            )
                        except Exception as e:
                            if settings.DEBUG:
                                print(f"License front upload failed: {e}")
                    
                    if 'license_back_document' in request.FILES:
                        try:
                            ts = int(datetime.now().timestamp())
                            pics_bucket = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'pics')
                            license_back_url = upload_file_to_supabase(
                                request.FILES['license_back_document'], 
                                bucket_name=pics_bucket, 
                                file_path=f"licenses/user_{request.user.id}_{ts}_back"
                            )
                        except Exception as e:
                            if settings.DEBUG:
                                print(f"License back upload failed: {e}")

                    with transaction.atomic():
                        # Prepare arguments for save()
                        # CRITICAL: We pass customer explicitly because it is read_only in serializer
                        # CRITICAL: listing and partner are also read_only in serializer
                        save_kwargs = {
                            'customer': request.user,
                            'listing': listing,
                            'partner': partner,
                        }
                        
                        # Add license URLs if uploaded
                        if license_front_url:
                            save_kwargs['license_front_document'] = license_front_url
                            # Best-effort update user profile (don't fail booking if this fails)
                            try:
                                request.user.license_front_document = license_front_url
                                request.user.save(update_fields=['license_front_document', 'updated_at'])
                            except Exception as e:
                                if settings.DEBUG:
                                    print(f"User license_front_document update failed (non-blocking): {e}")
                            
                        if license_back_url:
                            save_kwargs['license_back_document'] = license_back_url
                            # Best-effort update user profile (don't fail booking if this fails)
                            try:
                                request.user.license_back_document = license_back_url
                                request.user.save(update_fields=['license_back_document', 'updated_at'])
                            except Exception as e:
                                if settings.DEBUG:
                                    print(f"User license_back_document update failed (non-blocking): {e}")

                        # Save booking
                        booking = serializer.save(**save_kwargs)
                        
                        # If instant booking, mark payment as paid (assuming payment is processed)
                        if listing.instant_booking and request.data.get('payment_status') == 'paid':
                            booking.payment_status = 'paid'
                            booking.save()
                        
                        # Create notification for partner (non-blocking)
                        _create_notification_safe(
                            user=listing.partner.user,
                            title="New Booking Request",
                            message=f"You have a new booking request for {listing.make} {listing.model} from {request.user.username}.",
                            type="new_booking",
                            related_object_type="booking",
                            related_object_id=booking.id
                        )

                        if settings.DEBUG:
                            print(f"✅ POST /bookings/ - Booking created with ID: {booking.id}")
                        
                        return Response({
                            'data': BookingSerializer(booking, context={'request': request}).data,
                            'message': 'Booking created successfully'
                        }, status=status.HTTP_201_CREATED)
                except IntegrityError as ie:
                    return Response({
                        'error': 'Database constraint error',
                        'message': str(ie)
                    }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError as ve:
                    # Supabase upload errors
                    return Response({
                        'error': 'File upload failed',
                        'message': str(ve)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                if settings.DEBUG:
                    print(f"❌ POST /bookings/ - Validation failed: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except ValueError as e:
            return Response({
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingListView.post: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingPendingRequestsView(APIView):
    """List pending booking requests for partners."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get pending booking requests for partner."""
        try:
            # Get partner profile
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get pending bookings
            bookings = Booking.objects.filter(
                partner=partner,
                status='pending'
            ).select_related('listing', 'customer').order_by('-created_at')
            
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingPendingRequestsView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingUpcomingView(APIView):
    """List upcoming bookings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get upcoming bookings."""
        try:
            user = request.user
            today = timezone.now().date()
            
            # Get upcoming bookings
            bookings = Booking.objects.filter(
                Q(customer=user) | Q(partner__user=user),
                pickup_date__gte=today,
                status__in=['pending', 'confirmed', 'active']
            ).select_related('listing', 'customer', 'partner').order_by('pickup_date')
            
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingUpcomingView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingCancelView(APIView):
    """Cancel a booking."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Cancel a booking."""
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if booking.customer != request.user and booking.partner.user != request.user:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Only allow cancellation if not completed
            if booking.status == 'completed':
                return Response({
                    'error': 'Cannot cancel completed booking'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = 'cancelled'
            booking.save()
            
            # Notify the other party
            notify_user = booking.partner.user if request.user == booking.customer else booking.customer
            notify_user_role = "Customer" if request.user == booking.partner.user else "Partner"
            
            _create_notification_safe(
                user=notify_user,
                title="Booking Cancelled",
                message=f"Booking #{booking.id} for {booking.listing.make} {booking.listing.model} has been cancelled by {notify_user_role}.",
                type="error",
                related_object_type="booking",
                related_object_id=booking.id
            )

            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking cancelled successfully'
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingCancelView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingAcceptView(APIView):
    """Accept a booking request."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Accept a booking request."""
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check if user is the partner
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if booking.partner != partner:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check booking status
            if booking.status == 'confirmed':
                # Already confirmed - return success (idempotent operation)
                serializer = BookingSerializer(booking, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Booking is already confirmed'
                }, status=status.HTTP_200_OK)
            
            if booking.status != 'pending':
                # Provide more informative error message
                return Response({
                    'error': f'Booking cannot be accepted. Current status: {booking.status}',
                    'current_status': booking.status,
                    'message': f'Only pending bookings can be accepted. This booking is currently {booking.status}.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Accept the booking
            booking.status = 'confirmed'
            booking.save()
            
            # Notify customer
            _create_notification_safe(
                user=booking.customer,
                title="Booking Accepted",
                message=f"Your booking request for {booking.listing.make} {booking.listing.model} has been accepted!",
                type="success",
                related_object_type="booking",
                related_object_id=booking.id
            )
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking accepted successfully'
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingAcceptView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingRejectView(APIView):
    """Reject a booking request."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Reject a booking request."""
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check if user is the partner
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if booking.partner != partner:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check booking status
            if booking.status == 'cancelled':
                # Already cancelled - return success (idempotent operation)
                serializer = BookingSerializer(booking, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Booking is already rejected'
                }, status=status.HTTP_200_OK)
            
            # Check if already completed/confirmed
            if booking.status in ['confirmed', 'completed', 'active']:
                return Response({
                    'error': f'Cannot reject booking with status: {booking.status}. Only pending bookings can be rejected.',
                    'message': f'This booking is already {booking.status} and cannot be rejected.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reject by cancelling
            booking.status = 'cancelled'
            booking.save()
            
            # Notify customer
            _create_notification_safe(
                user=booking.customer,
                title="Booking Rejected",
                message=f"Your booking request for {booking.listing.make} {booking.listing.model} has been rejected.",
                type="error",
                related_object_type="booking",
                related_object_id=booking.id
            )
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data,
                'message': 'Booking rejected successfully'
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingRejectView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingDetailView(APIView):
    """Retrieve a booking detail."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get booking detail."""
        try:
            booking = Booking.objects.select_related(
                'listing', 'customer', 'partner'
            ).get(pk=pk)
            
            # Check permissions
            if booking.customer != request.user and booking.partner.user != request.user:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in BookingDetailView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartnerCustomerInfoView(APIView):
    """Get customer information for a booking."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, booking_id):
        """Get customer info for a booking."""
        try:
            booking = Booking.objects.select_related('customer').get(pk=booking_id)
            
            # Check if user is the partner
            try:
                partner = Partner.objects.get(user=request.user)
            except Partner.DoesNotExist:
                return Response({
                    'error': 'Partner profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if booking.partner != partner:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            customer = booking.customer
            serializer = UserSerializer(customer, context={'request': request})
            
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PartnerCustomerInfoView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
