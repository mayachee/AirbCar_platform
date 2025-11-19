"""
Django models for AirbCar platform.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
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
    is_verified = models.BooleanField(default=False)
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
    is_verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    review_count = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


class Listing(models.Model):
    """Vehicle listing model."""
    TRANSMISSION_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
    ]
    
    FUEL_TYPE_CHOICES = [
        ('gasoline', 'Gasoline'),
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
            models.Index(fields=['location', 'is_available']),
            models.Index(fields=['price_per_day']),
            models.Index(fields=['make', 'model']),
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
    
    # Additional
    special_requests = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['partner', 'status']),
            models.Index(fields=['pickup_date', 'return_date']),
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

    def __str__(self):
        return f"Review by {self.user.username} for {self.listing} - {self.rating} stars"

