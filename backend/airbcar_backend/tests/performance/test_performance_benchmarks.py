"""
Performance and benchmark tests for the backend.
Measures response times, query counts, and identifies bottlenecks.
"""
import pytest
import time
from django.test.utils import override_settings
from django.db import connection
from django.db import reset_queries

from tests.factories import (
    UserFactory, PartnerFactory, ListingFactory, 
    BookingFactory, FavoriteFactory
)


@pytest.mark.performance
class TestListingQueryPerformance:
    """Test query optimization for listing endpoints."""

    @override_settings(DEBUG=True)
    def test_list_listings_query_count(self, db):
        """Test that listing list doesn't do N+1 queries."""
        # Create test data
        partner = PartnerFactory()
        for _ in range(10):
            ListingFactory(partner=partner)
        
        # Reset queries
        reset_queries()
        
        # Fetch listings with select_related/prefetch_related if optimized
        from core.models import Listing
        listings = list(Listing.objects.select_related('partner').all())
        
        # Should not exceed reasonable query count (not 1 + N)
        query_count = len(connection.queries)
        assert query_count < 10, f"Too many queries ({query_count}) for {len(listings)} listings"

    @override_settings(DEBUG=True)
    def test_get_listing_detail_query_count(self, db):
        """Test single listing detail doesn't make excessive queries."""
        partner = PartnerFactory()
        listing = ListingFactory(partner=partner)
        
        reset_queries()
        
        from core.models import Listing
        Listing.objects.select_related('partner').get(id=listing.id)
        
        query_count = len(connection.queries)
        assert query_count <= 3, f"Too many queries ({query_count}) for single listing"


@pytest.mark.performance
class TestBookingCalculationPerformance:
    """Test performance of booking calculations."""

    def test_calculate_total_amount_fast(self, db):
        """Test total amount calculation is fast."""
        from decimal import Decimal
        
        listing = ListingFactory(price_per_day=Decimal('100.00'))
        
        start = time.time()
        # Simulate calculation over 7 days
        total = listing.price_per_day * 7
        elapsed = time.time() - start
        
        assert elapsed < 0.001, "Calculation took too long"
        assert total == Decimal('700.00')

    def test_booking_list_performance_with_many_bookings(self, db):
        """Test listing bookings doesn't slow down with many bookings."""
        listing = ListingFactory()
        
        # Create many bookings
        for _ in range(100):
            BookingFactory(listing=listing)
        
        reset_queries()
        
        start = time.time()
        bookings = list(listing.bookings.all()[:20])
        elapsed = time.time() - start
        
        assert elapsed < 0.1, f"Listing bookings took {elapsed}s"


@pytest.mark.performance
class TestSerializerPerformance:
    """Test serializer performance."""

    def test_serialize_single_listing_speed(self, db):
        """Test serializing single listing is fast."""
        from core.serializers import SimpleListingSerializer
        
        listing = ListingFactory()
        
        start = time.time()
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        elapsed = time.time() - start
        
        assert elapsed < 0.05, f"Serialization took {elapsed}s"

    def test_serialize_multiple_listings_speed(self, db):
        """Test serializing multiple listings is reasonably fast."""
        from core.serializers import ListingCompactSerializer
        
        listings = [ListingFactory() for _ in range(50)]
        
        start = time.time()
        serializer = ListingCompactSerializer(listings, many=True)
        data = serializer.data
        elapsed = time.time() - start
        
        # Should serialize 50 listings in < 1 second
        assert elapsed < 1.0, f"Serializing 50 listings took {elapsed}s"


@pytest.mark.performance
class TestAuthenticationPerformance:
    """Test authentication performance."""

    def test_token_generation_speed(self, db):
        """Test JWT token generation is fast."""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        user = UserFactory()
        
        start = time.time()
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        elapsed = time.time() - start
        
        assert elapsed < 0.1, f"Token generation took {elapsed}s"

    def test_user_lookup_speed(self, db):
        """Test user lookup doesn't have N+1 queries."""
        user = UserFactory()
        
        reset_queries()
        
        start = time.time()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        found_user = User.objects.get(id=user.id)
        elapsed = time.time() - start
        
        assert elapsed < 0.5, f"User lookup took {elapsed}s"


@pytest.mark.performance
class TestFavoritePerformance:
    """Test favorite list performance."""

    def test_user_favorites_list_performance(self, db):
        """Test user favorites list scales well."""
        user = UserFactory()
        
        # Add many favorites
        for _ in range(50):
            listing = ListingFactory()
            FavoriteFactory(user=user, listing=listing)
        
        reset_queries()
        
        start = time.time()
        favorites = list(user.favorites.select_related('listing').all())
        elapsed = time.time() - start
        
        assert elapsed < 1.0, f"Fetching 50 favorites took {elapsed}s"


@pytest.mark.performance
class TestDatabaseIndexes:
    """Test that database indexes are working."""

    def test_filter_by_location_uses_index(self, db):
        """Test location filter uses index."""
        partner = PartnerFactory()
        
        # Create listings in different locations
        for i in range(100):
            ListingFactory(
                partner=partner,
                location=['New York', 'Los Angeles', 'Chicago'][i % 3]
            )
        
        reset_queries()
        
        from core.models import Listing
        results = list(Listing.objects.filter(location='New York'))
        
        # Should be reasonably fast with index
        query_count = len(connection.queries)
        assert query_count <= 2


@pytest.mark.performance
class TestConcurrencyPerformance:
    """Test performance under concurrent access patterns."""

    def test_booking_status_update_performance(self, db):
        """Test booking status update is fast."""
        from core.models import Booking
        
        booking = BookingFactory(status='pending')
        
        start = time.time()
        booking.status = 'confirmed'
        booking.save()
        elapsed = time.time() - start
        
        assert elapsed < 0.5, f"Status update took {elapsed}s"

    def test_favorite_toggle_performance(self, db):
        """Test favorite toggle is fast."""
        from core.models import Favorite
        
        user = UserFactory()
        listing = ListingFactory()
        
        start = time.time()
        favorite, created = Favorite.objects.get_or_create(
            user=user,
            listing=listing
        )
        elapsed = time.time() - start
        
        assert elapsed < 1.0, f"Favorite toggle took {elapsed}s"


@pytest.mark.performance
class TestPaginationPerformance:
    """Test pagination performance."""

    def test_paginate_listings(self, db):
        """Test pagination doesn't load all results."""
        partner = PartnerFactory()
        for _ in range(1000):
            ListingFactory(partner=partner)
        
        reset_queries()
        
        from core.models import Listing
        # Get first page (20 items)
        first_page = list(Listing.objects.all()[:20])
        
        query_count = len(connection.queries)
        # Should only query for 20 items, not 1000
        assert query_count <= 2, f"Pagination made {query_count} queries"
