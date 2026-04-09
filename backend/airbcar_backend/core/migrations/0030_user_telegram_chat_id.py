from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0029_add_listing_security_deposit'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='telegram_chat_id',
            field=models.CharField(
                blank=True,
                help_text='Telegram chat ID for notifications',
                max_length=50,
                null=True,
            ),
        ),
    ]
