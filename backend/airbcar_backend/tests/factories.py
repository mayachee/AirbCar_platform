"""
Factory classes for generating test data using factory-boy.
These create realistic test objects with minimal boilerplate.
"""
import factory
from faker import Faker
from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import (
    Partner, Listing, Booking, Favorite, EmailVerification,
    ListingComment, ListingReaction,
    PartnerFollow, PartnerPost,
    UserFollow,
    TripPost, TripPostReaction, TripPostComment,
)

fake = Faker()
User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating test User objects."""
    
    class Meta:
        model = User

    username = factory.Faker('user_name')
    email = factory.Faker('email')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    role = 'customer'
    is_verified = False
    is_active = True
    phone_number = factory.LazyFunction(lambda: fake.phone_number()[:20])  # Limit to 20 chars
    nationality = factory.Faker('country')
    date_of_birth = factory.Faker('date_of_birth', minimum_age=18, maximum_age=70)
    license_number = factory.Faker('numerify', text='DL########')  # Shortened to fit within limits
    license_origin_country = factory.Faker('country')
    issue_date = factory.Faker('date')
    expiry_date = factory.Faker('date')  # Changed from date_time to date

    @factory.post_generation
    def set_verified(obj, create, extracted, **kwargs):
        """Allow setting is_verified in factory call."""
        if extracted:
            obj.is_verified = extracted
            obj.save()


class PartnerFactory(factory.django.DjangoModelFactory):
    """Factory for creating test Partner objects."""
    
    class Meta:
        model = Partner

    user = factory.SubFactory(UserFactory, role='partner')
    business_name = factory.Faker('company')
    business_type = factory.Faker('random_element', elements=['individual', 'company'])
    business_license = factory.Faker('numerify', text='BIZ########')
    tax_id = factory.Faker('numerify', text='TAX########')
    bank_account = factory.Faker('numerify', text='BANK################')
    description = factory.Faker('text', max_nb_chars=200)
    address = factory.Faker('address')
    city = factory.Faker('city')
    state = factory.Faker('state')
    is_verified = False
    rating = factory.Faker('pydecimal', left_digits=1, right_digits=1, positive=True, min_value=1, max_value=5)  # Fixed: min_value must be positive
    review_count = factory.Faker('random_int', min=0, max=100)
    total_bookings = factory.Faker('random_int', min=0, max=50)
    total_earnings = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True, min_value=1)


class ListingFactory(factory.django.DjangoModelFactory):
    """Factory for creating test Listing objects."""
    
    class Meta:
        model = Listing

    partner = factory.SubFactory(PartnerFactory)
    make = factory.Faker('word')  # Car brand
    model = factory.Faker('word')  # Car model
    year = factory.Faker('random_int', min=2010, max=2024)
    color = factory.Faker('word')
    transmission = factory.Faker('random_element', elements=['manual', 'automatic'])
    fuel_type = factory.Faker('random_element', elements=['diesel', 'electric', 'hybrid'])
    seating_capacity = factory.Faker('random_int', min=2, max=7)
    vehicle_style = factory.Faker('random_element', elements=['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van'])
    price_per_day = factory.LazyFunction(lambda: Decimal(str(fake.random_int(min=30, max=300))))  # Fixed: use random_int instead of pydecimal
    location = factory.Faker('city')
    vehicle_description = factory.Faker('text', max_nb_chars=300)
    available_features = factory.LazyFunction(lambda: ['AC', 'Power Steering', 'ABS', 'Airbags', 'Sunroof'])
    images = factory.LazyFunction(lambda: [fake.image_url(), fake.image_url()])
    is_available = True
    is_verified = False
    instant_booking = False
    rating = Decimal('0.0')
    review_count = 0


class BookingFactory(factory.django.DjangoModelFactory):
    """Factory for creating test Booking objects."""
    
    class Meta:
        model = Booking

    listing = factory.SubFactory(ListingFactory)
    customer = factory.SubFactory(UserFactory, role='customer')
    partner = factory.SelfAttribute('listing.partner')
    pickup_date = factory.LazyFunction(lambda: timezone.now().date() + timedelta(days=1))
    return_date = factory.LazyFunction(lambda: timezone.now().date() + timedelta(days=5))
    pickup_time = '10:00:00'  # Fixed: use string directly instead of LazyFactory
    return_time = '10:00:00'  # Fixed: use string directly instead of LazyFactory
    pickup_location = factory.Faker('city')
    return_location = factory.Faker('city')
    total_amount = factory.LazyFunction(lambda: Decimal(str(fake.random_int(min=150, max=1500))))  # Fixed: use random_int instead of pydecimal
    status = 'pending'
    payment_status = 'pending'
    payment_method = factory.Faker('random_element', elements=['online', 'cash'])
    request_message = factory.Faker('sentence', nb_words=15)


class FavoriteFactory(factory.django.DjangoModelFactory):
    """Factory for creating test Favorite objects."""
    
    class Meta:
        model = Favorite
        django_get_or_create = ('user', 'listing')

    user = factory.SubFactory(UserFactory)
    listing = factory.SubFactory(ListingFactory)


class EmailVerificationFactory(factory.django.DjangoModelFactory):
    """Factory for creating test EmailVerification objects."""

    class Meta:
        model = EmailVerification

    user = factory.SubFactory(UserFactory)
    token = factory.Faker('sha256')
    created_at = factory.LazyFunction(timezone.now)
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(hours=24))
    is_used = False


# ---------------------------------------------------------------------------
# Social layer factories
# ---------------------------------------------------------------------------

class ListingCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ListingComment

    listing = factory.SubFactory(ListingFactory)
    user = factory.SubFactory(UserFactory)
    parent = None
    content = factory.Faker('sentence', nb_words=10)
    is_active = True


class ListingReactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ListingReaction
        django_get_or_create = ('listing', 'user')

    listing = factory.SubFactory(ListingFactory)
    user = factory.SubFactory(UserFactory)
    reaction = 'like'


class PartnerFollowFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PartnerFollow
        django_get_or_create = ('user', 'partner')

    user = factory.SubFactory(UserFactory)
    partner = factory.SubFactory(PartnerFactory)


class PartnerPostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PartnerPost

    partner = factory.SubFactory(PartnerFactory)
    content = factory.Faker('paragraph', nb_sentences=2)
    post_type = 'update'
    image_url = None
    linked_listing = None
    is_active = True


class UserFollowFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserFollow
        django_get_or_create = ('follower', 'following')

    follower = factory.SubFactory(UserFactory)
    following = factory.SubFactory(UserFactory)


class TripPostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TripPost

    booking = factory.SubFactory(BookingFactory, status='completed')
    user = factory.SelfAttribute('booking.customer')
    caption = factory.Faker('sentence', nb_words=12)
    images = factory.LazyFunction(lambda: ['https://example.com/img1.jpg'])
    is_active = True


class TripPostReactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TripPostReaction
        django_get_or_create = ('trip_post', 'user')

    trip_post = factory.SubFactory(TripPostFactory)
    user = factory.SubFactory(UserFactory)
    reaction = 'like'


class TripPostCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TripPostComment

    trip_post = factory.SubFactory(TripPostFactory)
    user = factory.SubFactory(UserFactory)
    parent = None
    content = factory.Faker('sentence', nb_words=8)
    is_active = True
