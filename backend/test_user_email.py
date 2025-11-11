#!/usr/bin/env python
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import User
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

test_email = sys.argv[1] if len(sys.argv) > 1

print(f"Checking user: {test_email}")
user = User.objects.filter(email=test_email).first()

if user:
    print(f"✅ User found: {user.email} (ID: {user.id})")
    print("Sending test email...")
    
    try:
        msg = EmailMultiAlternatives(
            'TEST - Password Reset - AirbCar',
            f'This is a test email for {test_email}',
            settings.DEFAULT_FROM_EMAIL,
            [test_email]
        )
        msg.send(fail_silently=False)
        print(f"✅ Email sent successfully to {test_email}")
        print("Check your inbox, spam, and promotions tab!")
    except Exception as e:
        print(f"❌ Error sending email: {e}")
else:
    print(f"❌ User NOT found in database: {test_email}")
    print("This is why no email was sent - the system doesn't send emails for non-existent users (security feature)")
    print("\nAvailable emails (first 20):")
    for u in User.objects.all()[:20]:
        print(f"  - {u.email}")

