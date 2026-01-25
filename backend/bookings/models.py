from django.db import models
from django.utils import timezone
from django.conf import settings


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column='customer_id')
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE)
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
    
    # License documents for this specific booking
    license_front_document = models.URLField(blank=True, null=True)
    license_back_document = models.URLField(blank=True, null=True)

    class Meta:
        db_table = 'core_booking'  # Use existing table name from core app
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

