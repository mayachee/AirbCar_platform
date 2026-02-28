# Generated manually for RemovedFavorite table

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_add_newsletter_subscriber'),
    ]

    operations = [
        migrations.CreateModel(
            name='RemovedFavorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('favorited_at', models.DateTimeField(help_text='When the user originally added it to favorites')),
                ('removed_at', models.DateTimeField(auto_now_add=True, help_text='When the user removed it')),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='removed_from_favorites', to='core.listing')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='removed_favorites', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Removed favorite',
                'verbose_name_plural': 'Removed favorites',
                'ordering': ['-removed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='removedfavorite',
            index=models.Index(fields=['user', 'removed_at'], name='removedfav_user_removed_idx'),
        ),
        migrations.AddIndex(
            model_name='removedfavorite',
            index=models.Index(fields=['listing'], name='removedfav_listing_idx'),
        ),
    ]
