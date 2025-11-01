# Generated manually to create Favorite table only
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_merge_20251013_1517'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS "core_favorite" (
                            "id" bigserial NOT NULL PRIMARY KEY,
                            "created_at" timestamp with time zone NOT NULL,
                            "listing_id" bigint NOT NULL,
                            "user_id" bigint NOT NULL,
                            CONSTRAINT "core_favorite_listing_id_fkey" 
                                FOREIGN KEY ("listing_id") 
                                REFERENCES "core_listing" ("id") 
                                ON DELETE CASCADE,
                            CONSTRAINT "core_favorite_user_id_fkey" 
                                FOREIGN KEY ("user_id") 
                                REFERENCES "core_user" ("id") 
                                ON DELETE CASCADE,
                            CONSTRAINT "core_favorite_user_id_listing_id_unique" 
                                UNIQUE ("user_id", "listing_id")
                        );
                        CREATE INDEX IF NOT EXISTS "core_favori_user_id_d9a192_idx" 
                            ON "core_favorite" ("user_id", "created_at" DESC);
                    """,
                    reverse_sql="""
                        DROP INDEX IF EXISTS "core_favori_user_id_d9a192_idx";
                        DROP TABLE IF EXISTS "core_favorite";
                    """
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Favorite',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='core.listing')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='core.user')),
                    ],
                    options={
                        'unique_together': {('user', 'listing')},
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.AddIndex(
                    model_name='favorite',
                    index=models.Index(fields=['user', '-created_at'], name='core_favori_user_id_d9a192_idx'),
                ),
            ],
        ),
    ]

