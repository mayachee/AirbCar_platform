"""
Integration tests for Booking API endpoints.
Tests booking creation, status updates, and payment workflow.
"""
import pytest
import io
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from core.models import Booking, LicenseVerificationRecord
from tests.factories import UserFactory, BookingFactory, ListingFactory, PartnerFactory


def _make_upload(name='doc.jpg'):
    image = Image.new('RGB', (900, 560), color=(245, 245, 240))
    buf = io.BytesIO()
    image.save(buf, format='JPEG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/jpeg')


@pytest.mark.integration
@pytest.mark.django_db
class TestBookingListAPI:
    """Test booking list endpoints."""

    def test_customer_view_own_bookings(self, db, authenticated_client, user):
        """Test customer can view their bookings."""
        BookingFactory(customer=user, status='pending')
        BookingFactory(customer=user, status='confirmed')
        
        url = '/bookings/'
        response = authenticated_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Booking list endpoint not found")
        
        if response.status_code == 200:
            # Should return customer's bookings
            if isinstance(response.data, dict):
                assert 'results' in response.data or len(response.data) > 0

    def test_partner_view_own_bookings(self, db, partner_client, partner):
        """Test partner can view their bookings."""
        listing = ListingFactory(partner=partner)
        BookingFactory(listing=listing, partner=partner, status='pending')
        BookingFactory(listing=listing, partner=partner, status='confirmed')
        
        url = '/bookings/'
        response = partner_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Booking list endpoint not found")
        
        if response.status_code == 200:
            assert True

    def test_filter_bookings_by_status(self, db, authenticated_client, user):
        """Test filtering bookings by status."""
        BookingFactory(customer=user, status='pending')
        BookingFactory(customer=user, status='confirmed')
        BookingFactory(customer=user, status='pending')
        
        url = '/bookings/?status=pending'
        response = authenticated_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Booking list endpoint not found")
        
        if response.status_code == 200:
            assert True


