from django.db import models
from django.conf import settings


class Partner(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='partner')
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
    phone = models.CharField(max_length=20, blank=False, null=False, help_text='Contact phone number')
    business_type = models.CharField(max_length=50, blank=True, null=True, help_text='Type of business (individual, company, fleet, dealership)')
    address = models.TextField(max_length=500, blank=True, null=True, help_text='Business address')
    city = models.CharField(max_length=100, blank=False, null=False, help_text='City')
    state = models.CharField(max_length=100, blank=True, null=True, help_text='State/Province')
    zip_code = models.CharField(max_length=20, blank=True, null=True, help_text='Zip/Postal code')

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
        db_table = 'core_partner'  # Use existing table name from core app
        indexes = [models.Index(fields=['verification_status']), models.Index(fields=['slug'])]

