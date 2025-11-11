import os
import sys
import django

sys.path.insert(0, '/app/airbcar_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from core.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

email = sys.argv[1] if len(sys.argv) > 1 else 'yassinepro764@gmail.com'

try:
    user = User.objects.get(email=email)
    token_gen = PasswordResetTokenGenerator()
    token = token_gen.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f'http://localhost:3000/auth/reset-password?uid={uid}&token={token}'
    
    print(f'\n{"="*60}')
    print(f'Sending password reset email to: {email}')
    print(f'Reset URL: {reset_url}')
    print(f'From: {settings.DEFAULT_FROM_EMAIL}')
    print(f'{"="*60}\n')
    
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
        <h2>Password Reset Request</h2>
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
    
    msg = EmailMultiAlternatives(
        'Password Reset Request - AirbCar',
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
    
    print(f'✅ Email sent successfully to {email}!')
    print(f'📧 Check your inbox, spam folder, and promotions tab')
    print(f'🔗 Reset URL: {reset_url}\n')
    
except User.DoesNotExist:
    print(f'❌ User not found: {email}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

