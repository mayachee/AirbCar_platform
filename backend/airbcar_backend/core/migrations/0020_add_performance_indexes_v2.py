# Generated migration to add database indexes for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_normalize_listing_images'),
    ]

    operations = [
        # Indexes for Listing model (most queried)
        migrations.AddIndex(
            model_name='listing',
            index=models.Index(fields=['is_available', '-created_at'], name='listing_avail_created_idx'),
        ),
        migrations.AddIndex(
            model_name='listing',
            index=models.Index(fields=['partner', 'is_available'], name='listing_partner_avail_idx'),
        ),
        migrations.AddIndex(
            model_name='listing',
            index=models.Index(fields=['price_per_day'], name='listing_price_idx'),
        ),
        migrations.AddIndex(
            model_name='listing',
            index=models.Index(fields=['rating'], name='listing_rating_idx'),
        ),
        migrations.AddIndex(
            model_name='listing',
            index=models.Index(fields=['location'], name='listing_location_idx'),
        ),
        
        # Indexes for Booking model (frequently filtered)
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['customer', 'status', '-created_at'], name='booking_cust_status_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['partner', 'status'], name='booking_partner_status_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['listing', 'status'], name='booking_listing_status_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['pickup_date', 'return_date'], name='booking_dates_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['status', 'payment_status'], name='booking_status_payment_idx'),
        ),
        
        # Indexes for Review model
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['listing', 'is_published', '-created_at'], name='review_listing_pub_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['user', 'listing'], name='review_user_listing_idx'),
        ),
        
        # Indexes for Favorite model
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['user', '-created_at'], name='favorite_user_created_idx'),
        ),
        
        # Indexes for Partner model
        migrations.AddIndex(
            model_name='partner',
            index=models.Index(fields=['is_verified', '-rating'], name='partner_verified_rating_idx'),
        ),
    ]
