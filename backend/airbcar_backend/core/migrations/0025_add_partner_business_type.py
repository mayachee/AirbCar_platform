# Generated migration to add business_type field to Partner model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0024_add_partner_city_state_zipcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='partner',
            name='business_type',
            field=models.CharField(blank=True, help_text='Type of business (individual, company, fleet, dealership)', max_length=50, null=True),
        ),
    ]

