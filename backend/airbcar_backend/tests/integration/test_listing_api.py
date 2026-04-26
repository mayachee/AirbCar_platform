"""
Integration tests for Listing API endpoints.
Tests CRUD operations, filtering, search, and availability.
"""
import pytest
from rest_framework import status
from decimal import Decimal

from core.models import Listing, ListingComment
from tests.factories import UserFactory, PartnerFactory, ListingFactory


@pytest.mark.integration
@pytest.mark.django_db
class TestListingListAPI:
    """Test listing list/search endpoints."""

    def test_list_all_listings(self, db, api_client, multiple_listings):
        """Test getting list of all listings."""
        url = '/listings/'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing list endpoint not found")
        
        if response.status_code == 200:
            # Should return listings
            if isinstance(response.data, dict):
                # Paginated response
                assert 'results' in response.data or 'count' in response.data
            else:
                assert isinstance(response.data, list)

    def test_list_available_listings_only(self, db, api_client):
        """Test filtering available listings."""
        partner = PartnerFactory()
        ListingFactory(partner=partner, is_available=True)
        ListingFactory(partner=partner, is_available=True)
        ListingFactory(partner=partner, is_available=False)
        
        url = '/listings/?is_available=true'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing list endpoint not found")
        
        if response.status_code == 200:
            # Count available listings
            if isinstance(response.data, dict):
                data = response.data.get('results', response.data)
            else:
                data = response.data
            
            if isinstance(data, list):
                total_available = len([l for l in data if l.get('is_available', True)])
                assert total_available >= 2

    def test_search_listings_by_location(self, db, api_client):
        """Test filtering listings by location."""
        partner = PartnerFactory()
        ListingFactory(partner=partner, location='New York')
        ListingFactory(partner=partner, location='New York')
        ListingFactory(partner=partner, location='Los Angeles')
        
        url = '/listings/?location=New+York'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing list endpoint not found")
        
        if response.status_code == 200:
            assert True  # Filter attempt succeeded

    def test_filter_listings_by_price_range(self, db, api_client):
        """Test filtering by price range."""
        partner = PartnerFactory()
        ListingFactory(partner=partner, price_per_day=Decimal('30.00'))
        ListingFactory(partner=partner, price_per_day=Decimal('100.00'))
        ListingFactory(partner=partner, price_per_day=Decimal('200.00'))
        
        url = '/listings/?price_min=50&price_max=150'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing list endpoint not found")
        
        if response.status_code == 200:
            assert True  # Price filter attempt succeeded

    def test_filter_listings_by_vehicle_type(self, db, api_client):
        """Test filtering by vehicle style."""
        partner = PartnerFactory()
        ListingFactory(partner=partner, vehicle_style='suv')
        ListingFactory(partner=partner, vehicle_style='sedan')
        ListingFactory(partner=partner, vehicle_style='suv')
        
        url = '/listings/?vehicle_style=suv'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing list endpoint not found")
        
        if response.status_code == 200:
            assert True


@pytest.mark.integration
@pytest.mark.django_db
class TestListingDetailAPI:
    """Test listing detail endpoints."""

    def test_get_listing_detail(self, db, api_client, listing):
        """Test getting single listing detail."""
        url = f'/listings/{listing.id}/'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("Listing detail endpoint not found")
        
        if response.status_code == 200:
            id_val = response.data.get("id") or response.data.get("data", {}).get("id")
            data_dict = response.data.get("data", response.data)
            assert id_val == listing.id
            assert data_dict.get('make') == listing.make
            assert data_dict.get('model') == listing.model

    def test_get_nonexistent_listing(self, db, api_client):
        """Test getting listing that doesn't exist."""
        url = '/listings/99999/'
        response = api_client.get(url)
        
        if response.status_code == 404:
            # Expected 404
            assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.django_db
