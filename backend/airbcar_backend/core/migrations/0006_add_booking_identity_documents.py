# Generated migration for adding identity document fields to Booking model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_add_license_documents'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='id_front_document',
            field=models.ImageField(blank=True, help_text='Front side of identity document uploaded during booking', null=True, upload_to='booking_documents/'),
        ),
        migrations.AddField(
            model_name='booking',
            name='id_back_document',
            field=models.ImageField(blank=True, help_text='Back side of identity document uploaded during booking', null=True, upload_to='booking_documents/'),
        ),
        migrations.AddField(
            model_name='booking',
            name='id_front_document_url',
            field=models.URLField(blank=True, help_text='Public URL for front identity document hosted on Supabase', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='id_back_document_url',
            field=models.URLField(blank=True, help_text='Public URL for back identity document hosted on Supabase', max_length=500, null=True),
        ),
    ]

