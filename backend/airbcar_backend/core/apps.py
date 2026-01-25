from django.apps import AppConfig
from django.db.utils import ProgrammingError, OperationalError
import logging
import sys

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Run startup checks to ensure database schema is consistent.
        This is a failsafe for when migrations get stuck.
        """
        # Avoid running during management commands like migrate to prevent recursion/locking
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return

        try:
            from django.db import connection
            
            # Simple check-and-fix logic
            tables_to_check = {
                'core_booking': [
                    ('request_message', 'TEXT'),
                    ('rejection_reason', 'TEXT'),
                    ('license_front_document', 'VARCHAR(500)'),
                    ('license_back_document', 'VARCHAR(500)'),
                ],
                'core_user': [
                    ('license_front_document', 'VARCHAR(500)'),
                    ('license_back_document', 'VARCHAR(500)'), 
                    ('license_number', 'VARCHAR(100)'),
                    ('license_origin_country', 'VARCHAR(100)'),
                ]
            }

            # We use a raw cursor to bypass Django's model cache
            with connection.cursor() as cursor:
                for table, columns in tables_to_check.items():
                    for col_name, col_type in columns:
                        # 1. Check if column exists using information_schema (safe read)
                        cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' AND column_name = '{col_name}'")
                        if not cursor.fetchone():
                            # 2. Add if missing
                            print(f"[CoreConfig] FIXING: Adding missing column {col_name} to {table}")
                            try:
                                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                            except Exception as e:
                                print(f"[CoreConfig] Error adding column {col_name}: {e}")

        except Exception as e:
            # Don't crash the app start
            print(f"[CoreConfig] Startup DB check skipped: {e}")

