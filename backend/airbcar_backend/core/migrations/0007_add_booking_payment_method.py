# Generated migration for adding payment_method field to Booking model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_add_booking_identity_documents'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='payment_method',
            field=models.CharField(choices=[('online', 'Online'), ('cash', 'Cash')], default='online', help_text='Payment method: online or cash', max_length=20),
        ),
    ]

