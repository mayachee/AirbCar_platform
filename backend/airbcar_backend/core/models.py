from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from supabase import create_client, Client


class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)
    profile_picture = models.URLField(blank=True, null=True)
    default_currency = models.CharField(max_length=3, default='USD')
    address = models.TextField(blank=True, null=True)
    issue_date = models.DateField(blank=True, null=True)
    license_number = models.TextField(blank=True, null=True)
    id_front_document_url = models.URLField(blank=True, null=True)
    id_back_document_url = models.URLField(blank=True, null=True)
    id_verification_status = models.CharField(max_length=20, default='pending')
    license_origin_country = models.CharField(max_length=75, blank=True, null=True)
    nationality = models.CharField(max_length=75, null=True, blank=True)
    country_of_residence = models.CharField(max_length=75, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    role = models.CharField(max_length=50, default='user')
    is_partner = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    email_verification_token = models.CharField(max_length=36, blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    class Meta:
        indexes = [models.Index(fields=['email'])]


class Partner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner')
    company_name = models.CharField(max_length=100, blank=False)
    tax_id = models.CharField(max_length=50, blank=False)
    verification_status = models.CharField(max_length=20, default='pending')
    agree_on_terms = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verification_document = models.FileField(upload_to='partner_docs/', blank=True, null=True)
    
    # Public profile fields
    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True, help_text='URL-friendly identifier for public profile')
    description = models.TextField(max_length=1000, blank=True, null=True, help_text='Company description for public profile')
    logo = models.URLField(blank=True, null=True, help_text='Company logo URL')
    website = models.URLField(blank=True, null=True, help_text='Company website URL')
    phone = models.CharField(max_length=20, blank=True, null=True, help_text='Contact phone number')
    address = models.TextField(max_length=500, blank=True, null=True, help_text='Business address')

    def __str__(self):
        return f"{self.company_name} ({self.user.username})"
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from company_name if not provided"""
        if not self.slug and self.company_name:
            from django.utils.text import slugify
            base_slug = slugify(self.company_name)
            slug = base_slug
            counter = 1
            # Ensure slug is unique
            while Partner.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    class Meta:
        indexes = [models.Index(fields=['verification_status']), models.Index(fields=['slug'])]

class Listing(models.Model):
    partner = models.ForeignKey('Partner', on_delete=models.CASCADE, related_name='listings')
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    location = models.CharField(max_length=100, blank=True, null=True)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    fuel_type = models.CharField(max_length=20, blank=False, null=False)
    transmission = models.CharField(max_length=25, blank=False, null=False)
    seating_capacity = models.IntegerField(blank=False, null=False)
    vehicle_condition = models.CharField(max_length=50, blank=False, null=False)
    vehicle_description = models.CharField(max_length=500, blank=True, null=True)
    rating = models.FloatField(default=0.0, blank=True, null=True)
    features = models.JSONField(default=list)
    pictures = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.year})"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey('Listing', on_delete=models.CASCADE)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=timezone.now)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date = models.DateField(auto_now_add=True)
    
    # New fields for request workflow
    requested_at = models.DateTimeField(default=timezone.now)
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Optional message from renter to car owner
    request_message = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', '-requested_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['listing', 'status']),
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.get_status_display()} ({self.user.first_name or self.user.username})"

    @property
    def car_owner(self):
        """Get the car owner (partner) for this booking"""
        return self.listing.partner.user
    
    @property 
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_accepted(self):
        return self.status == 'accepted'
    
    @property
    def can_be_cancelled(self):
        return self.status in ['pending', 'accepted'] and self.start_time > timezone.now()

class Favorite(models.Model):
    """Model to store user favorites (saved listings)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey('Listing', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'listing']  # A user can only favorite a listing once
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} favorited {self.listing.make} {self.listing.model}"

class Review(models.Model):
    """Model to store reviews for listings"""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    listing = models.ForeignKey('Listing', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)  # Verified review (by booking)
    is_published = models.BooleanField(default=True)  # Partner can hide reviews
    helpful_count = models.IntegerField(default=0)  # Count of helpful votes
    owner_response = models.TextField(max_length=500, blank=True, null=True)  # Response from listing owner
    owner_response_at = models.DateTimeField(null=True, blank=True)  # When owner responded
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['listing', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['listing', 'rating']),
            models.Index(fields=['listing', '-helpful_count']),
        ]
        # Ensure one review per booking if booking is provided
        constraints = [
            models.UniqueConstraint(fields=['booking'], condition=models.Q(booking__isnull=False), name='unique_booking_review')
        ]

    def __str__(self):
        return f"Review by {self.user.email} for {self.listing.make} {self.listing.model} - {self.rating} stars"
    
    def save(self, *args, **kwargs):
        """Override save to update listing rating"""
        super().save(*args, **kwargs)
        # Update listing's average rating
        reviews = Review.objects.filter(listing=self.listing, is_published=True)
        if reviews.exists():
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
            self.listing.rating = round(avg_rating, 1) if avg_rating else 0.0
            self.listing.save(update_fields=['rating'])

class ReviewVote(models.Model):
    """Track helpful votes on reviews"""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_votes')
    is_helpful = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'user']
        indexes = [
            models.Index(fields=['review', 'user']),
        ]
    
    def save(self, *args, **kwargs):
        """Update helpful_count on review when vote is created/deleted"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Update helpful count
            helpful_votes = ReviewVote.objects.filter(review=self.review, is_helpful=True).count()
            self.review.helpful_count = helpful_votes
            self.review.save(update_fields=['helpful_count'])
    
    def delete(self, *args, **kwargs):
        """Update helpful count when vote is deleted"""
        review = self.review
        super().delete(*args, **kwargs)
        helpful_votes = ReviewVote.objects.filter(review=review, is_helpful=True).count()
        review.helpful_count = helpful_votes
        review.save(update_fields=['helpful_count'])

class ReviewReport(models.Model):
    """Track reports/flags on reviews for moderation"""
    REVIEW_REPORT_REASONS = [
        ('spam', 'Spam or Fake'),
        ('inappropriate', 'Inappropriate Content'),
        ('harassment', 'Harassment or Bullying'),
        ('false_info', 'False Information'),
        ('other', 'Other'),
    ]
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_reports')
    reason = models.CharField(max_length=20, choices=REVIEW_REPORT_REASONS)
    description = models.TextField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    
    class Meta:
        unique_together = ['review', 'user']  # One report per user per review
        indexes = [
            models.Index(fields=['review', '-created_at']),
            models.Index(fields=['resolved', '-created_at']),
        ]
    
    def __str__(self):
        return f"Report on Review #{self.review.id} by {self.user.email} - {self.reason}"