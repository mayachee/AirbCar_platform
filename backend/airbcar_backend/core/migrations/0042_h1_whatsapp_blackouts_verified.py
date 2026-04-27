# H1 — WhatsApp booking flow + per-listing blackout dates + verified_at
# field for agencies. Frontend CTA + Telegram inline-button accept/reject
# round out this feature in subsequent commits.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0041_b2b_chat_read_state'),
    ]

    operations = [
        # Partner — verified-agency timestamp + WhatsApp phone for the CTA.
        migrations.AddField(
            model_name='partner',
            name='verified_at',
            field=models.DateTimeField(blank=True, help_text='When the agency was verified', null=True),
        ),
        migrations.AddField(
            model_name='partner',
            name='whatsapp_phone_number',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=20,
                help_text='E.164-formatted phone for the "Book via WhatsApp" CTA (e.g. +212600000000)',
            ),
        ),

        # Booking — extend status enum + record WhatsApp lifecycle.
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(
                max_length=32,
                default='pending',
                choices=[
                    ('pending', 'Pending'),
                    ('pending_whatsapp', 'Pending (WhatsApp)'),
                    ('confirmed', 'Confirmed'),
                    ('active', 'Active'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                    ('cancelled_no_response', 'Cancelled (no partner response)'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='confirmation_channel',
            field=models.CharField(
                max_length=20,
                default='online',
                choices=[
                    ('online', 'Online'),
                    ('telegram', 'Telegram'),
                    ('whatsapp', 'WhatsApp'),
                    ('manual_admin', 'Manual (admin)'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='whatsapp_initiated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='whatsapp_signed_token',
            field=models.CharField(blank=True, null=True, max_length=128, db_index=True),
        ),

        # BlackoutDate — partner-set unavailability windows per listing.
        migrations.CreateModel(
            name='BlackoutDate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('reason', models.CharField(blank=True, null=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('listing', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='blackouts',
                    to='core.listing',
                )),
            ],
            options={
                'ordering': ['-start_date'],
            },
        ),
        migrations.AddIndex(
            model_name='blackoutdate',
            index=models.Index(
                fields=['listing', 'start_date', 'end_date'],
                name='core_blacko_listing_f6c9be_idx',
            ),
        ),
        migrations.AddConstraint(
            model_name='blackoutdate',
            constraint=models.CheckConstraint(
                check=models.Q(('end_date__gte', models.F('start_date'))),
                name='blackout_end_after_start',
            ),
        ),
    ]
