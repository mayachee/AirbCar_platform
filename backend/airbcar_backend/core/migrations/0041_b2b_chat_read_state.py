from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0040_listingcomment_is_pinned'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='b2bmessage',
            index=models.Index(
                fields=['car_share_request', '-created_at'],
                name='core_b2bmsg_thread_recent_idx',
            ),
        ),
        migrations.CreateModel(
            name='CarShareRequestRead',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_read_message_id', models.BigIntegerField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('car_share_request', models.ForeignKey(
                    on_delete=models.deletion.CASCADE,
                    related_name='read_cursors',
                    to='core.carsharerequest',
                )),
                ('partner', models.ForeignKey(
                    on_delete=models.deletion.CASCADE,
                    related_name='b2b_read_cursors',
                    to='core.partner',
                )),
            ],
            options={
                'unique_together': {('car_share_request', 'partner')},
                'indexes': [
                    models.Index(
                        fields=['partner', 'car_share_request'],
                        name='core_csrread_partner_share_idx',
                    ),
                ],
            },
        ),
    ]
