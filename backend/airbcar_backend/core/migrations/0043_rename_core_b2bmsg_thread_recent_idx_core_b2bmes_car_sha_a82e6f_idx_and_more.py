# B2B Car Sharing fields. Adds the columns the V1-V5 frontend pages
# already query: Listing.is_b2b_enabled / b2b_price_per_day, Booking.is_b2b.
#
# Index renames + AlterField(id->BigAutoField) that earlier autogen pulled in
# were intentionally dropped — they came from cosmetic drift between the live
# schema and the model state, and would risk aborting the whole migration on
# production if Django's autonamed indexes differ from the dev environment.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0042_h1_whatsapp_blackouts_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='is_b2b_enabled',
            field=models.BooleanField(default=False, help_text='Available for B2B sharing'),
        ),
        migrations.AddField(
            model_name='listing',
            name='b2b_price_per_day',
            field=models.DecimalField(
                blank=True, null=True, max_digits=10, decimal_places=2,
                help_text='B2B daily rate',
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='is_b2b',
            field=models.BooleanField(default=False, help_text='Indicates if this is a B2B booking'),
        ),
    ]