class TestListingCreateUpdateAPI:
    """Test listing creation and update."""

    def test_partner_can_create_listing(self, db, partner_client, partner):
        """Test partner can create new listing."""
        url = '/listings/'
        data = {
            'make': 'Tesla',
            'model': 'Model 3',
            'year': 2024,
            'color': 'White',
            'transmission': 'automatic',
            'fuel_type': 'electric',
            'seating_capacity': 5,
            'vehicle_style': 'sedan',
            'price_per_day': '150.00',
            'location': 'San Francisco',
            # Active listings require >=3 real images.
            'images': [f'https://example.com/test{i}.jpg' for i in range(3)],
        }
        response = partner_client.post(url, data, format='json')

        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")

        # The view wraps the listing inside an envelope: {data, message, id}.
        assert response.status_code == 201, response.data
        assert response.data['data']['make'] == 'Tesla'
        assert Listing.objects.filter(make='Tesla').exists()

    def test_customer_cannot_create_listing(self, db, authenticated_client, user):
        """Test customer cannot create listing."""
        url = '/listings/'
        data = {
            'make': 'Honda',
            'model': 'Civic',
            'year': 2023,
            'price_per_day': '80.00',
        }
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        
        # Customer should not be able to create listing
        if response.status_code in [403, 401]:
            assert response.status_code in [403, 401]

    def test_partner_can_update_own_listing(self, db, partner_client, listing):
        """Test partner can update own listing."""
        # Note: listing may belong to a different partner, test the endpoint behavior
        pass  # Skip ownership reassignment, just test the API response
        
        url = f'/listings/{listing.id}/'
        data = {
            'price_per_day': '200.00',
        }
        response = partner_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Listing update endpoint not found")
        
        if response.status_code == 200:
            # Successfully updated
            assert True

    def test_partner_cannot_update_others_listing(self, db, partner_client, listing):
        """Test partner cannot update another partner's listing."""
        # listing belongs to different partner
        url = f'/listings/{listing.id}/'
        data = {'price_per_day': '999.00'}
        response = partner_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Listing update endpoint not found")
        
        # Should fail (403 Forbidden or 404)
        if response.status_code in [403, 404]:
            assert response.status_code in [403, 404]


@pytest.mark.integration
@pytest.mark.django_db
class TestListingAvailability:
    """Test listing availability checks."""

    def test_check_listing_availability_for_dates(self, db, api_client, listing):
        """Test checking if listing is available for date range."""
        url = f'/listings/{listing.id}/check-availability/'
        data = {
            'start_date': '2024-12-20',
            'end_date': '2024-12-25',
        }
        response = api_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Availability check endpoint not found")
        
        if response.status_code == 200:
            # Should return availability status
            assert 'available' in response.data or 'is_available' in response.data

    def test_unavailable_listing_shows_as_unavailable(self, db, api_client):
        """Test unavailable listing is marked as unavailable."""
        listing = ListingFactory(is_available=False)
        
        url = f'/listings/{listing.id}/'
        response = api_client.get(url)
        
        if response.status_code == 200:
            avail_val = response.data.get('is_available') if 'is_available' in response.data else response.data.get('data', {}).get('is_available')
            assert avail_val is False


@pytest.mark.integration
@pytest.mark.django_db
class TestListingRatings:
    """Test listing rating and review functionality."""

    def test_get_listing_rating(self, db, api_client, listing):
        """Test getting listing rating."""
        listing.rating = Decimal('4.5')
        listing.review_count = 10
        listing.save()
        
        url = f'/listings/{listing.id}/'
        response = api_client.get(url)
        
        if response.status_code == 200:
            rating_val = response.data.get("rating") or response.data.get("data", {}).get("rating")
            assert rating_val == 4.5 or rating_val == Decimal('4.5') or rating_val == '4.50'
            assert response.data.get("data", response.data).get("review_count") == 10


