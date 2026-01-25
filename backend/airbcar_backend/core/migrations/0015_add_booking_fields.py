from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_notification'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='booking',
            name='special_requests',
        ),
        migrations.AddField(
            model_name='booking',
            name='request_message',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='license_front_document',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='license_back_document',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]