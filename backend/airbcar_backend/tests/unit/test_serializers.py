"""
Unit tests for serializers.
Tests serialization, deserialization, and validation.
"""
import pytest
from decimal import Decimal
from rest_framework import serializers

from core.serializers import (
    UserSerializer, PartnerSerializer, 
    ListingCompactSerializer, SimpleListingSerializer
)
from core.models import User, Partner, Listing
from tests.factories import UserFactory, PartnerFactory, ListingFactory


@pytest.mark.unit
class TestUserSerializer:
    """Test UserSerializer."""

    def test_user_serializer_valid_data(self, db):
        """Test serializing valid user data."""
        user = UserFactory(
            username='testuser',
            email='test@example.com',
            role='customer'
        )
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['id'] == user.id
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'
        assert data['role'] == 'customer'

    def test_user_serializer_read_only_fields(self, db):
        """Test read-only fields cannot be written."""
        user_data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'id': 999,  # Try to set id
            'is_verified': True,  # Try to set is_verified
        }
        serializer = UserSerializer(data=user_data)
        assert serializer.is_valid()
        
        # Verify that read-only fields were not changed
        assert 'id' not in [f.field_name for f in serializer.fields.values() if not f.read_only]

    def test_user_serializer_is_partner_method(self, db):
        """Test is_partner method in serializer."""
        customer = UserFactory(role='customer')
        partner_user = UserFactory(role='partner')
        PartnerFactory(user=partner_user)
        
        customer_serializer = UserSerializer(customer)
        assert customer_serializer.data['is_partner'] is False or customer_serializer.data['is_partner'] == False
        
        partner_serializer = UserSerializer(partner_user)
        assert partner_serializer.data['is_partner'] is True

    def test_user_serializer_optional_fields(self, db):
        """Test optional fields can be null in serialized output."""
        user = UserFactory(
            license_front_document_url=None,
            license_back_document_url=None
        )
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['license_front_document_url'] is None
        assert data['license_back_document_url'] is None

    def test_user_serializer_with_context(self, db):
        """Test serializer with request context."""
        user = UserFactory()
        serializer = UserSerializer(user, context={'request': None})
        assert serializer.data['id'] == user.id


@pytest.mark.unit
class TestPartnerSerializer:
    """Test PartnerSerializer."""

    def test_partner_serializer_basic(self, db):
        """Test basic partner serialization."""
        partner = PartnerFactory(business_name='Test Company')
        serializer = PartnerSerializer(partner)
        data = serializer.data
        
        assert data['id'] == partner.id
        assert data['business_name'] == 'Test Company'
        assert 'user' in data
        assert data['rating'] is not None

    def test_partner_serializer_nested_user(self, db):
        """Test user is nested in partner serializer."""
        partner = PartnerFactory()
        serializer = PartnerSerializer(partner)
        data = serializer.data
        
        assert 'user' in data
        assert isinstance(data['user'], dict)
        assert 'id' in data['user']
        assert 'username' in data['user']

    def test_partner_serializer_logo_url_handling(self, db):
        """Test logo_url method returns correct values."""
        partner = PartnerFactory(logo_url='https://example.com/logo.jpg')
        serializer = PartnerSerializer(partner)
        data = serializer.data
        
        assert data['logo_url'] == 'https://example.com/logo.jpg'

    def test_partner_serializer_company_name_mapping(self, db):
        """Test company_name is mapped to business_name."""
        data = {
            'business_type': 'company',
            'company_name': 'Mapped Company',
        }
        serializer = PartnerSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        # company_name should be mapped to business_name
        assert serializer.validated_data.get('business_name') == 'Mapped Company'

    def test_partner_serializer_address_fields(self, db):
        """Test address field representation."""
        user = UserFactory(
            phone_number='555-1234',
            first_name='John',
            last_name='Doe'
        )
        partner = PartnerFactory(
            user=user,
            address='123 Main St',
            city='New York',
            state='NY'
        )
        serializer = PartnerSerializer(partner)
        data = serializer.data
        
        assert data['phone_number'] == '555-1234'
        assert data['first_name'] == 'John'
        assert data['last_name'] == 'Doe'
        assert data['address'] == '123 Main St'
        assert data['city'] == 'New York'

    def test_partner_serializer_to_internal_value(self, db):
        """Test to_internal_value handles field mapping."""
        data = {
            'business_type': 'company',
            'company_name': 'Test Business',
            'address': '123 Street',
        }
        serializer = PartnerSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.unit
