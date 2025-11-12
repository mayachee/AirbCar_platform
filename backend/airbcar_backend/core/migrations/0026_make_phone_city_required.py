# Generated migration to make phone and city required fields
from django.db import migrations, models


def set_default_phone_and_city(apps, schema_editor):
    """Set default values for existing records with null phone or city"""
    Partner = apps.get_model('core', 'Partner')
    # Update partners with null phone to empty string (will be required to fill)
    Partner.objects.filter(phone__isnull=True).update(phone='')
    # Update partners with null city to empty string (will be required to fill)
    Partner.objects.filter(city__isnull=True).update(city='')


def reverse_set_default_phone_and_city(apps, schema_editor):
    """Reverse migration - set null back for empty strings"""
    Partner = apps.get_model('core', 'Partner')
    Partner.objects.filter(phone='').update(phone=None)
    Partner.objects.filter(city='').update(city=None)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_add_partner_business_type'),
    ]

    operations = [
        # First, set default values for existing records
        migrations.RunPython(set_default_phone_and_city, reverse_set_default_phone_and_city),
        
        # Then, alter the fields to be non-nullable
        migrations.AlterField(
            model_name='partner',
            name='phone',
            field=models.CharField(help_text='Contact phone number', max_length=20),
        ),
        migrations.AlterField(
            model_name='partner',
            name='city',
            field=models.CharField(help_text='City', max_length=100),
        ),
    ]

