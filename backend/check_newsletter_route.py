"""
Script to check if the newsletter route is registered in Django
Run this while the Django server is running (or use Django shell)
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'airbcar_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.urls import get_resolver, reverse, NoReverseMatch
from django.core.management import execute_from_command_line

def check_route():
    resolver = get_resolver()
    
    print("=" * 60)
    print("Checking Newsletter Route Registration")
    print("=" * 60)
    
    # Try to reverse the URL name
    try:
        url = reverse('newsletter_subscribe')
        print(f"✅ Route found via reverse lookup: {url}")
    except NoReverseMatch as e:
        print(f"❌ Route NOT found via reverse lookup: {e}")
    
    # Check all URL patterns
    print("\nChecking all URL patterns:")
    def print_urls(urlpatterns, prefix=''):
        for pattern in urlpatterns:
            if hasattr(pattern, 'url_patterns'):
                print_urls(pattern.url_patterns, prefix + str(pattern.pattern))
            else:
                pattern_str = str(pattern.pattern)
                if 'newsletter' in pattern_str.lower():
                    print(f"  ✓ Found newsletter pattern: {prefix}{pattern_str}")
                    if hasattr(pattern, 'callback'):
                        print(f"    Callback: {pattern.callback}")
                    if hasattr(pattern, 'name'):
                        print(f"    Name: {pattern.name}")
    
    print_urls(resolver.url_patterns)
    
    # Try to import the view
    print("\nChecking view import:")
    try:
        from core.views import NewsletterSubscriptionView
        print("✅ NewsletterSubscriptionView imported successfully")
        print(f"   Class: {NewsletterSubscriptionView}")
        print(f"   Methods: {[m for m in dir(NewsletterSubscriptionView) if not m.startswith('_')]}")
    except Exception as e:
        print(f"❌ Failed to import NewsletterSubscriptionView: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_route()

