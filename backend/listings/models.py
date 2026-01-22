from django.db import models


class Listing(models.Model):
    partner = models.ForeignKey('partners.Partner', on_delete=models.CASCADE, related_name='listings')
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
    images = models.JSONField(default=list, blank=True)  # Renamed from 'pictures' to match core.Listing

    class Meta:
        db_table = 'core_listing'  # Use existing table name from core app

    def __str__(self):
        return f"{self.make} {self.model} ({self.year})"

