# Generated migration to add city, state, and zip_code fields to Partner model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0023_add_partner_public_profile_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='partner',
            name='city',
            field=models.CharField(blank=True, help_text='City', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='state',
            field=models.CharField(blank=True, help_text='State/Province', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='zip_code',
            field=models.CharField(blank=True, help_text='Zip/Postal code', max_length=20, null=True),
        ),
    ]

