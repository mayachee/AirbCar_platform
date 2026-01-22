from django.db import models
from django.conf import settings


class Favorite(models.Model):
    """Model to store user favorites (saved listings)"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_favorite'  # Use existing table name from core app
        unique_together = ['user', 'listing']  # A user can only favorite a listing once
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} favorited {self.listing.make} {self.listing.model}"

