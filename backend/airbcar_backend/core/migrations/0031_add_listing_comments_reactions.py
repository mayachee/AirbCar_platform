"""
Add ListingComment and ListingReaction models for the social layer.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0030_user_telegram_chat_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='ListingComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='core.listing')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listing_comments', to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='core.listingcomment')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='ListingReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reaction', models.CharField(choices=[('like', '👍'), ('love', '❤️'), ('fire', '🔥'), ('wow', '😮')], max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='core.listing')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listing_reactions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(
            model_name='listingcomment',
            index=models.Index(fields=['listing', 'is_active', 'created_at'], name='core_listco_listing_active_created_idx'),
        ),
        migrations.AddIndex(
            model_name='listingcomment',
            index=models.Index(fields=['parent'], name='core_listco_parent_idx'),
        ),
        migrations.AddIndex(
            model_name='listingcomment',
            index=models.Index(fields=['user'], name='core_listco_user_idx'),
        ),
        migrations.AddIndex(
            model_name='listingreaction',
            index=models.Index(fields=['listing'], name='core_listreact_listing_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='listingreaction',
            unique_together={('listing', 'user')},
        ),
    ]
