"""
Pytest configuration and shared fixtures for all tests.
"""
import os
import sys
import django

# Add backend directory to Python path so Django modules can be imported
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Partner, Listing, Booking, Favorite, EmailVerification
from tests.factories import UserFactory, PartnerFactory, ListingFactory, BookingFactory


User = get_user_model()


# ===== FIXTURES: USER CREATION =====
@pytest.fixture
def user():
    """Create a basic test customer user."""
    return UserFactory(role='customer')


@pytest.fixture
def partner_user():
    """Create a partner user with partner profile."""
    user = UserFactory(role='partner')
    partner = PartnerFactory(user=user)
    return user


@pytest.fixture
def admin_user():
    """Create an admin user."""
    return UserFactory(role='admin', is_staff=True, is_superuser=True)


@pytest.fixture
def multiple_users(db):
    """Create multiple users for sorting/pagination tests."""
    return [UserFactory(role='customer') for _ in range(5)]


# ===== FIXTURES: PARTNER AND LISTING =====
@pytest.fixture
def partner(db):
    """Create a partner with profile."""
    user = UserFactory(role='partner', is_verified=True)
    return PartnerFactory(user=user, is_verified=True)


@pytest.fixture
def listing(db, partner):
    """Create a car listing."""
    return ListingFactory(partner=partner, is_available=True)


@pytest.fixture
def multiple_listings(db, partner):
    """Create multiple listings for search/filter tests."""
    return [ListingFactory(partner=partner, is_available=True) for _ in range(10)]


# ===== FIXTURES: BOOKING =====
@pytest.fixture
def booking(db, user, listing):
    """Create a booking."""
    return BookingFactory(
        customer=user,
        listing=listing,
        partner=listing.partner,
        status='pending'
    )


@pytest.fixture
def confirmed_booking(db, user, listing):
    """Create a confirmed booking."""
    return BookingFactory(
        customer=user,
        listing=listing,
        partner=listing.partner,
        status='confirmed'
    )


@pytest.fixture
def completed_booking(db, user, listing):
    """Create a completed booking."""
    return BookingFactory(
        customer=user,
        listing=listing,
        partner=listing.partner,
        status='completed'
    )


# ===== FIXTURES: API CLIENTS =====
@pytest.fixture
def api_client():
    """Create an unauthenticated API client."""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Create an authenticated API client for a customer user."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def partner_client(api_client, partner_user):
    """Create an authenticated API client for a partner user."""
    refresh = RefreshToken.for_user(partner_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Create an authenticated API client for an admin user."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


# ===== FIXTURES: DATABASE CLEANUP =====
@pytest.fixture(autouse=True)
def reset_sequences(db):
    """Reset database sequences after each test to ensure fresh IDs."""
    yield
    # Cleanup is handled by pytest-django's transactional support


# ===== FIXTURES: PERFORMANCE TESTING =====
@pytest.fixture
def performance_data(db):
    """Create large dataset for performance testing."""
    partner = PartnerFactory(is_verified=True)
    listings = [ListingFactory(partner=partner, is_available=True) for _ in range(50)]
    users = [UserFactory(role='customer') for _ in range(100)]
    bookings = [
        BookingFactory(
            customer=users[i % len(users)],
            listing=listings[i % len(listings)],
            partner=partner,
            status='completed'
        )
        for i in range(500)
    ]
    return {
        'partner': partner,
        'listings': listings,
        'users': users,
        'bookings': bookings,
    }


# ===== FIXTURES: RESPONSE VALIDATION =====
@pytest.fixture
def assert_valid_user_response():
    """Helper to validate user response structure."""
    def _assert(data):
        assert 'id' in data
        assert 'username' in data
        assert 'email' in data
        assert 'role' in data
        assert 'is_verified' in data
    return _assert


@pytest.fixture
def assert_valid_listing_response():
    """Helper to validate listing response structure."""
    def _assert(data):
        assert 'id' in data
        assert 'make' in data
        assert 'model' in data
        assert 'year' in data
        assert 'price_per_day' in data
        assert 'location' in data
        assert 'is_available' in data
        assert 'rating' in data
    return _assert


@pytest.fixture
def assert_valid_booking_response():
    """Helper to validate booking response structure."""
    def _assert(data):
        assert 'id' in data
        assert 'listing' in data
        assert 'customer' in data
        assert 'status' in data
        assert 'total_amount' in data
        assert 'pickup_date' in data
        assert 'return_date' in data
    return _assert
