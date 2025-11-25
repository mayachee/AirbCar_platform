"""
Utility functions for email verification and password reset.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import EmailVerification, PasswordReset, User


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


def send_password_reset_email(user):
    """
    Send password reset email to user.
    
    Args:
        user: User instance to send password reset email to
        
    Returns:
        PasswordReset instance or None if failed
    """
    try:
        # Generate a new reset token
        token = PasswordReset.generate_token()
        
        # Create reset record (expires in 24 hours)
        password_reset = PasswordReset.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # Build reset URL
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        
        # Email subject and message
        subject = 'Reset your AirbCar password'
        message = f"""
Hello {user.first_name or user.email},

You requested to reset your password for your AirbCar account.

Click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

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
        
        return password_reset
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return None


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

