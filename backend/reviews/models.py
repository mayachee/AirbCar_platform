from django.db import models
from django.conf import settings


class Review(models.Model):
    """Model to store reviews for listings"""
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
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
        db_table = 'core_review'  # Use existing table name from core app
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['listing', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['listing', 'rating']),
            models.Index(fields=['listing', '-helpful_count']),
        ]
        # Ensure one review per booking if booking is provided
        constraints = [
            models.UniqueConstraint(fields=['booking'], condition=models.Q(booking__isnull=False), name='reviews_unique_booking_review')
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_votes')
    is_helpful = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'core_reviewvote'  # Use existing table name from core app
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_reports')
    reason = models.CharField(max_length=20, choices=REVIEW_REPORT_REASONS)
    description = models.TextField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    
    class Meta:
        db_table = 'core_reviewreport'  # Use existing table name from core app
        unique_together = ['review', 'user']  # One report per user per review
        indexes = [
            models.Index(fields=['review', '-created_at']),
            models.Index(fields=['resolved', '-created_at']),
        ]
    
    def __str__(self):
        return f"Report on Review #{self.review.id} by {self.user.email} - {self.reason}"

