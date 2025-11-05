# Generated migration to add review features (helpful votes, owner responses)
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_create_review_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='review',
            name='helpful_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='review',
            name='owner_response',
            field=models.TextField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='review',
            name='owner_response_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['listing', '-helpful_count'], name='core_review_listing_helpful_idx'),
        ),
        migrations.CreateModel(
            name='ReviewVote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_helpful', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('review', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='core.review')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='review_votes', to='core.user')),
            ],
            options={
                'unique_together': {('review', 'user')},
            },
        ),
        migrations.AddIndex(
            model_name='reviewvote',
            index=models.Index(fields=['review', 'user'], name='core_review_review_u_idx'),
        ),
    ]

