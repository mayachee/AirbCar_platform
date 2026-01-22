from django.apps import AppConfig


class CommonConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'common'
    
    def ready(self):
        """Auto-fix database schema on startup if needed"""
        import os
        import sys
        
        # Only run once, not on every reload
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        # Only in development (not in migrations, tests, etc.)
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'test' in sys.argv:
            return
        
        try:
            from django.db import connection
            from django.core.management import call_command
            from django.conf import settings
            
            use_sqlite = 'sqlite' in settings.DATABASES['default']['ENGINE']
            
            if not use_sqlite:
                return
            
            # Check if tables need fixing
            with connection.cursor() as cursor:
                try:
                    # Check core_partner
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_partner'")
                    if cursor.fetchone():
                        cursor.execute("PRAGMA table_info(core_partner)")
                        partner_cols = [row[1] for row in cursor.fetchall()]
                        
                        # Check core_listing
                        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_listing'")
                        if cursor.fetchone():
                            cursor.execute("PRAGMA table_info(core_listing)")
                            listing_cols = [row[1] for row in cursor.fetchall()]
                            
                            # Check if fix is needed
                            needs_fix = False
                            if partner_cols and 'slug' not in partner_cols:
                                needs_fix = True
                            if listing_cols and 'pictures' not in listing_cols:
                                needs_fix = True
                            
                            if needs_fix:
                                print("\n" + "="*70)
                                print("🔧 AUTO-FIXING DATABASE SCHEMA")
                                print("="*70 + "\n")
                                try:
                                    # Remove migration records first
                                    from django.db import transaction
                                    with transaction.atomic():
                                        with connection.cursor() as c:
                                            for app in ['users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']:
                                                c.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
                                    
                                    # Drop tables
                                    with connection.cursor() as c:
                                        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
                                        for table_row in c.fetchall():
                                            table = table_row[0]
                                            if table.startswith('core_'):
                                                c.execute(f"DROP TABLE IF EXISTS {table}")
                                    
                                    # Apply migrations in order
                                    call_command('migrate', 'core', '--fake', verbosity=0)
                                    call_command('migrate', 'users', verbosity=0)
                                    call_command('migrate', 'partners', verbosity=0)
                                    call_command('migrate', 'listings', verbosity=0)
                                    call_command('migrate', 'bookings', verbosity=0)
                                    call_command('migrate', 'reviews', verbosity=0)
                                    call_command('migrate', 'favorites', verbosity=0)
                                    call_command('migrate', verbosity=0)
                                    
                                    print("✅ Database schema fixed automatically!")
                                except Exception as fix_error:
                                    print(f"⚠️  Auto-fix failed: {fix_error}")
                                    print("   Run manually: python3 manage.py fix_database_schema")
                                print("\n" + "="*70 + "\n")
                except Exception as e:
                    # Silently ignore - tables might not exist yet
                    pass
        except Exception:
            # Silently ignore any errors during startup
            pass
