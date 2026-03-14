"""
Utility functions for email verification and password reset.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import EmailVerification, PasswordReset, User
import os
import json
import urllib.request
import urllib.error
import urllib.parse
import logging

logger = logging.getLogger(__name__)


def validate_url_scheme(url):
    """Validate that URL uses only http or https scheme."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            raise ValueError(f'Unsupported URL scheme: {parsed.scheme}. Only http and https are allowed.')
        return True
    except Exception as e:
        logger.error(f"URL validation failed for {url}: {e}")
        raise


def send_verification_email(user):
    """
    Send email verification email to user.
    
    Args:
        user: User instance to send verification email to
        
    Returns:
        EmailVerification instance or None if failed
    """
    try:
        # Generate a new verification token
        token = EmailVerification.generate_token()
        
        # Create verification record (expires in 24 hours)
        verification = EmailVerification.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # Build verification URL
        verification_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
        
        # Email subject and message
        subject = 'Verify your AirbCar account email'
        message = f"""
Hello {user.first_name or user.email},

Thank you for signing up for AirbCar!

Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account with AirbCar, please ignore this email.

Best regards,
The AirbCar Team
"""
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return verification
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return None


def verify_email_token(token):
    """
    Verify an email verification token.
    
    Args:
        token: Verification token string
        
    Returns:
        tuple: (success: bool, user: User or None, message: str)
    """
    try:
        # First, try to find the token (even if used)
        try:
            verification = EmailVerification.objects.get(token=token)
        except EmailVerification.DoesNotExist:
            return False, None, "Invalid verification link. The token does not exist."
        
        user = verification.user
        
        # Check if user is already verified
        if user.is_verified and user.is_active:
            return True, user, "Email is already verified. You can now sign in."
        
        # Check if token is already used
        if verification.is_used:
            # If user is not verified but token is used, allow re-verification
            if not user.is_verified:
                # Reset the token and allow verification
                verification.is_used = False
                verification.save()
            else:
                return False, None, "This verification link has already been used. Your email is already verified."
        
        # Check if token is expired
        if verification.is_expired():
            return False, None, "Verification link has expired. Please request a new one."
        
        # Mark token as used
        verification.is_used = True
        verification.save()
        
        # Mark user as verified and activate account
        user.is_verified = True
        user.is_active = True
        user.save()
        
        return True, user, "Email verified successfully!"
    except Exception as e:
        print(f"Error verifying email token: {e}")
        import traceback
        traceback.print_exc()
        return False, None, "An error occurred during verification."


def _send_email_resend(to_email, subject, body, html=None):
    """
    Send email via Resend HTTP API (bypasses SMTP entirely).
    Used for Render.com which blocks outbound SMTP ports.
    """
    api_key = getattr(settings, 'RESEND_API_KEY', '') or os.environ.get('RESEND_API_KEY', '')
    if not api_key:
        raise RuntimeError('RESEND_API_KEY not configured')
    
    # Use verified domain sender, fall back to test sender
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', '') or os.environ.get('RESEND_FROM_EMAIL', '')
    if not from_email:
        from_email = 'AirbCar <onboarding@resend.dev>'
    
    payload = {
        'from': from_email,
        'to': [to_email],
        'subject': subject,
        'text': body,
    }
    if html:
        payload['html'] = html

    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    
    try:
        timeout = getattr(settings, 'EMAIL_TIMEOUT', 60) or 60  # 60 second timeout
        resp = urllib.request.urlopen(req, timeout=timeout)
        resp_data = json.loads(resp.read().decode())
        logger.info(f"Resend API success: {resp_data} (from={from_email}, to={to_email})")
        return resp_data
    except urllib.error.HTTPError as e:
        error_body = ''
        try:
            error_body = e.read().decode()
        except Exception:
            pass
        logger.error(f"Resend API FAILED {e.code}: {error_body} (to={to_email})")
        raise RuntimeError(
            f'Resend API {e.code}: {error_body}'
        )


