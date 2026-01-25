from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_add_booking_fields'),
    ]

    operations = [
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='core_booking' AND column_name='request_message') THEN
                    ALTER TABLE core_booking ADD COLUMN request_message text;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='core_booking' AND column_name='rejection_reason') THEN
                    ALTER TABLE core_booking ADD COLUMN rejection_reason text;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='core_booking' AND column_name='license_front_document') THEN
                    ALTER TABLE core_booking ADD COLUMN license_front_document varchar(500);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='core_booking' AND column_name='license_back_document') THEN
                    ALTER TABLE core_booking ADD COLUMN license_back_document varchar(500);
                END IF;
            END
            $$;
            """,
            reverse_sql=""
        )
    ]
