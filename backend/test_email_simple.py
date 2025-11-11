from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from core.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

test_email = 'ayacheyassine2000@gmail.com'

print(f"Testing password reset email to: {test_email}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

user = User.objects.filter(email=test_email).first()
if not user:
    print(f"User not found!")
    sys.exit(1)

print(f"User found: {user.email}")

token_generator = PasswordResetTokenGenerator()
token = token_generator.make_token(user)
uid = urlsafe_base64_encode(force_bytes(user.pk))
reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"

subject = 'Password Reset Request - AirbCar'
text_content = f'Click this link to reset your password: {reset_url}'
html_content = f'<h2>Password Reset</h2><p>Click <a href="{reset_url}">here</a> to reset your password.</p>'

msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [test_email])
msg.attach_alternative(html_content, "text/html")
msg.send(fail_silently=False)

print(f"Email sent successfully to {test_email}!")

