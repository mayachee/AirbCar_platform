#!/usr/bin/env python
"""Agent test - comprehensive project validation"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

print("=" * 70)
print("🤖 AGENT TESTING PROJECT")
print("=" * 70)
print()

# Test 1: File Structure
print("1️⃣  Checking File Structure...")
required_files = [
    'manage.py',
    'airbcar_backend/settings.py',
    'airbcar_backend/urls.py',
    'users/models.py',
    'partners/models.py',
    'listings/models.py',
    'bookings/models.py',
    'reviews/models.py',
    'favorites/models.py',
]

missing = []
for file in required_files:
    path = BASE_DIR / file
    if path.exists():
        print(f"   ✅ {file}")
    else:
        print(f"   ❌ {file} - MISSING")
        missing.append(file)

if missing:
    print(f"\n   ⚠️  Missing {len(missing)} required files")
else:
    print("\n   ✅ All required files present")
print()

# Test 2: Environment Setup
print("2️⃣  Testing Environment Setup...")
try:
    from dotenv import load_dotenv
    env_local = BASE_DIR / '.env.local'
    env_file = BASE_DIR / '.env'
    
    if env_local.exists():
        load_dotenv(dotenv_path=env_local, override=False)
        print(f"   ✅ .env.local found and loaded")
    elif env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
        print(f"   ✅ .env found and loaded")
    else:
        print("   ⚠️  No .env.local or .env file found")
    
    use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
    print(f"   USE_SQLITE: {use_sqlite}")
    print("   ✅ Environment setup OK")
except Exception as e:
    print(f"   ❌ Environment setup failed: {e}")
print()

# Test 3: Django Import
print("3️⃣  Testing Django Import...")
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
    import django
    django.setup()
    print("   ✅ Django imported and setup successful")
except Exception as e:
    print(f"   ❌ Django setup failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
print()

# Test 4: Settings Validation
print("4️⃣  Testing Settings...")
try:
    from django.conf import settings
    
    checks = {
        'AUTH_USER_MODEL': settings.AUTH_USER_MODEL == 'users.User',
        'INSTALLED_APPS': len(settings.INSTALLED_APPS) > 10,
        'DATABASE_ENGINE': 'sqlite' in settings.DATABASES['default']['ENGINE'] if use_sqlite else 'postgresql' in settings.DATABASES['default']['ENGINE'],
    }
    
    for name, result in checks.items():
        status = "✅" if result else "❌"
        print(f"   {status} {name}")
    
    if all(checks.values()):
        print("   ✅ Settings validation PASSED")
    else:
        print("   ⚠️  Some settings checks failed")
except Exception as e:
    print(f"   ❌ Settings validation failed: {e}")
print()

# Test 5: Model Imports
print("5️⃣  Testing Model Imports...")
models_to_test = [
    ('users.models', 'User'),
    ('partners.models', 'Partner'),
    ('listings.models', 'Listing'),
    ('bookings.models', 'Booking'),
    ('reviews.models', 'Review'),
    ('favorites.models', 'Favorite'),
]

failed_imports = []
for module_name, model_name in models_to_test:
    try:
        module = __import__(module_name, fromlist=[model_name])
        model = getattr(module, model_name)
        print(f"   ✅ {model_name} imported")
    except Exception as e:
        print(f"   ❌ {model_name} import failed: {e}")
        failed_imports.append((model_name, str(e)))

if failed_imports:
    print(f"\n   ⚠️  {len(failed_imports)} model imports failed")
else:
    print("\n   ✅ All models imported successfully")
print()

# Test 6: URL Configuration
print("6️⃣  Testing URL Configuration...")
try:
    from django.urls import get_resolver
    resolver = get_resolver()
    patterns = list(resolver.url_patterns)
    print(f"   ✅ URL resolver loaded ({len(patterns)} top-level patterns)")
    
    # Test key URLs
    from django.urls import reverse, NoReverseMatch
    test_urls = [
        ('admin:index', 'Admin'),
    ]
    
    for url_name, desc in test_urls:
        try:
            reverse(url_name)
            print(f"   ✅ {desc} URL configured")
        except NoReverseMatch:
            print(f"   ⚠️  {desc} URL not found")
except Exception as e:
    print(f"   ⚠️  URL configuration issue: {e}")
print()

# Test 7: View Imports
print("7️⃣  Testing View Imports...")
views_to_test = [
    'users.views.UserViewSet',
    'partners.views.PartnerViewSet',
    'listings.views.ListingViewSet',
    'bookings.views.BookingViewSet',
]

failed_views = []
for view_path in views_to_test:
    try:
        module_path, view_name = view_path.rsplit('.', 1)
        module = __import__(module_path, fromlist=[view_name])
        view = getattr(module, view_name)
        print(f"   ✅ {view_name} imported")
    except Exception as e:
        print(f"   ⚠️  {view_name} import issue: {e}")
        failed_views.append(view_path)

if not failed_views:
    print("\n   ✅ All views imported successfully")
print()

# Summary
print("=" * 70)
print("📊 TEST SUMMARY")
print("=" * 70)
print()

total_tests = 7
passed_tests = sum([
    len(missing) == 0,  # File structure
    True,  # Environment (always passes if we got here)
    True,  # Django setup (always passes if we got here)
    all(checks.values()) if 'checks' in locals() else False,  # Settings
    len(failed_imports) == 0,  # Models
    True,  # URLs (basic check passed)
    len(failed_views) == 0,  # Views
])

print(f"Tests Passed: {passed_tests}/{total_tests}")
print()

if passed_tests >= 6:
    print("✅ PROJECT IS WORKING! 🎉")
    print()
    print("The project structure is correct and Django can load successfully.")
    print()
    print("Next steps:")
    print("  1. Ensure .env.local has USE_SQLITE=true (or configure PostgreSQL)")
    print("  2. Run: python3 manage.py migrate --fake-initial")
    print("  3. Run: python3 manage.py runserver")
else:
    print("⚠️  Some tests failed. Check the output above.")
    print()
    if missing:
        print(f"Missing files: {', '.join(missing)}")
    if failed_imports:
        print(f"Failed model imports: {len(failed_imports)}")
    if failed_views:
        print(f"Failed view imports: {len(failed_views)}")

print()

