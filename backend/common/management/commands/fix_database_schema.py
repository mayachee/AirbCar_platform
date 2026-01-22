"""Django management command to fix database schema"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Fix database schema by dropping old core tables and recreating them'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Fixing database schema...")
        
        # Step 1: Drop old core tables
        self.stdout.write("1️⃣  Dropping old core tables...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            all_tables = [row[0] for row in cursor.fetchall()]
            
            core_tables = [t for t in all_tables if t.startswith('core_')]
            
            for table in core_tables:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                    self.stdout.write(self.style.SUCCESS(f"   ✅ Dropped {table}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"   ⚠️  {table}: {e}"))
        
        # Step 2: Reset migration records
        self.stdout.write("\n2️⃣  Resetting migration records...")
        from django.db import transaction
        with transaction.atomic():
            with connection.cursor() as cursor:
                apps = ['users', 'partners', 'listings', 'bookings', 'reviews', 'favorites']
                for app in apps:
                    # Use format string to avoid SQLite parameter formatting issue
                    cursor.execute(f"DELETE FROM django_migrations WHERE app = '{app}'")
                    self.stdout.write(self.style.SUCCESS(f"   ✅ Reset {app} migrations"))
        
        # Step 3: Apply migrations in correct dependency order
        self.stdout.write("\n3️⃣  Applying migrations in dependency order...")
        try:
            # Fake core (legacy)
            call_command('migrate', 'core', '--fake', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Faked core migrations"))
            
            # Apply in dependency order:
            # 0. users (User table - required by everything)
            call_command('migrate', 'users', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated users"))
            
            # 1. partners (depends on users)
            call_command('migrate', 'partners', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated partners"))
            
            # 2. listings (depends on partners)
            call_command('migrate', 'listings', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated listings"))
            
            # 3. bookings (depends on listings)
            call_command('migrate', 'bookings', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated bookings"))
            
            # 4. reviews (depends on listings and bookings)
            call_command('migrate', 'reviews', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated reviews"))
            
            # 5. favorites (depends on listings)
            call_command('migrate', 'favorites', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ Migrated favorites"))
            
            # Final migrate
            call_command('migrate', verbosity=0)
            self.stdout.write(self.style.SUCCESS("   ✅ All migrations applied"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Error: {e}"))
            import traceback
            traceback.print_exc()
        
        # Step 4: Verify
        self.stdout.write("\n4️⃣  Verifying...")
        with connection.cursor() as cursor:
            try:
                cursor.execute("PRAGMA table_info(core_partner)")
                partner_cols = [row[1] for row in cursor.fetchall()]
                if 'slug' in partner_cols:
                    self.stdout.write(self.style.SUCCESS("   ✅ core_partner has 'slug' column"))
                else:
                    self.stdout.write(self.style.ERROR("   ❌ core_partner missing 'slug'"))
            except:
                self.stdout.write(self.style.ERROR("   ❌ core_partner table not found"))
            
            try:
                cursor.execute("PRAGMA table_info(core_listing)")
                listing_cols = [row[1] for row in cursor.fetchall()]
                if 'pictures' in listing_cols:
                    self.stdout.write(self.style.SUCCESS("   ✅ core_listing has 'pictures' column"))
                else:
                    self.stdout.write(self.style.ERROR("   ❌ core_listing missing 'pictures'"))
            except:
                self.stdout.write(self.style.ERROR("   ❌ core_listing table not found"))
        
        self.stdout.write(self.style.SUCCESS("\n✅ Database fix complete!"))

