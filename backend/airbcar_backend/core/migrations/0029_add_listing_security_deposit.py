from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0028_licenseverificationrecord'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='security_deposit',
            field=models.DecimalField(
                decimal_places=2,
                default=5000,
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]