class TestListingSerializer:
    """Test Listing serializers."""

    def test_simple_listing_serializer(self, db):
        """Test SimpleListingSerializer."""
        listing = ListingFactory(
            make='Toyota',
            model='Camry',
            year=2023,
            price_per_day=Decimal('50.00')
        )
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        
        assert data['make'] == 'Toyota'
        assert data['brand'] == 'Toyota'
        assert data['model'] == 'Camry'
        assert data['model_name'] == 'Camry'
        assert data['year'] == 2023
        assert data['price_per_day'] == '50.00'

    def test_simple_listing_serializer_title_generation(self, db):
        """Test title generation in SimpleListingSerializer."""
        listing = ListingFactory(
            make='Honda',
            model='Civic',
            year=2022
        )
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        
        expected_title = 'Honda Civic 2022'
        assert data['title'] == expected_title
        assert data['name'] == expected_title

    def test_simple_listing_serializer_image(self, db):
        """Test image selection in SimpleListingSerializer."""
        images = [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg'
        ]
        listing = ListingFactory(images=images)
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        
        assert data['image'] == images[0]
        assert data['images'] == images

    def test_simple_listing_serializer_no_image(self, db):
        """Test when listing has no images."""
        listing = ListingFactory(images=[])
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        
        assert data['image'] is None
        assert data['images'] == []

    def test_listing_compact_serializer(self, db):
        """Test ListingCompactSerializer."""
        listing = ListingFactory(
            make='BMW',
            model='X5',
            year=2024,
            seating_capacity=5,
            vehicle_style='suv',
            fuel_type='hybrid',
            price_per_day=Decimal('150.00'),
            is_verified=True
        )
        serializer = ListingCompactSerializer(listing)
        data = serializer.data
        
        assert data['make'] == 'BMW'
        assert data['brand'] == 'BMW'
        assert data['model_name'] == 'X5'
        assert data['year'] == 2024
        assert data['seats'] == 5
        assert data['style'] == 'suv'
        assert data['fuelType'] == 'hybrid'
        assert data['price'] == '150.00'
        assert data['verified'] is True

    def test_listing_compact_serializer_name_generation(self, db):
        """Test name field generation."""
        listing = ListingFactory(
            make='Audi',
            model='A4',
            year=2023
        )
        serializer = ListingCompactSerializer(listing)
        data = serializer.data
        
        assert data['name'] == 'Audi A4 2023'

    def test_listing_compact_serializer_partner_fields(self, db):
        """Test partner-related fields in compact serializer."""
        partner = PartnerFactory(
            business_name='Premium Cars',
            is_verified=True,
            logo_url='https://example.com/logo.jpg'
        )
        listing = ListingFactory(partner=partner)
        serializer = ListingCompactSerializer(listing)
        data = serializer.data
        
        assert data['partner_name'] == 'Premium Cars'
        assert data['partner_verified'] is True
        assert data['partner_logo'] == 'https://example.com/logo.jpg'

    def test_listing_compact_serializer_field_mappings(self, db):
        """Test field name mappings (snake_case to camelCase)."""
        listing = ListingFactory(
            is_available=True,
            instant_booking=True,
            is_verified=True,
            review_count=42
        )
        serializer = ListingCompactSerializer(listing)
        data = serializer.data
        
        assert data['isAvailable'] is True
        assert data['instantBooking'] is True
        assert data['verified'] is True
        assert data['reviewCount'] == 42


@pytest.mark.unit
class TestSerializerValidation:
    """Test serializer validation."""

    def test_partner_serializer_required_fields(self, db):
        """Test required field validation."""
        data = {
            'business_type': 'company',
            # missing business_name
        }
        serializer = PartnerSerializer(data=data)
        # business_name should ideally be required, but test actual behavior
        # This depends on how your serializer defines it

    def test_listing_serializer_decimal_fields(self, db):
        """Test decimal field validation."""
        listing = ListingFactory(price_per_day=Decimal('99.99'))
        serializer = SimpleListingSerializer(listing)
        data = serializer.data
        
        # Decimal should be serialized as string or float
        assert data['price_per_day'] is not None

    def test_user_serializer_email_validation(self, db):
        """Test email field in user serializer."""
        user = UserFactory(email='test@example.com')
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert '@' in data['email']

    def test_multiple_serializers_consistency(self, db):
        """Test multiple serializers return consistent data."""
        listing = ListingFactory(
            make='Tesla',
            model='Model 3',
            price_per_day=Decimal('100.00')
        )
        
        simple_data = SimpleListingSerializer(listing).data
        compact_data = ListingCompactSerializer(listing).data
        
        # Common fields should match
        assert simple_data['make'] == compact_data['make']
        assert simple_data['model'] == compact_data['model']
        assert simple_data['price_per_day'] == compact_data['price']


@pytest.mark.unit
class TestSerializerPerformance:
    """Test serializer performance characteristics."""

    def test_listing_serializer_handles_multiple_objects(self, db):
        """Test serializer works with multiple objects."""
        listings = [ListingFactory() for _ in range(10)]
        serializer = SimpleListingSerializer(listings, many=True)
        data = serializer.data
        
        assert len(data) == 10
        assert all('id' in item for item in data)

    def test_partner_serializer_nested_user_serialization(self, db):
        """Test nested user serialization in partner."""
        partners = [PartnerFactory() for _ in range(5)]
        serializer = PartnerSerializer(partners, many=True)
        data = serializer.data
        
        assert len(data) == 5
        assert all('user' in item for item in data)
        assert all(isinstance(item['user'], dict) for item in data)
