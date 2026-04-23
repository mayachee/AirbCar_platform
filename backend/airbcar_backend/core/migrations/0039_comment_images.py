from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0038_vehicleinspection_b2bmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='listingcomment',
            name='images',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='List of Supabase image URLs (max 4)',
            ),
        ),
        migrations.AddField(
            model_name='trippostcomment',
            name='images',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='List of Supabase image URLs (max 4)',
            ),
        ),
    ]