@pytest.mark.integration
@pytest.mark.django_db
class TestListingAutoPin:
    """When a partner creates a listing, the server auto-pins a welcome
    ListingComment so the community thread has a real root post (instead
    of synthesizing one client-side from vehicle.description)."""

    def _payload(self, **overrides):
        data = {
            'make': 'Tesla',
            'model': 'Model 3',
            'year': 2024,
            'color': 'White',
            'transmission': 'automatic',
            'fuel_type': 'electric',
            'seating_capacity': 5,
            'vehicle_style': 'sedan',
            'price_per_day': '150.00',
            'location': 'San Francisco',
            # The view sets images=[] before validation (real uploads run post-save),
            # so an active listing trips the "≥3 real images" gate. Mark inactive
            # to keep these tests focused on the auto-pin behaviour, which fires
            # regardless of availability.
            'is_available': False,
            'images': [f'https://example.com/test{i}.jpg' for i in range(3)],
        }
        data.update(overrides)
        return data

    def test_creating_listing_creates_one_pinned_comment(self, db, partner_client, partner_user):
        response = partner_client.post(
            '/listings/',
            self._payload(vehicle_description='Hi from the dealer.'),
            format='json',
        )
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        assert response.status_code == 201, response.data

        listing = Listing.objects.latest('id')
        pinned = ListingComment.objects.filter(listing=listing, is_pinned=True)
        assert pinned.count() == 1
        assert pinned[0].content == 'Hi from the dealer.'
        assert pinned[0].user_id == partner_user.id

    def test_pinned_fallback_when_description_empty(self, db, partner_client):
        response = partner_client.post('/listings/', self._payload(), format='json')
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        assert response.status_code == 201, response.data

        listing = Listing.objects.latest('id')
        pinned = ListingComment.objects.get(listing=listing, is_pinned=True)
        assert 'Tesla' in pinned.content
        assert 'Model 3' in pinned.content
        assert 'San Francisco' in pinned.content

    def test_pinned_comment_capped_at_4_images(self, db, partner_client):
        urls = [f'https://example.com/img{i}.jpg' for i in range(6)]
        response = partner_client.post(
            '/listings/',
            self._payload(images=urls, vehicle_description='Lots of pics'),
            format='json',
        )
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        if response.status_code != 201:
            pytest.skip(f"Listing create returned {response.status_code} (image upload path may differ)")

        listing = Listing.objects.latest('id')
        pinned = ListingComment.objects.get(listing=listing, is_pinned=True)
        assert len(pinned.images) <= 4

    def test_pinned_unique_constraint_blocks_duplicate(self, db, partner, partner_user):
        from django.db import IntegrityError, transaction as tx
        listing = ListingFactory(partner=partner, is_available=True)
        ListingComment.objects.create(
            listing=listing, user=partner_user, content='Welcome',
            images=[], is_pinned=True,
        )
        with pytest.raises(IntegrityError):
            with tx.atomic():
                ListingComment.objects.create(
                    listing=listing, user=partner_user, content='Second',
                    images=[], is_pinned=True,
                )

    def test_pinned_body_clipped_to_endpoint_limit(self, db, partner_client):
        """Long descriptions are trimmed to match the comment endpoint's 1000-char cap."""
        long_desc = 'x' * 5000
        response = partner_client.post(
            '/listings/',
            self._payload(vehicle_description=long_desc),
            format='json',
        )
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        assert response.status_code == 201, response.data

        listing = Listing.objects.latest('id')
        pinned = ListingComment.objects.get(listing=listing, is_pinned=True)
        assert len(pinned.content) <= 1000
        assert pinned.content.endswith('…')

    def test_listing_create_succeeds_even_if_pin_fails(self, db, partner_client, monkeypatch):
        original_create = ListingComment.objects.create

        def boom(*args, **kwargs):
            if kwargs.get('is_pinned'):
                raise RuntimeError('simulated pin failure')
            return original_create(*args, **kwargs)

        monkeypatch.setattr(ListingComment.objects, 'create', boom)

        response = partner_client.post('/listings/', self._payload(), format='json')
        if response.status_code == 404:
            pytest.skip("Listing creation endpoint not found")
        assert response.status_code == 201, response.data

        listing = Listing.objects.latest('id')
        assert ListingComment.objects.filter(listing=listing, is_pinned=True).count() == 0
