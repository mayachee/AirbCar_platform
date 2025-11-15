# Generated migration to add public profile fields to Partner model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_add_review_features'),
    ]

    operations = [
        migrations.AddField(
            model_name='partner',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier for public profile', max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='description',
            field=models.TextField(blank=True, help_text='Company description for public profile', max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='logo',
            field=models.URLField(blank=True, help_text='Company logo URL', null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='website',
            field=models.URLField(blank=True, help_text='Company website URL', null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='phone',
            field=models.CharField(blank=True, help_text='Contact phone number', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='address',
            field=models.TextField(blank=True, help_text='Business address', max_length=500, null=True),
        ),
        migrations.AddIndex(
            model_name='partner',
            index=models.Index(fields=['slug'], name='core_partner_slug_idx'),
        ),
    ]








