# Generated migration for adding license document fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_add_supabase_document_urls'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='license_front_document',
            field=models.ImageField(blank=True, help_text='Front side of driver license', null=True, upload_to='license_documents/'),
        ),
        migrations.AddField(
            model_name='user',
            name='license_back_document',
            field=models.ImageField(blank=True, help_text='Back side of driver license', null=True, upload_to='license_documents/'),
        ),
        migrations.AddField(
            model_name='user',
            name='license_front_document_url',
            field=models.URLField(blank=True, help_text='Public URL for front license document hosted on Supabase', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='license_back_document_url',
            field=models.URLField(blank=True, help_text='Public URL for back license document hosted on Supabase', max_length=500, null=True),
        ),
    ]

