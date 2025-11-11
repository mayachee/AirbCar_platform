"""
Quick verification script to check if Django server can import the newsletter view
Run this from the backend/airbcar_backend directory
"""
import os
import sys
import django

# Add the project directory to the path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

try:
    django.setup()
    print("✅ Django setup successful")
    
    # Try to import the view
    try:
        from core.views import NewsletterSubscriptionView
        print("✅ NewsletterSubscriptionView imported successfully")
        print(f"   Class: {NewsletterSubscriptionView}")
        print(f"   Base classes: {NewsletterSubscriptionView.__bases__}")
        print(f"   Methods: {[m for m in dir(NewsletterSubscriptionView) if not m.startswith('_') and callable(getattr(NewsletterSubscriptionView, m, None))]}")
    except ImportError as e:
        print(f"❌ Failed to import NewsletterSubscriptionView: {e}")
        import traceback
        traceback.print_exc()
    
    # Try to import from urls
    try:
        from airbcar_backend.urls import urlpatterns
        print("✅ URLs imported successfully")
        
        # Check if newsletter route is in urlpatterns
        newsletter_found = False
        for pattern in urlpatterns:
            if hasattr(pattern, 'name') and pattern.name == 'newsletter_subscribe':
                newsletter_found = True
                print(f"✅ Newsletter route found in urlpatterns")
                print(f"   Pattern: {pattern.pattern}")
                print(f"   Name: {pattern.name}")
                break
        
        if not newsletter_found:
            print("❌ Newsletter route NOT found in urlpatterns")
            print("   Available route names:")
            def get_route_names(patterns, prefix=''):
                names = []
                for pattern in patterns:
                    if hasattr(pattern, 'url_patterns'):
                        names.extend(get_route_names(pattern.url_patterns, prefix + str(pattern.pattern)))
                    elif hasattr(pattern, 'name') and pattern.name:
                        names.append(f"{prefix}{pattern.pattern} -> {pattern.name}")
                return names
            route_names = get_route_names(urlpatterns)
            for name in route_names[:10]:  # Show first 10
                print(f"     - {name}")
    except Exception as e:
        print(f"❌ Failed to import URLs: {e}")
        import traceback
        traceback.print_exc()
        
    # Try to reverse the URL
    try:
        from django.urls import reverse
        url = reverse('newsletter_subscribe')
        print(f"✅ URL reverse successful: {url}")
    except Exception as e:
        print(f"❌ URL reverse failed: {e}")
        
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    import traceback
    traceback.print_exc()

