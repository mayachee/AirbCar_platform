# Generated migration for adding profile_picture_base64 field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_add_profile_picture_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profile_picture_base64',
            field=models.TextField(blank=True, help_text='Base64 encoded profile picture (data:image/jpeg;base64,...) - stored directly in database', null=True),
        ),
    ]