def send_password_reset_email(user):
    """
    Send password reset email to user with verification code.
    Supports both Resend HTTP API and SMTP backends.
    Implements email verification similar to 2FA OTP system.
    
    Args:
        user: User instance to send password reset email to
        
    Returns:
        tuple: (password_reset: PasswordReset, verification: EmailVerification) or (None, None) if failed
    """
    try:
        import secrets
        
        # Delete any existing unexpired verification codes for this user (prevent accumulation)
        EmailVerification.objects.filter(
            user=user,
            expires_at__gt=timezone.now(),
            is_used=False
        ).delete()
        
        logger.info(f"Cleaned up previous verification codes for {user.email}")
        
        # Generate secure reset token and verification code
        token = PasswordReset.generate_token()
        verification_code = secrets.token_hex(3)  # 6-digit hex code (e.g., "a3f2c1")
        
        # Create reset record (expires in 24 hours)
        password_reset = PasswordReset.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # Create verification record (expires in 15 minutes for email verification)
        # This forces users to verify their email quickly before proceeding with password reset
        verification = EmailVerification.objects.create(
            user=user,
            token=verification_code,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        
        # Build reset URL (will be used after email verification)
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        
        # Email subject and message with verification code
        subject = 'AirbCar - Verify Your Email to Reset Password'
        body = (
            f"Hello {user.first_name or user.email},\n\n"
            f"You requested to reset your password for your AirbCar account.\n\n"
            f"Your verification code is: {verification_code}\n\n"
            f"This code will expire in 15 minutes.\n\n"
            f"Once verified, you can reset your password using this link:\n"
            f"{reset_url}\n\n"
            f"If you didn't request a password reset, please ignore this email. "
            f"Your account security is important to us.\n\n"
            f"Best regards,\nThe AirbCar Team"
        )
        html_body = (
            f'<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">'
            f'<h2 style="color:#1e40af;margin-bottom:24px">Verify Your Email</h2>'
            f'<p style="color:#374151;font-size:15px;line-height:1.6">Hello {user.first_name or user.email},</p>'
            f'<p style="color:#374151;font-size:15px;line-height:1.6">You requested to reset your password for your AirbCar account.</p>'
            f'<div style="background:#fff;border:2px solid #dbeafe;border-radius:8px;padding:16px;margin:24px 0;text-align:center">'
            f'<p style="color:#6b7280;font-size:13px;margin:0 0 8px 0">Your Verification Code:</p>'
            f'<p style="color:#1e40af;font-size:28px;font-weight:700;margin:0;letter-spacing:4px">{verification_code}</p>'
            f'<p style="color:#9ca3af;font-size:12px;margin:8px 0 0 0">Expires in 15 minutes</p>'
            f'</div>'
            f'<p style="color:#374151;font-size:14px;line-height:1.6;margin:24px 0 0 0">'
            f'After verifying this code, use this button to reset your password:</p>'
            f'<p style="text-align:center;margin:16px 0">'
            f'<a href="{reset_url}" style="background:#2563eb;color:#fff;padding:12px 32px;'
            f'border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset Password</a></p>'
            f'<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;margin:24px 0">'
            f'<p style="color:#92400e;font-size:13px;margin:0;font-weight:500">'
            f'⚠️ If you didn\'t request this, please contact support immediately.</p>'
            f'</div>'
            f'<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">'
            f'<p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">AirbCar Team</p>'
            f'</div>'
        )
        
        # Send email via Resend API or SMTP with proper error handling
        resend_key = getattr(settings, 'RESEND_API_KEY', '') or os.environ.get('RESEND_API_KEY', '')
        try:
            if resend_key:
                _send_email_resend(user.email, subject, body, html=html_body)
            else:
                # Fall back to Django's configured email backend (SMTP)
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            
            logger.info(f"Password reset email with verification code sent to {user.email}")
            return password_reset, verification
            
        except Exception as email_error:
            logger.error(
                f"Failed to send password reset email to {user.email}: {email_error}",
                exc_info=True
            )
            # Clean up the created records if email sending fails
            password_reset.delete()
            verification.delete()
            raise
            
    except Exception as e:
        logger.error(f"Error in send_password_reset_email for {user.email}: {e}", exc_info=True)
        return None, None


def verify_password_reset_token(token):
    """
    Verify a password reset token.
    
    Args:
        token: Reset token string
        
    Returns:
        tuple: (success: bool, user: User or None, message: str)
    """
    try:
        password_reset = PasswordReset.objects.get(token=token, is_used=False)
        
        # Check if token is expired
        if password_reset.is_expired():
            return False, None, "Password reset link has expired. Please request a new one."
        
        return True, password_reset.user, "Token is valid."
    except PasswordReset.DoesNotExist:
        return False, None, "Invalid password reset link."
    except Exception as e:
        print(f"Error verifying password reset token: {e}")
        return False, None, "An error occurred during verification."


def reset_password_with_token(token, new_password):
    """
    Reset user password using a valid token.
    
    Args:
        token: Reset token string
        new_password: New password to set
        
    Returns:
        tuple: (success: bool, user: User or None, message: str)
    """
    try:
        password_reset = PasswordReset.objects.get(token=token, is_used=False)
        
        # Check if token is expired
        if password_reset.is_expired():
            return False, None, "Password reset link has expired. Please request a new one."
        
        # Reset user password BEFORE marking token as used
        # This ensures password is saved even if token update fails
        user = password_reset.user
        
        # Set the new password (Django's set_password automatically hashes it)
        user.set_password(new_password)
        
        # Ensure user is active (in case they were deactivated)
        user.is_active = True
        user.save()
        
        # Mark token as used AFTER password is successfully saved
        password_reset.is_used = True
        password_reset.save()
        
        # Verify password was saved correctly by checking it
        user.refresh_from_db()
        if not user.check_password(new_password):
            print(f"ERROR: Password verification failed after reset for user {user.email}")
            return False, None, "Password was not saved correctly. Please try again."
        
        print(f"Password successfully reset for user {user.email}")
        return True, user, "Password reset successfully!"
    except PasswordReset.DoesNotExist:
        return False, None, "Invalid password reset link."
    except Exception as e:
        print(f"Error resetting password: {e}")
        import traceback
        traceback.print_exc()
        return False, None, "An error occurred while resetting password."

