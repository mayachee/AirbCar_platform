from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from core.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


class Command(BaseCommand):
    help = 'Test password reset email sending'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to send test email to')

    def handle(self, *args, **options):
        test_email = options['email']
        
        self.stdout.write(f"Testing password reset email to: {test_email}")
        self.stdout.write(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        self.stdout.write(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write("")
        
        user = User.objects.filter(email=test_email).first()
        if not user:
            self.stdout.write(self.style.ERROR(f"❌ User with email {test_email} not found in database!"))
            self.stdout.write("Available users:")
            for u in User.objects.all()[:10]:
                self.stdout.write(f"  - {u.email}")
            return
        
        self.stdout.write(self.style.SUCCESS(f"✅ User found: {user.email} (ID: {user.id})"))
        self.stdout.write("")
        
        # Generate reset token
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"
        
        self.stdout.write(f"Reset URL: {reset_url}")
        self.stdout.write("")
        
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
            self.stdout.write(self.style.SUCCESS(f"✅ Email sent successfully to {test_email}!"))
            self.stdout.write("")
            self.stdout.write("📧 Please check:")
            self.stdout.write("  1. Inbox")
            self.stdout.write("  2. Spam/Junk folder")
            self.stdout.write("  3. Promotions tab (Gmail)")
            self.stdout.write("  4. Search for 'AirbCar' or 'Password Reset'")
            self.stdout.write("")
            self.stdout.write(f"🔍 Gmail search: from:{settings.EMAIL_HOST_USER} subject:\"Password Reset\"")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error sending email: {str(e)}"))
            import traceback
            traceback.print_exc()

