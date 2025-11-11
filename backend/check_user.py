import os
import sys
import django

# Add the project directory to Python path
sys.path.insert(0, '/app/airbcar_backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import User

email = 'yassinepro764@gmail.com'
user = User.objects.filter(email=email).first()

if user:
    print(f"USER FOUND: {user.email} (ID: {user.id})")
    sys.exit(0)
else:
    print(f"USER NOT FOUND: {email}")
    print("\nThis email is not registered in the database.")
    print("The system only sends password reset emails to registered users.")
    print("\nTo receive a password reset email, you must:")
    print("1. Register an account with this email first")
    print("2. OR use an email that's already registered")
    sys.exit(1)

