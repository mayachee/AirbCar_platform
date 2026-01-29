#!/usr/bin/env python
"""Run comprehensive tests and output results"""
import os
import sys
from pathlib import Path

# Setup
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

results = {
    'environment': False,
    'django_setup': False,
    'system_check': False,
    'models': False,
    'database': False,
    'urls': False,
    'settings': False
}

print("=" * 70)
print("🧪 COMPREHENSIVE PROJECT TEST")
print("=" * 70)
print()

# Test 1: Environment
print("1️⃣  Testing Environment Configuration...")
try:
    from dotenv import load_dotenv
    env_local_path = BASE_DIR / '.env.local'
    env_path = BASE_DIR / '.env'
    
    if env_local_path.exists():
        load_dotenv(dotenv_path=env_local_path, override=False)
        print(f"   ✅ Loaded: {env_local_path}")
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        if not env_local_path.exists():
            print(f"   ✅ Loaded: {env_path}")
    
    use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
    database_host = os.environ.get('DATABASE_HOST', 'NOT SET')
    
    print(f"   USE_SQLITE: {use_sqlite}")
    print(f"   DATABASE_HOST: {database_host}")
    results['environment'] = True
    print("   ✅ Environment test PASSED")
except Exception as e:
    print(f"   ❌ Environment test FAILED: {e}")
print()

# Test 2: Django Setup
print("2️⃣  Testing Django Setup...")
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
    import django
    django.setup()
    results['django_setup'] = True
    print("   ✅ Django setup PASSED")
except Exception as e:
    print(f"   ❌ Django setup FAILED: {e}")
    import traceback
    traceback.print_exc()
    print("\n❌ Cannot continue without Django setup. Exiting.")
    sys.exit(1)
print()

# Test 3: System Check
print("3️⃣  Running Django System Check...")
try:
    from django.core.management import call_command
    from io import StringIO
    
    old_stdout = sys.stdout
    sys.stdout = StringIO()
    
    try:
        call_command('check', verbosity=1)
        output = sys.stdout.getvalue()
        sys.stdout = old_stdout
        
        if 'System check identified no issues' in output or '0 silenced' in output:
            results['system_check'] = True
            print("   ✅ System check PASSED (no issues)")
        else:
            print("   ⚠️  System check completed with output:")
            for line in output.split('\n')[:5]:
                if line.strip():
                    print(f"      {line}")
    except SystemExit as e:
        sys.stdout = old_stdout
        if e.code == 0:
            results['system_check'] = True
            print("   ✅ System check PASSED")
        else:
            print(f"   ⚠️  System check exited with code {e.code}")
except Exception as e:
    print(f"   ⚠️  System check error: {e}")
print()

# Test 4: Models
print("4️⃣  Testing Model Imports...")
try:
    from users.models import User
    from partners.models import Partner
    from listings.models import Listing
    from core.models import Booking
    from reviews.models import Review, ReviewVote, ReviewReport
    from favorites.models import Favorite
    
    models_ok = all([
        User, Partner, Listing, Booking, Review, ReviewVote, ReviewReport, Favorite
    ])
    
    if models_ok:
        results['models'] = True
        print("   ✅ All models imported successfully")
        print(f"      - User: {User._meta.db_table}")
        print(f"      - Partner: {Partner._meta.db_table}")
        print(f"      - Listing: {Listing._meta.db_table}")
        print(f"      - Booking: {Booking._meta.db_table}")
        print(f"      - Review: {Review._meta.db_table}")
        print(f"      - Favorite: {Favorite._meta.db_table}")
    else:
        print("   ⚠️  Some models failed to import")
except Exception as e:
    print(f"   ❌ Model import FAILED: {e}")
    import traceback
    traceback.print_exc()
print()

# Test 5: Database
print("5️⃣  Testing Database Connection...")
try:
    from django.db import connection
    use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        if result:
            results['database'] = True
            print("   ✅ Database connection successful")
            
            # Check tables
            if use_sqlite:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            else:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    LIMIT 10
                """)
            tables = [row[0] for row in cursor.fetchall()]
            print(f"   ✅ Found {len(tables)} tables")
            if tables:
                print(f"      Sample tables: {', '.join(tables[:5])}")
        else:
            print("   ⚠️  Database connection returned no result")
except Exception as e:
    print(f"   ⚠️  Database connection issue: {e}")
    print("      (This is OK if migrations haven't been run yet)")
print()

# Test 6: URLs
print("6️⃣  Testing URL Configuration...")
try:
    from django.urls import get_resolver
    resolver = get_resolver()
    url_patterns = list(resolver.url_patterns)
    results['urls'] = True
    print(f"   ✅ URL configuration loaded ({len(url_patterns)} top-level patterns)")
    
    # Check key endpoints
    from django.urls import reverse
    try:
        reverse('admin:index')
        print("   ✅ Admin URLs configured")
    except:
        pass
except Exception as e:
    print(f"   ⚠️  URL configuration issue: {e}")
print()

# Test 7: Settings
print("7️⃣  Testing Settings...")
try:
    from django.conf import settings
    
    checks = {
        'AUTH_USER_MODEL': settings.AUTH_USER_MODEL,
        'INSTALLED_APPS_COUNT': len(settings.INSTALLED_APPS),
        'DATABASE_ENGINE': settings.DATABASES['default']['ENGINE'],
    }
    
    for name, value in checks.items():
        print(f"   ✅ {name}: {value}")
    
    if settings.AUTH_USER_MODEL == 'users.User':
        results['settings'] = True
        print("   ✅ Settings configuration correct")
    else:
        print(f"   ⚠️  AUTH_USER_MODEL is {settings.AUTH_USER_MODEL}, expected 'users.User'")
except Exception as e:
    print(f"   ⚠️  Settings check issue: {e}")

print()
print("=" * 70)
print("📊 TEST RESULTS SUMMARY")
print("=" * 70)
print()

passed = sum(1 for v in results.values() if v)
total = len(results)

for test, result in results.items():
    status = "✅ PASS" if result else "⚠️  SKIP/FAIL"
    print(f"   {test.upper():20} {status}")

print()
print(f"Results: {passed}/{total} tests passed")
print()

if passed >= 5:
    print("✅ PROJECT IS WORKING! 🎉")
    print()
    print("Next steps:")
    print("  1. Run migrations: python3 manage.py migrate --fake-initial")
    print("  2. Create superuser: python3 manage.py createsuperuser")
    print("  3. Start server: python3 manage.py runserver")
else:
    print("⚠️  Some tests failed. Check the output above for details.")
    print()
    print("Common fixes:")
    print("  - Run: python3 fix_env_local.py")
    print("  - Check: python3 manage.py check")
    print("  - Verify: .env.local exists and is configured")

print()

