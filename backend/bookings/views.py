from datetime import datetime
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from listings.models import Listing

from .models import Booking
from .serializers import BookingSerializer


from common.utils import upload_file_to_supabase

# Notification helpers
try:
    from airbcar_backend.core.utils.notifications import notify_new_booking, notify_booking_confirmed, notify_booking_rejected
except ImportError:
    notify_new_booking = notify_booking_confirmed = notify_booking_rejected = None

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
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
        data = self.request.data
        user = self.request.user
        listing_id = data.get('listing')
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            raise ValidationError({'listing': 'Listing not found'})
        
        request_message = data.get('request_message', '')

        # Phone number supplied during booking flow
        phone_number = (
            data.get('phone_number')
            or data.get('phoneNumber')
            or data.get('phone')
            or getattr(user, 'phone_number', '')
            or ''
        ).strip()

        if not phone_number:
            raise ValidationError({'phone_number': 'Phone number is required'})
        
        # Handle start/end times from separate date/time fields
        pickup_date = data.get('pickup_date')
        pickup_time = data.get('pickup_time', '10:00')
        return_date = data.get('return_date')
        return_time = data.get('return_time', '10:00')
        
        start_time = timezone.now()
        end_time = timezone.now()

        if pickup_date:
            try:
                p_date = datetime.strptime(pickup_date, '%Y-%m-%d').date()
                p_time = datetime.strptime(str(pickup_time).split('.')[0], '%H:%M').time()
                combo = datetime.combine(p_date, p_time)
                start_time = timezone.make_aware(combo) if timezone.is_naive(combo) else combo
            except (ValueError, TypeError):
                pass 

        if return_date:
            try:
                r_date = datetime.strptime(return_date, '%Y-%m-%d').date()
                r_time = datetime.strptime(str(return_time).split('.')[0], '%H:%M').time()
                combo = datetime.combine(r_date, r_time)
                end_time = timezone.make_aware(combo) if timezone.is_naive(combo) else combo
            except (ValueError, TypeError):
                pass
                
        price = data.get('total_amount') or data.get('price', 0.0)

        # Handle license file uploads
        license_front_url = None
        license_back_url = None
        
        license_front_file = self.request.FILES.get('license_front_document')
        if license_front_file:
            try:
                license_front_url = upload_file_to_supabase(license_front_file, folder="user_documents/license_documents", bucket="Pics")
            except Exception as e:
                print(f"Error uploading license front: {e}")
                
        license_back_file = self.request.FILES.get('license_back_document')
        if license_back_file:
            try:
                license_back_url = upload_file_to_supabase(license_back_file, folder="user_documents/license_documents", bucket="Pics")
            except Exception as e:
                print(f"Error uploading license back: {e}")

        # Fall back to existing license documents from user profile if no new files uploaded
        if not license_front_url:
            existing_front = (
                getattr(user, 'license_front_document_url', None)
                or getattr(user, 'license_front_document', None)
            )
            if existing_front:
                license_front_url = str(existing_front)
        if not license_back_url:
            existing_back = (
                getattr(user, 'license_back_document_url', None)
                or getattr(user, 'license_back_document', None)
            )
            if existing_back:
                license_back_url = str(existing_back)

        # Update user profile with latest license docs if provided
        user_updated = False

        # If user profile has no phone yet, persist the booking phone into the profile
        if phone_number and not getattr(user, 'phone_number', ''):
            user.phone_number = phone_number
            user_updated = True
        # If user profile is missing license docs, persist the booking uploads into the profile
        if license_front_url and not getattr(user, 'license_front_document', None):
            user.license_front_document = license_front_url  # Store directly as URL string
            user_updated = True
        if license_back_url and not getattr(user, 'license_back_document', None):
            user.license_back_document = license_back_url  # Store directly as URL string
            user_updated = True
            
        if user_updated:
            user.save()

        booking = serializer.save(
            user=self.request.user, 
            listing=listing, 
            request_message=request_message,
            start_time=start_time,
            end_time=end_time,
            price=price,
            phone_number=phone_number or None,
            license_front_document=license_front_url,
            license_back_document=license_back_url
        )

        # Notify the listing owner about the new booking
        if notify_new_booking and hasattr(listing, 'partner') and hasattr(listing.partner, 'user'):
            try:
                notify_new_booking(listing.partner.user, booking)
            except Exception as e:
                print(f'[NOTIFICATION] Error sending new booking notification: {e}')

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
        booking.rejected_at = None
        booking.rejection_reason = None
        booking.save()

        # Notify the guest that their booking was confirmed
        if notify_booking_confirmed:
            try:
                notify_booking_confirmed(booking.user, booking)
            except Exception as e:
                print(f'[NOTIFICATION] Error sending booking confirmed notification: {e}')
        
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
        booking.accepted_at = None
        booking.save()

        # Notify the guest that their booking was declined
        if notify_booking_rejected:
            try:
                notify_booking_rejected(booking.user, booking)
            except Exception as e:
                print(f'[NOTIFICATION] Error sending booking rejected notification: {e}')
        
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
        
        # Apply pagination
        page = self.paginate_queryset(bookings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_bookings(self, request):
        """Get upcoming bookings for the current user (as renter or owner)"""
        user = request.user
        
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
        
        # Apply pagination
        page = self.paginate_queryset(bookings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

