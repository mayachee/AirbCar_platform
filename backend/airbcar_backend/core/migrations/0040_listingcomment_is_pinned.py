from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0039_comment_images'),
    ]

    operations = [
        migrations.AddField(
            model_name='listingcomment',
            name='is_pinned',
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text='Owner-pinned welcome post — at most one per listing.',
            ),
        ),
        migrations.AddConstraint(
            model_name='listingcomment',
            constraint=models.UniqueConstraint(
                fields=['listing'],
                condition=models.Q(is_pinned=True),
                name='unique_pinned_comment_per_listing',
            ),
        ),
    ]
