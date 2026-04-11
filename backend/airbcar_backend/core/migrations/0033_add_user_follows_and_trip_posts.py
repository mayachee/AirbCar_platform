"""
Add UserFollow, TripPost, TripPostReaction, TripPostComment models.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0032_add_partner_follow_and_posts'),
    ]

    operations = [
        # UserFollow
        migrations.CreateModel(
            name='UserFollow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('follower', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_following', to=settings.AUTH_USER_MODEL)),
                ('following', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_followers', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='userfollow',
            unique_together={('follower', 'following')},
        ),
        migrations.AddIndex(
            model_name='userfollow',
            index=models.Index(fields=['follower'], name='core_userfollow_follower_idx'),
        ),
        migrations.AddIndex(
            model_name='userfollow',
            index=models.Index(fields=['following'], name='core_userfollow_following_idx'),
        ),

        # TripPost
        migrations.CreateModel(
            name='TripPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('caption', models.TextField(blank=True, default='')),
                ('images', models.JSONField(blank=True, default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('booking', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='trip_post', to='core.booking')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trip_posts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='trippost',
            index=models.Index(fields=['user', 'is_active', 'created_at'], name='core_trippost_user_active_idx'),
        ),
        migrations.AddIndex(
            model_name='trippost',
            index=models.Index(fields=['is_active', 'created_at'], name='core_trippost_active_created_idx'),
        ),

        # TripPostReaction
        migrations.CreateModel(
            name='TripPostReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reaction', models.CharField(choices=[('like', '👍'), ('love', '❤️'), ('fire', '🔥'), ('wow', '😮')], max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('trip_post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='core.trippost')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trip_post_reactions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='trippostreaction',
            unique_together={('trip_post', 'user')},
        ),
        migrations.AddIndex(
            model_name='trippostreaction',
            index=models.Index(fields=['trip_post'], name='core_tripreact_trippost_idx'),
        ),

        # TripPostComment
        migrations.CreateModel(
            name='TripPostComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('trip_post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='core.trippost')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trip_post_comments', to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='core.trippostcomment')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='trippostcomment',
            index=models.Index(fields=['trip_post', 'is_active', 'created_at'], name='core_tripcmt_trippost_active_idx'),
        ),
        migrations.AddIndex(
            model_name='trippostcomment',
            index=models.Index(fields=['parent'], name='core_tripcmt_parent_idx'),
        ),
    ]
