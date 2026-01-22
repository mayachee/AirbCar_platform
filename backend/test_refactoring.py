#!/usr/bin/env python
"""
Quick test script to verify refactoring worked correctly.
Run this from the backend/ directory: python test_refactoring.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

try:
    django.setup()
    print("✅ Django setup successful\n")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

# Test imports
tests = [
    ("users.models", "User"),
    ("users.serializers", "UserSerializer"),
    ("users.views", "UserViewSet"),
    ("partners.models", "Partner"),
    ("partners.serializers", "PartnerSerializer"),
    ("partners.views", "PartnerViewSet"),
    ("listings.models", "Listing"),
    ("listings.serializers", "ListingSerializer"),
    ("listings.views", "ListingViewSet"),
    ("bookings.models", "Booking"),
    ("bookings.serializers", "BookingSerializer"),
    ("bookings.views", "BookingViewSet"),
    ("reviews.models", "Review"),
    ("reviews.serializers", "ReviewSerializer"),
    ("reviews.views", "ReviewViewSet"),
    ("favorites.models", "Favorite"),
    ("favorites.serializers", "FavoriteSerializer"),
    ("favorites.views", "FavoriteViewSet"),
    ("common.utils", "upload_file_to_supabase"),
]

print("Testing imports...")
failed = False

for module_name, class_name in tests:
    try:
        module = __import__(module_name, fromlist=[class_name])
        getattr(module, class_name)
        print(f"✅ {module_name}.{class_name}")
    except ImportError as e:
        print(f"❌ {module_name}.{class_name} - ImportError: {e}")
        failed = True
    except AttributeError as e:
        print(f"❌ {module_name}.{class_name} - AttributeError: {e}")
        failed = True
    except Exception as e:
        print(f"❌ {module_name}.{class_name} - Error: {e}")
        failed = True

# Test URL configuration
print("\nTesting URL configuration...")
try:
    from airbcar_backend.urls import urlpatterns
    print(f"✅ URLs loaded successfully ({len(urlpatterns)} patterns)")
except Exception as e:
    print(f"❌ URL configuration failed: {e}")
    failed = True

# Test settings
print("\nTesting settings...")
try:
    from django.conf import settings
    assert 'users' in settings.INSTALLED_APPS, "users app not in INSTALLED_APPS"
    assert 'partners' in settings.INSTALLED_APPS, "partners app not in INSTALLED_APPS"
    assert settings.AUTH_USER_MODEL == 'users.User', f"AUTH_USER_MODEL should be 'users.User', got '{settings.AUTH_USER_MODEL}'"
    print("✅ Settings configuration correct")
except Exception as e:
    print(f"❌ Settings check failed: {e}")
    failed = True

if failed:
    print("\n❌ Some tests failed. Please check the errors above.")
    sys.exit(1)
else:
    print("\n✅ All tests passed! The refactoring appears to be working correctly.")
    print("\nNext steps:")
    print("1. Run: python manage.py check")
    print("2. Run: python manage.py makemigrations")
    print("3. Run: python manage.py migrate")
    print("4. Run: python manage.py runserver")
    print("\nSee TESTING_GUIDE.md for more details.")

