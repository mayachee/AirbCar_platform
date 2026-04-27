"""Integration tests for the H1 feature set: WhatsApp booking, BlackoutDate
endpoints, and the verified-agency admin toggle."""
from datetime import date, timedelta

import pytest
from rest_framework import status

from core.models import BlackoutDate, Booking, Partner
from tests.factories import ListingFactory, UserFactory, PartnerFactory


@pytest.mark.integration
@pytest.mark.django_db
class TestWhatsAppBooking:

    def _make_partner_with_whatsapp(self):
        user = UserFactory(role='partner')
        partner = PartnerFactory(user=user, is_verified=True)
        partner.whatsapp_phone_number = '+212600000000'
        partner.save(update_fields=['whatsapp_phone_number'])
        return partner

    def test_whatsapp_booking_returns_wa_me_url(self, db, authenticated_client):
        partner = self._make_partner_with_whatsapp()
        listing = ListingFactory(partner=partner, is_available=True)

        pickup = date.today() + timedelta(days=2)
        ret = pickup + timedelta(days=3)

        response = authenticated_client.post(
            '/bookings/whatsapp/',
            {
                'listing_id': listing.id,
                'pickup_date': pickup.isoformat(),
                'return_date': ret.isoformat(),
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        body = response.data['data']
        assert body['status'] == 'pending_whatsapp'
        assert body['whatsapp_url'].startswith('https://wa.me/212600000000?text=')
        # Booking row exists in pending_whatsapp with the signed token.
        booking = Booking.objects.get(pk=body['booking_id'])
        assert booking.status == 'pending_whatsapp'
        assert booking.whatsapp_signed_token
        assert booking.confirmation_channel == 'whatsapp'

    def test_whatsapp_booking_blocked_when_partner_has_no_phone(self, db, authenticated_client):
        partner = PartnerFactory(user=UserFactory(role='partner'))
        listing = ListingFactory(partner=partner, is_available=True)

        pickup = date.today() + timedelta(days=2)
        response = authenticated_client.post(
            '/bookings/whatsapp/',
            {
                'listing_id': listing.id,
                'pickup_date': pickup.isoformat(),
                'return_date': (pickup + timedelta(days=2)).isoformat(),
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'WhatsApp' in response.data.get('error', '')

    def test_whatsapp_booking_blocked_by_blackout(self, db, authenticated_client):
        partner = self._make_partner_with_whatsapp()
        listing = ListingFactory(partner=partner, is_available=True)
        pickup = date.today() + timedelta(days=5)
        BlackoutDate.objects.create(
            listing=listing,
            start_date=pickup,
            end_date=pickup + timedelta(days=2),
            reason='Maintenance',
        )
        response = authenticated_client.post(
            '/bookings/whatsapp/',
            {
                'listing_id': listing.id,
                'pickup_date': pickup.isoformat(),
                'return_date': (pickup + timedelta(days=1)).isoformat(),
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'blackout' in response.data.get('error', '').lower()


@pytest.mark.integration
@pytest.mark.django_db
class TestBlackoutEndpoints:

    def test_partner_can_create_and_delete_blackout(self, db, partner_client, partner_user):
        partner = Partner.objects.get(user=partner_user)
        listing = ListingFactory(partner=partner, is_available=True)

        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=3)

        # Create
        response = partner_client.post(
            f'/listings/{listing.id}/blackouts/',
            {'start_date': start.isoformat(), 'end_date': end.isoformat(), 'reason': 'Vacation'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        blackout_id = response.data['data']['id']
        assert BlackoutDate.objects.filter(pk=blackout_id, listing=listing).exists()

        # Delete
        response = partner_client.delete(
            f'/listings/{listing.id}/blackouts/{blackout_id}/',
        )
        assert response.status_code == status.HTTP_200_OK
        assert not BlackoutDate.objects.filter(pk=blackout_id).exists()

    def test_other_partner_cannot_blackout_listing(self, db, api_client):
        from rest_framework_simplejwt.tokens import RefreshToken

        owning_partner = PartnerFactory(user=UserFactory(role='partner'))
        listing = ListingFactory(partner=owning_partner, is_available=True)

        intruder_user = UserFactory(role='partner')
        PartnerFactory(user=intruder_user)
        api_client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(intruder_user).access_token}'
        )

        response = api_client.post(
            f'/listings/{listing.id}/blackouts/',
            {'start_date': '2030-06-01', 'end_date': '2030-06-05'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_blackout_rejects_when_active_booking_overlaps(self, db, partner_client, partner_user):
        partner = Partner.objects.get(user=partner_user)
        listing = ListingFactory(partner=partner, is_available=True)
        renter = UserFactory(role='customer')
        Booking.objects.create(
            listing=listing,
            customer=renter,
            partner=partner,
            pickup_date=date.today() + timedelta(days=20),
            return_date=date.today() + timedelta(days=23),
            pickup_location='X', return_location='X',
            total_amount='500.00',
            status='confirmed',
        )

        response = partner_client.post(
            f'/listings/{listing.id}/blackouts/',
            {
                'start_date': (date.today() + timedelta(days=21)).isoformat(),
                'end_date': (date.today() + timedelta(days=22)).isoformat(),
            },
            format='json',
        )
        assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.integration
@pytest.mark.django_db
class TestVerifiedAgencyToggle:

    def test_admin_can_toggle_partner_verification(self, db, admin_client):
        partner = PartnerFactory(user=UserFactory(role='partner'), is_verified=False)

        response = admin_client.post(
            f'/api/admin/partners/{partner.id}/verify/',
            {'is_verified': True},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        partner.refresh_from_db()
        assert partner.is_verified is True
        assert partner.verified_at is not None

        # Toggle off
        response = admin_client.post(
            f'/api/admin/partners/{partner.id}/verify/',
            {'is_verified': False},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        partner.refresh_from_db()
        assert partner.is_verified is False
        assert partner.verified_at is None

    def test_non_admin_cannot_verify(self, db, partner_client, partner):
        response = partner_client.post(
            f'/api/admin/partners/{partner.id}/verify/',
            {'is_verified': True},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
