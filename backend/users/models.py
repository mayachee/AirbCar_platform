from django.contrib.auth.models import AbstractUser
from django.db import models


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
    license_front_document = models.URLField(blank=True, null=True)
    license_back_document = models.URLField(blank=True, null=True)
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
        db_table = 'core_user'  # Use existing table name from core app migration
        indexes = [models.Index(fields=['email'])]
