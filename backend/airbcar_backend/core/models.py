"""
Django models for AirbCar platform.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
import secrets
import json


class User(AbstractUser):
    """Extended user model with additional fields."""
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('partner', 'Partner'),
        ('admin', 'Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True, help_text='URL for profile picture (e.g., Google profile picture)')
    is_verified = models.BooleanField(default=False)
    
    # Personal Information
    date_of_birth = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    
    # License Information
    license_number = models.CharField(max_length=100, blank=True, null=True)
    license_origin_country = models.CharField(max_length=100, blank=True, null=True)
    issue_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    # License Documents (Front and Back)
    license_front_document = models.ImageField(upload_to='license_documents/', blank=True, null=True, help_text='Front side of driver license')
    license_back_document = models.ImageField(upload_to='license_documents/', blank=True, null=True, help_text='Back side of driver license')
    # License Document URLs (Supabase Storage)
    license_front_document_url = models.URLField(max_length=500, blank=True, null=True, help_text='Public URL for front license hosted on Supabase')
    license_back_document_url = models.URLField(max_length=500, blank=True, null=True, help_text='Public URL for back license hosted on Supabase')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Partner(models.Model):
    """Partner/owner information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner_profile')
    business_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=50, choices=[('individual', 'Individual'), ('company', 'Company')])
    business_license = models.CharField(max_length=100, blank=True, null=True)
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    bank_account = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True, help_text='Partner company description')
    logo = models.ImageField(upload_to='partner_logos/', blank=True, null=True, help_text='Partner company logo')
    logo_url = models.URLField(max_length=500, blank=True, null=True, help_text='Public URL for logo hosted on Supabase')
    is_verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    review_count = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


class EmailVerification(models.Model):
    """Email verification token model."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verifications')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
        ]
    
    def __str__(self):
        return f"Verification for {self.user.email}"
    
    def is_expired(self):
        """Check if the verification token has expired."""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if the verification token is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired()
    
    @staticmethod
    def generate_token():
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)


class Listing(models.Model):
    """Vehicle listing model."""
    TRANSMISSION_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
    ]
    
    FUEL_TYPE_CHOICES = [
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
    ]
    
    STYLE_CHOICES = [
        ('sedan', 'Sedan'),
        ('suv', 'SUV'),
        ('hatchback', 'Hatchback'),
        ('coupe', 'Coupe'),
        ('convertible', 'Convertible'),
        ('truck', 'Truck'),
        ('van', 'Van'),
    ]
    
    # Basic Information
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='listings')
    make = models.CharField(max_length=100)  # brand
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    color = models.CharField(max_length=50)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES)
    seating_capacity = models.IntegerField()  # seats
    vehicle_style = models.CharField(max_length=20, choices=STYLE_CHOICES)  # style
    
    # Pricing and Location
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    location = models.CharField(max_length=200)
    
    # Description and Features
    vehicle_description = models.TextField(blank=True, null=True)
    available_features = models.JSONField(default=list, blank=True)  # features as JSON array
    
    # Images
    images = models.JSONField(default=list, blank=True)  # images as JSON array
    
    # Status and Verification
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    instant_booking = models.BooleanField(default=False)
    
    # Ratings
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    review_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['location', 'is_available']),
            models.Index(fields=['is_available', 'is_verified']),
            models.Index(fields=['price_per_day', 'is_available']),
            models.Index(fields=['make', 'model']),
            models.Index(fields=['rating', 'review_count']),
            models.Index(fields=['partner', 'is_available']),
            models.Index(fields=['created_at']),  # For sorting
            # Single field indexes for filtering
            models.Index(fields=['transmission']),
            models.Index(fields=['fuel_type']),
            models.Index(fields=['vehicle_style']),
            models.Index(fields=['seating_capacity']),
        ]

    def __str__(self):
        return f"{self.make} {self.model} ({self.year}) - {self.location}"
    
    @property
    def name(self):
        """Return formatted vehicle name."""
        return f"{self.make} {self.model} {self.year}"


class Booking(models.Model):
    """Booking model."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('online', 'Online'),
        ('cash', 'Cash'),
    ]
    
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='bookings')
    
    # Dates
    pickup_date = models.DateField()
    return_date = models.DateField()
    pickup_time = models.TimeField(default='10:00:00')
    return_time = models.TimeField(default='10:00:00')
    
    # Locations
    pickup_location = models.CharField(max_length=200)
    return_location = models.CharField(max_length=200)
    
    # Pricing
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='online', help_text='Payment method: online or cash')
    
    # Optional message from renter to car owner
    request_message = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # License documents for this specific booking
    license_front_document = models.URLField(max_length=500, blank=True, null=True)
    license_back_document = models.URLField(max_length=500, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['partner', 'status']),
            models.Index(fields=['listing', 'status']),
            models.Index(fields=['pickup_date', 'return_date', 'status']),  # For availability checks
            models.Index(fields=['status', 'pickup_date']),  # For filtering by status and date
            models.Index(fields=['created_at']),  # For sorting
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.listing} by {self.customer.username}"


class Favorite(models.Model):
    """User favorites model."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'listing']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),  # For user's favorites list
            models.Index(fields=['listing']),  # For listing's favorites count
        ]

    def __str__(self):
        return f"{self.user.username} favorited {self.listing}"


class Review(models.Model):
    """Review model for listings."""
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['listing', 'user']  # One review per user per listing
        indexes = [
            models.Index(fields=['listing', 'is_published', 'created_at']),  # For listing reviews
            models.Index(fields=['user', 'created_at']),  # For user's reviews
            models.Index(fields=['rating']),  # For rating filters
        ]

    def __str__(self):
        return f"Review by {self.user.username} for {self.listing} - {self.rating} stars"


class PasswordReset(models.Model):
    """Password reset token model."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='password_resets')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
        ]
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    def is_expired(self):
        """Check if the reset token has expired."""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if the reset token is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired()
    
    @staticmethod
    def generate_token():
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)


class Notification(models.Model):
    """Notification model for users."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, default='info')  # info, success, warning, error, new_booking
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True) # e.g., 'booking', 'listing'

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"

