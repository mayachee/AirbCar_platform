"""
Add PartnerFollow and PartnerPost models for the agency social profile.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0031_add_listing_comments_reactions'),
    ]

    operations = [
        migrations.CreateModel(
            name='PartnerFollow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='following', to=settings.AUTH_USER_MODEL)),
                ('partner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followers', to='core.partner')),
            ],
        ),
        migrations.CreateModel(
            name='PartnerPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('post_type', models.CharField(choices=[('update', 'Update'), ('promotion', 'Promotion'), ('new_car', 'New Car')], default='update', max_length=20)),
                ('image_url', models.URLField(blank=True, max_length=500, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('partner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posts', to='core.partner')),
                ('linked_listing', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='partner_posts', to='core.listing')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='partnerfollow',
            index=models.Index(fields=['user'], name='core_partfollow_user_idx'),
        ),
        migrations.AddIndex(
            model_name='partnerfollow',
            index=models.Index(fields=['partner'], name='core_partfollow_partner_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='partnerfollow',
            unique_together={('user', 'partner')},
        ),
        migrations.AddIndex(
            model_name='partnerpost',
            index=models.Index(fields=['partner', 'is_active', 'created_at'], name='core_partpost_partner_active_idx'),
        ),
    ]
