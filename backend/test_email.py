#!/usr/bin/env python
"""
Test script to send a password reset email
Usage: docker-compose exec web python test_email.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from core.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

# Get email from command line or use default
import sys
test_email = sys.argv[1] if len(sys.argv) > 1 else 'ayacheyassine2000@gmail.com'

print(f"Testing password reset email to: {test_email}")
print(f"Email configuration:")
print(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

# Check if user exists
user = User.objects.filter(email=test_email).first()
if not user:
    print(f"❌ User with email {test_email} not found in database!")
    print("Available users:")
    for u in User.objects.all()[:10]:
        print(f"  - {u.email}")
    sys.exit(1)

print(f"✅ User found: {user.email} (ID: {user.id})")
print()

# Generate reset token
token_generator = PasswordResetTokenGenerator()
token = token_generator.make_token(user)
uid = urlsafe_base64_encode(force_bytes(user.pk))
reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"

print(f"Reset URL: {reset_url}")
print()

# Create email
subject = 'Password Reset Request - AirbCar (TEST)'
text_content = f'''
Hello,

You requested to reset your password for your AirbCar account.

Click the following link to reset your password:
{reset_url}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
AirbCar Team
'''

html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request (TEST)</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your AirbCar account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="{reset_url}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">{reset_url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>AirbCar Team</p>
        </div>
    </div>
</body>
</html>
'''

# Send email
try:
    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [test_email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
    print(f"✅ Email sent successfully to {test_email}!")
    print()
    print("📧 Please check:")
    print("  1. Inbox")
    print("  2. Spam/Junk folder")
    print("  3. Promotions tab (Gmail)")
    print("  4. Search for 'AirbCar' or 'Password Reset'")
    print()
    print(f"🔍 Gmail search: from:{settings.EMAIL_HOST_USER} subject:\"Password Reset\"")
except Exception as e:
    print(f"❌ Error sending email: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

