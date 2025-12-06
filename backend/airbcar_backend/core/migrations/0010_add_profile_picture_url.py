# Generated migration for adding profile_picture_url field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_add_partner_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profile_picture_url',
            field=models.URLField(blank=True, help_text='URL for profile picture (e.g., Google profile picture)', max_length=500, null=True),
        ),
    ]

