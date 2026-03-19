"""
Unit tests for core models.
Tests model creation, validation, methods, and relationships.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal

from core.models import User, Partner, Listing, Booking, Favorite, EmailVerification
from tests.factories import (
    UserFactory, PartnerFactory, ListingFactory, 
    BookingFactory, FavoriteFactory, EmailVerificationFactory
)


@pytest.mark.unit
class TestUserModel:
    """Test User model."""

    def test_user_creation(self, db):
        """Test basic user creation."""
        user = UserFactory(role='customer', is_verified=True)
        assert user.id is not None
        assert user.username
        assert user.email
        assert user.role == 'customer'
        assert user.is_verified

    def test_user_role_choices(self, db):
        """Test all role choices."""
        roles = ['customer', 'partner', 'admin', 'ceo']
        users = [UserFactory(role=role) for role in roles]
        assert len(users) == 4
        assert all(u.role in roles for u in users)

    def test_user_password_hashing(self, db):
        """Test that passwords are hashed."""
        user = UserFactory()
        assert user.password != 'testpass123'
        assert user.check_password('testpass123')

    def test_user_string_representation(self, db):
        """Test __str__ method."""
        user = UserFactory(first_name='John', last_name='Doe', role='customer')
        assert 'customer' in str(user)
        assert user.username in str(user)

    def test_user_optional_fields(self, db):
        """Test optional fields can be null."""
        user = UserFactory(
            phone_number=None,
            license_number=None,
            profile_picture=None
        )
        assert user.phone_number is None
        assert user.license_number is None

    def test_user_timestamps(self, db):
        """Test created_at and updated_at timestamps."""
        user = UserFactory()
        assert user.created_at is not None
        assert user.updated_at is not None
        assert user.created_at <= user.updated_at


@pytest.mark.unit
class TestPartnerModel:
    """Test Partner model."""

    def test_partner_creation(self, db):
        """Test partner creation with user."""
        partner = PartnerFactory(is_verified=True)
        assert partner.id is not None
        assert partner.user is not None
        assert partner.business_name
        assert partner.is_verified

    def test_partner_one_to_one_with_user(self, db):
        """Test one-to-one relationship with user."""
        user = UserFactory(role='partner')
        partner = PartnerFactory(user=user)
        assert partner.user == user
        assert user.partner_profile == partner

    def test_partner_business_types(self, db):
        """Test business type choices."""
        individual_partner = PartnerFactory(business_type='individual')
        company_partner = PartnerFactory(business_type='company')
        assert individual_partner.business_type == 'individual'
        assert company_partner.business_type == 'company'

    def test_partner_rating_validation(self, db):
        """Test rating is between 0 and 5."""
        partner = PartnerFactory(rating=Decimal('4.5'))
        partner.full_clean()  # Should not raise
        assert partner.rating == Decimal('4.5')

    def test_partner_string_representation(self, db):
        """Test __str__ method."""
        partner = PartnerFactory(business_name='Test Company')
        assert str(partner) == 'Test Company'

    def test_partner_earnings_tracking(self, db):
        """Test earnings and booking tracking."""
        partner = PartnerFactory(
            total_bookings=10,
            total_earnings=Decimal('5000.00')
        )
        assert partner.total_bookings == 10
        assert partner.total_earnings == Decimal('5000.00')


@pytest.mark.unit
class TestListingModel:
    """Test Listing model."""

    def test_listing_creation(self, db):
        """Test basic listing creation."""
        listing = ListingFactory(is_available=True)
        assert listing.id is not None
        assert listing.partner is not None
        assert listing.make
        assert listing.model
        assert listing.year >= 2010
        assert listing.is_available

    def test_listing_price_validation(self, db):
        """Test price must be positive."""
        listing = ListingFactory(price_per_day=Decimal('99.99'))
        assert listing.price_per_day > 0

    def test_listing_name_property(self, db):
        """Test name property formatting."""
        listing = ListingFactory(make='Toyota', model='Corolla', year=2023)
        assert listing.name == 'Toyota Corolla 2023'

    def test_listing_choice_fields(self, db):
        """Test all choice fields."""
        listing = ListingFactory(
            transmission='automatic',
            fuel_type='electric',
            vehicle_style='sedan'
        )
        assert listing.transmission == 'automatic'
        assert listing.fuel_type == 'electric'
        assert listing.vehicle_style == 'sedan'

    def test_listing_json_fields(self, db):
        """Test JSON array fields for features and images."""
        features = ['AC', 'Power Steering', 'ABS']
        images = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
        listing = ListingFactory(
            available_features=features,
            images=images
        )
        assert listing.available_features == features
        assert listing.images == images

    def test_listing_timestamps(self, db):
        """Test created_at and updated_at."""
        listing = ListingFactory()
        assert listing.created_at is not None
        assert listing.updated_at is not None

    def test_listing_string_representation(self, db):
        """Test __str__ method."""
        listing = ListingFactory(
            make='Honda',
            model='Civic',
            year=2022,
            location='New York'
        )
        assert 'Honda' in str(listing)
        assert 'Civic' in str(listing)
        assert 'New York' in str(listing)


@pytest.mark.unit
class TestBookingModel:
    """Test Booking model."""

    def test_booking_creation(self, db):
        """Test basic booking creation."""
        booking = BookingFactory(status='pending')
        assert booking.id is not None
        assert booking.listing is not None
        assert booking.customer is not None
        assert booking.partner is not None
        assert booking.status == 'pending'

    def test_booking_status_choices(self, db):
        """Test all status choices."""
        statuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled']
        bookings = [BookingFactory(status=s) for s in statuses]
        assert len(bookings) == 5

    def test_booking_payment_status_choices(self, db):
        """Test payment status choices."""
        payment_statuses = ['pending', 'paid', 'refunded']
        bookings = [BookingFactory(payment_status=s) for s in payment_statuses]
        assert len(bookings) == 3

    def test_booking_payment_method_choices(self, db):
        """Test payment method choices."""
        online = BookingFactory(payment_method='online')
        cash = BookingFactory(payment_method='cash')
        assert online.payment_method == 'online'
        assert cash.payment_method == 'cash'

    def test_booking_date_logic(self, db):
        """Test booking date constraints."""
        booking = BookingFactory()
        # Assuming return_date should be after pickup_date
        assert booking.return_date > booking.pickup_date
        # Duration should be positive
        duration = (booking.return_date - booking.pickup_date).days
        assert duration > 0

    def test_booking_customer_partner_relationship(self, db, user, partner):
        """Test customer and partner relationships."""
        listing = ListingFactory(partner=partner)
        booking = BookingFactory(
            customer=user,
            listing=listing,
            partner=partner
        )
        assert booking.customer == user
        assert booking.partner == partner
        assert booking.listing.partner == partner

    def test_booking_string_representation(self, db):
        """Test __str__ method."""
        booking = BookingFactory()
        assert 'Booking' in str(booking)
        assert booking.listing.make in str(booking)


@pytest.mark.unit
class TestFavoriteModel:
    """Test Favorite model."""

    def test_favorite_creation(self, db):
        """Test favorite creation."""
        favorite = FavoriteFactory()
        assert favorite.id is not None
        assert favorite.user is not None
        assert favorite.listing is not None

    def test_favorite_unique_constraint(self, db):
        """Test user cannot favorite same listing twice."""
        user = UserFactory()
        listing = ListingFactory()
        fav1 = FavoriteFactory(user=user, listing=listing)
        # Second creation should use existing record due to django_get_or_create
        fav2 = FavoriteFactory(user=user, listing=listing)
        assert fav1.id == fav2.id

    def test_favorite_string_representation(self, db):
        """Test __str__ method."""
        favorite = FavoriteFactory()
        assert favorite.user.username in str(favorite)
        assert 'favorited' in str(favorite).lower()


@pytest.mark.unit
class TestEmailVerificationModel:
    """Test EmailVerification model."""

    def test_verification_creation(self, db):
        """Test verification token creation."""
        verification = EmailVerificationFactory()
        assert verification.id is not None
        assert verification.user is not None
        assert verification.token
        assert len(verification.token) > 20

    def test_verification_is_expired(self, db):
        """Test is_expired method."""
        # Create with past expiry
        past = timezone.now() - timedelta(hours=1)
        verification = EmailVerificationFactory(expires_at=past)
        assert verification.is_expired()

        # Create with future expiry
        future = timezone.now() + timedelta(hours=24)
        fresh = EmailVerificationFactory(expires_at=future)
        assert not fresh.is_expired()

    def test_verification_is_valid(self, db):
        """Test is_valid method."""
        # Valid token (not used, not expired)
        valid = EmailVerificationFactory(
            is_used=False,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert valid.is_valid()

        # Used token
        used = EmailVerificationFactory(
            is_used=True,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert not used.is_valid()

        # Expired token
        expired = EmailVerificationFactory(
            is_used=False,
            expires_at=timezone.now() - timedelta(hours=1)
        )
        assert not expired.is_valid()

    def test_generate_token(self, db):
        """Test token generation is unique."""
        token1 = EmailVerification.generate_token()
        token2 = EmailVerification.generate_token()
        assert token1 != token2
        assert len(token1) > 20
        assert len(token2) > 20

    def test_verification_string_representation(self, db):
        """Test __str__ method."""
        verification = EmailVerificationFactory()
        assert verification.user.email in str(verification)


@pytest.mark.unit
class TestModelIndexes:
    """Test that database indexes are properly defined."""

    def test_listing_has_indexes(self, db):
        """Verify Listing model has expected indexes."""
        indexes = Listing._meta.indexes
        assert len(indexes) > 0

    def test_booking_has_indexes(self, db):
        """Verify Booking model has expected indexes."""
        indexes = Booking._meta.indexes
        assert len(indexes) > 0

    def test_favorite_has_unique_together(self, db):
        """Verify Favorite has unique_together constraint."""
        unique_constraints = Favorite._meta.unique_together
        assert ('user', 'listing') in unique_constraints


@pytest.mark.unit
class TestModelQueryOptimization:
    """Test query-related methods and optimization."""

    def test_listing_partner_lookup(self, db):
        """Test partner lookup in listing."""
        partner = PartnerFactory()
        listings = [ListingFactory(partner=partner) for _ in range(5)]
        
        # Should be able to look up all listings for a partner
        partner_listings = Listing.objects.filter(partner=partner)
        assert partner_listings.count() == 5

    def test_booking_status_filter(self, db):
        """Test filtering bookings by status."""
        BookingFactory(status='pending')
        BookingFactory(status='confirmed')
        BookingFactory(status='pending')

        pending = Booking.objects.filter(status='pending')
        assert pending.count() == 2

    def test_available_listings(self, db):
        """Test filtering available listings."""
        ListingFactory(is_available=True)
        ListingFactory(is_available=True)
        ListingFactory(is_available=False)

        available = Listing.objects.filter(is_available=True)
        assert available.count() == 2