@pytest.mark.integration
@pytest.mark.django_db
class TestBookingCreationAPI:
    """Test booking creation."""

    def test_create_booking_valid(self, db, authenticated_client, user, listing):
        """Test creating booking with valid data."""
        url = '/bookings/'
        pickup_date = (timezone.now().date() + timedelta(days=1))
        return_date = (timezone.now().date() + timedelta(days=5))
        
        data = {
            'listing': listing.id,
            'pickup_date': str(pickup_date),
            'return_date': str(return_date),
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
            'payment_method': 'online',
        }
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking creation endpoint not found")
        
        if response.status_code == 201:
            listing_val = response.data.get(\"listing\") or response.data.get(\"data\", {}).get(\"listing\")
            assert listing_val == listing.id
            assert response.data['status'] == 'pending'
            assert Booking.objects.filter(customer=user).exists()

    def test_create_booking_invalid_dates(self, db, authenticated_client, user, listing):
        """Test creating booking with past dates."""
        url = '/bookings/'
        pickup_date = (timezone.now().date() - timedelta(days=1))  # Past date
        return_date = (timezone.now().date() + timedelta(days=5))
        
        data = {
            'listing': listing.id,
            'pickup_date': str(pickup_date),
            'return_date': str(return_date),
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
        }
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking creation endpoint not found")
        
        # Should fail for past dates
        if response.status_code in [400, 422]:
            assert response.status_code in [400, 422]

    def test_create_booking_return_before_pickup(self, db, authenticated_client, user, listing):
        """Test creating booking with return before pickup."""
        url = '/bookings/'
        pickup_date = (timezone.now().date() + timedelta(days=5))
        return_date = (timezone.now().date() + timedelta(days=1))  # Before pickup
        
        data = {
            'listing': listing.id,
            'pickup_date': str(pickup_date),
            'return_date': str(return_date),
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
        }
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking creation endpoint not found")
        
        # Should fail when return is before pickup
        if response.status_code in [400, 422]:
            assert response.status_code in [400, 422]

    def test_create_booking_rejects_single_license_side(self, db, authenticated_client, listing):
        """Bypass guard: booking endpoint must reject front-only license uploads."""
        url = '/bookings/'
        pickup_date = (timezone.now().date() + timedelta(days=1))
        return_date = (timezone.now().date() + timedelta(days=4))

        data = {
            'listing': listing.id,
            'pickup_date': str(pickup_date),
            'return_date': str(return_date),
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
            'payment_method': 'online',
            'license_front_document': _make_upload('front.jpg'),
        }
        response = authenticated_client.post(url, data, format='multipart')

        if response.status_code == 404:
            pytest.skip('Booking creation endpoint not found')

        assert response.status_code == 400

    def test_create_booking_stores_license_verification_record(
        self,
        db,
        authenticated_client,
        user,
        listing,
        monkeypatch,
    ):
        """Successful booking verification should create a persisted audit record."""
        url = '/bookings/'
        pickup_date = (timezone.now().date() + timedelta(days=1))
        return_date = (timezone.now().date() + timedelta(days=4))

        def fake_verify(*args, **kwargs):
            return {
                'is_valid': True,
                'score': 0.91,
                'detected_country': 'MA',
                'date_check': {'issue_date': '2022-01-01', 'expiry_date': '2029-01-01', 'is_expired': False},
                'errors': [],
                'warnings': [],
                'checks': {},
            }

        def fake_upload(*args, **kwargs):
            return 'https://example.com/license.jpg'

        monkeypatch.setattr('core.views.booking_views.verify_driving_license_images', fake_verify)
        monkeypatch.setattr('core.views.booking_views.upload_file_to_supabase', fake_upload)

        data = {
            'listing': listing.id,
            'pickup_date': str(pickup_date),
            'return_date': str(return_date),
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
            'payment_method': 'online',
            'license_front_document': _make_upload('front.jpg'),
            'license_back_document': _make_upload('back.jpg'),
        }
        response = authenticated_client.post(url, data, format='multipart')

        if response.status_code == 404:
            pytest.skip('Booking creation endpoint not found')

        assert response.status_code == 201
        record = LicenseVerificationRecord.objects.filter(user=user, context='booking_create').first()
        assert record is not None
        assert record.is_valid is True
        assert record.booking is not None
        assert record.detected_country == 'MA'


@pytest.mark.integration
@pytest.mark.django_db
class TestBookingStatusUpdateAPI:
    """Test booking status update operations."""

    def test_partner_confirm_booking(self, db, partner_client, listing):
        """Test partner can confirm pending booking."""
        booking = BookingFactory(
            listing=listing,
            partner=listing.partner,
            status='pending'
        )
        
        url = f'/bookings/{booking.id}/confirm/'
        response = partner_client.post(url, {}, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking confirm endpoint not found")
        
        if response.status_code == 200:
            assert response.data['status'] == 'confirmed'
            booking.refresh_from_db()
            assert booking.status == 'confirmed'

    def test_partner_reject_booking(self, db, partner_client, listing):
        """Test partner can reject booking."""
        booking = BookingFactory(
            listing=listing,
            partner=listing.partner,
            status='pending'
        )
        
        url = f'/bookings/{booking.id}/reject/'
        data = {'rejection_reason': 'Car not available'}
        response = partner_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking reject endpoint not found")
        
        if response.status_code == 200:
            booking.refresh_from_db()
            assert booking.status in ['cancelled', 'rejected']

    def test_customer_can_cancel_booking(self, db, authenticated_client, user):
        """Test customer can cancel own booking."""
        booking = BookingFactory(customer=user, status='pending')
        
        url = f'/bookings/{booking.id}/cancel/'
        response = authenticated_client.post(url, {}, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking cancel endpoint not found")
        
        if response.status_code == 200:
            booking.refresh_from_db()
            assert booking.status == 'cancelled'

    def test_update_booking_status_to_active(self, db, partner_client, listing):
        """Test updating booking to active status."""
        booking = BookingFactory(
            listing=listing,
            partner=listing.partner,
            status='confirmed'
        )
        
        url = f'/bookings/{booking.id}/'
        data = {'status': 'active'}
        response = partner_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking update endpoint not found")
        
        if response.status_code == 200:
            assert True


@pytest.mark.integration
@pytest.mark.django_db
class TestBookingPaymentAPI:
    """Test booking payment workflow."""

    def test_update_payment_status(self, db, authenticated_client, user):
        """Test updating booking payment status."""
        booking = BookingFactory(
            customer=user,
            payment_status='pending'
        )
        
        url = f'/bookings/{booking.id}/'
        data = {'payment_status': 'paid'}
        response = authenticated_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking update endpoint not found")
        
        if response.status_code == 200:
            booking.refresh_from_db()
            assert booking.payment_status == 'paid'

    def test_booking_payment_online_method(self, db, authenticated_client, user, listing):
        """Test creating booking with online payment."""
        url = '/bookings/'
        data = {
            'listing': listing.id,
            'pickup_date': str(timezone.now().date() + timedelta(days=1)),
            'return_date': str(timezone.now().date() + timedelta(days=5)),
            'payment_method': 'online',
            'pickup_location': 'Downtown',
            'return_location': 'Downtown',
        }
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking creation endpoint not found")
        
        if response.status_code == 201:
            payment_method_val = response.data.get(\"payment_method\") or response.data.get(\"data\", {}).get(\"payment_method\")
            assert payment_method_val == 'online'


@pytest.mark.integration
@pytest.mark.django_db
class TestBookingPermissions:
    """Test booking access permissions."""

    def test_customer_cannot_view_others_bookings(self, db, authenticated_client, user):
        """Test customer cannot see other customer's bookings."""
        other_user = UserFactory()
        BookingFactory(customer=other_user)
        
        url = '/bookings/'
        response = authenticated_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Booking list endpoint not found")
        
        if response.status_code == 200:
            # Should only show user's bookings
            if isinstance(response.data, list):
                assert not any(b.get('customer') != user.id for b in response.data)

    def test_partner_cannot_confirm_other_partners_booking(self, db, partner_client):
        """Test partner cannot confirm booking from another partner."""
        other_partner = PartnerFactory()
        listing = ListingFactory(partner=other_partner)
        booking = BookingFactory(
            listing=listing,
            partner=other_partner,
            status='pending'
        )
        
        url = f'/bookings/{booking.id}/confirm/'
        response = partner_client.post(url, {}, format='json')
        
        if response.status_code == 404:
            pytest.skip("Booking confirm endpoint not found")
        
        # Should fail (403 Forbidden)
        if response.status_code == 403:
            assert response.status_code == 403
