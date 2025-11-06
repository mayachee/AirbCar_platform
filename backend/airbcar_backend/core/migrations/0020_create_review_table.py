# Generated migration to create Review table
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_create_favorite_table'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS "core_review" (
                            "id" bigserial NOT NULL PRIMARY KEY,
                            "rating" integer NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
                            "comment" text,
                            "created_at" timestamp with time zone NOT NULL,
                            "updated_at" timestamp with time zone NOT NULL,
                            "is_verified" boolean NOT NULL DEFAULT false,
                            "is_published" boolean NOT NULL DEFAULT true,
                            "booking_id" bigint,
                            "listing_id" bigint NOT NULL,
                            "user_id" bigint NOT NULL,
                            CONSTRAINT "core_review_booking_id_fkey" 
                                FOREIGN KEY ("booking_id") 
                                REFERENCES "core_booking" ("id") 
                                ON DELETE CASCADE,
                            CONSTRAINT "core_review_listing_id_fkey" 
                                FOREIGN KEY ("listing_id") 
                                REFERENCES "core_listing" ("id") 
                                ON DELETE CASCADE,
                            CONSTRAINT "core_review_user_id_fkey" 
                                FOREIGN KEY ("user_id") 
                                REFERENCES "core_user" ("id") 
                                ON DELETE CASCADE,
                            CONSTRAINT "core_review_unique_booking_review" 
                                UNIQUE ("booking_id") 
                                WHERE "booking_id" IS NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS "core_review_listing_id_created_at_idx" 
                            ON "core_review" ("listing_id", "created_at" DESC);
                        CREATE INDEX IF NOT EXISTS "core_review_user_id_created_at_idx" 
                            ON "core_review" ("user_id", "created_at" DESC);
                        CREATE INDEX IF NOT EXISTS "core_review_listing_id_rating_idx" 
                            ON "core_review" ("listing_id", "rating");
                    """,
                    reverse_sql="""
                        DROP INDEX IF EXISTS "core_review_listing_id_rating_idx";
                        DROP INDEX IF EXISTS "core_review_user_id_created_at_idx";
                        DROP INDEX IF EXISTS "core_review_listing_id_created_at_idx";
                        DROP TABLE IF EXISTS "core_review";
                    """
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Review',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('rating', models.IntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)])),
                        ('comment', models.TextField(blank=True, max_length=1000, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('is_verified', models.BooleanField(default=False)),
                        ('is_published', models.BooleanField(default=True)),
                        ('booking', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='core.booking')),
                        ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='core.listing')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='core.user')),
                    ],
                    options={
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.AddIndex(
                    model_name='review',
                    index=models.Index(fields=['listing', '-created_at'], name='core_review_listing_id_created_at_idx'),
                ),
                migrations.AddIndex(
                    model_name='review',
                    index=models.Index(fields=['user', '-created_at'], name='core_review_user_id_created_at_idx'),
                ),
                migrations.AddIndex(
                    model_name='review',
                    index=models.Index(fields=['listing', 'rating'], name='core_review_listing_id_rating_idx'),
                ),
                migrations.AddConstraint(
                    model_name='review',
                    constraint=models.UniqueConstraint(condition=models.Q(('booking__isnull', False)), fields=('booking',), name='unique_booking_review'),
                ),
            ],
        ),
    ]

