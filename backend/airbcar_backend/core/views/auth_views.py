"""
Authentication-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum
from django.utils import timezone
from django.db import transaction, OperationalError
from django.contrib.auth import authenticate
from datetime import datetime, timedelta
from django.conf import settings
import traceback
import json
import os
import threading

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset, EmailVerification
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)
from ..utils import send_verification_email, send_password_reset_email
from ..validators import validate_email, validate_password, ValidationError
import logging

logger = logging.getLogger(__name__)

# Notification helpers
try:
    from ..utils.notifications import notify_welcome
except ImportError:
    notify_welcome = None


class LoginView(APIView):
    """User login endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate user and return JWT tokens."""
        email = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Authenticate user
            user = authenticate(username=email, password=password)
            
            if user is None:
                # Try to find user by email
                try:
                    user = User.objects.get(email=email)
                    # Check password manually if email login
                    if not user.check_password(password):
                        user = None
                except User.DoesNotExist:
                    user = None
            
            if user is None:
                return Response({
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                return Response({
                    'error': 'Account is disabled'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate JWT tokens
            try:
                refresh = RefreshToken.for_user(user)
                
                # Add custom claims
                is_partner = False
                try:
                    is_partner = hasattr(user, 'partner_profile') or user.role == 'partner'
                except Exception:
                    pass
                
                refresh['role'] = user.role
                refresh['is_partner'] = is_partner
                refresh['is_staff'] = user.is_staff
                refresh['is_superuser'] = user.is_superuser
                refresh['email'] = user.email
                refresh['username'] = user.username
                
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
            except Exception as token_error:
                error_msg = "Error generating tokens: " + str(token_error)
                if settings.DEBUG:
                    print("Token generation error: " + error_msg)
                    traceback.print_exc()
                return Response({
                    'error': 'Failed to generate authentication tokens',
                    'message': error_msg if settings.DEBUG else None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Serialize user data
            try:
                serializer = UserSerializer(user, context={'request': request})
                user_data = serializer.data
            except Exception as serialization_error:
                error_msg = "Error serializing user data: " + str(serialization_error)
                if settings.DEBUG:
                    print("Serialization error: " + error_msg)
                    traceback.print_exc()
                # Return tokens even if serialization fails (user can still authenticate)
                return Response({
                    'access': access_token,
                    'refresh': refresh_token,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                    },
                    'warning': 'Some user data could not be serialized'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': user_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print("Error in LoginView: " + error_msg)
                traceback.print_exc()
            return Response({
                'error': 'An error occurred during login',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    """User registration endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register a new user with input validation."""
        try:
            # Validate and extract email
            email = request.data.get('email', '').strip()
            email = validate_email(email)
            
            # Validate and extract password
            password = request.data.get('password', '').strip()
            password = validate_password(password)
            
            username = request.data.get('username', '').strip() or email.split('@')[0]
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            phone_number = request.data.get('phone_number', '').strip()
            role = request.data.get('role', 'customer').strip()
            
            # Validate role
            valid_roles = ['customer', 'partner', 'admin']
            if role not in valid_roles:
                return Response({
                    'error': 'Invalid role. Must be one of: ' + ', '.join(valid_roles),
                    'code': 'INVALID_ROLE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return Response({
                    'error': 'User with this email already exists',
                    'code': 'EMAIL_EXISTS'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if username already exists
            if username and User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Username already taken',
                    'code': 'USERNAME_EXISTS'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number,
                    role=role,
                    is_active=True  # User is active but email not verified
                )
                
                logger.info("New user registered: " + email)
                
                # Send verification email asynchronously
                def send_email_async():
                    try:
                        send_verification_email(user)
                    except Exception as e:
                        logger.error("Error sending verification email to " + email + ": " + str(e))
                
                email_thread = threading.Thread(target=send_email_async)
                email_thread.daemon = True
                email_thread.start()

                # Send welcome notification
                if notify_welcome:
                    try:
                        notify_welcome(user)
                    except Exception as e:
                        logger.warning("Failed to send welcome notification: " + str(e))
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Serialize user data
                serializer = UserSerializer(user, context={'request': request})
                
                return Response({
                    'access': access_token,
                    'refresh': refresh_token,
                    'user': serializer.data,
                    'message': 'Registration successful. Please check your email to verify your account.'
                }, status=status.HTTP_201_CREATED)
                
            except Exception as user_creation_error:
                error_msg = str(user_creation_error)
                logger.error("User creation failed: " + error_msg)
                return Response({
                    'error': 'Failed to create user account',
                    'code': 'REGISTRATION_FAILED'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except ValidationError as ve:
            return Response({
                'error': ve.message,
                'code': ve.code
            }, status=ve.status_code)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Unexpected error in RegisterView: {error_msg}")
            return Response({
                'error': 'An error occurred during registration',
                'code': 'REGISTRATION_ERROR',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
    """Refresh JWT token endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Refresh access token using refresh token."""
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            return Response({
                'access': access_token
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Invalid or expired refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)


class VerifyTokenView(APIView):
    """Verify JWT token endpoint."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Verify if the current token is valid."""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({
            'valid': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """Verify user email endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Verify user email using token."""
        token = request.data.get('token')
        
        if not token:
            return Response({
                'error': 'Verification token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            verification = EmailVerification.objects.get(
                token=token,
                expires_at__gt=timezone.now(),
                is_verified=False
            )
            
            # Mark email as verified
            verification.is_verified = True
            verification.save()
            
            # Mark user email as verified (if you have such a field)
            user = verification.user
            user.is_active = True  # Activate user account
            user.save()
            
            return Response({
                'message': 'Email verified successfully'
            }, status=status.HTTP_200_OK)
            
        except EmailVerification.DoesNotExist:
            return Response({
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in VerifyEmailView: {error_msg}")
            return Response({
                'error': 'An error occurred during email verification',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendVerificationEmailView(APIView):
    """Resend verification email endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Resend verification email."""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Send verification email asynchronously
            def send_email_async():
                try:
                    send_verification_email(user)
                except Exception as e:
                    if settings.DEBUG:
                        print(f"Error sending verification email: {e}")
            
            email_thread = threading.Thread(target=send_email_async)
            email_thread.daemon = True
            email_thread.start()
            
            return Response({
                'message': 'Verification email sent. Please check your inbox.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists (security)
            return Response({
                'message': 'If an account with this email exists, a verification email has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ResendVerificationEmailView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetRequestView(APIView):
    """Request password reset email endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Send password reset email."""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Send password reset email with verification code
            # This returns tuple: (password_reset, verification)
            password_reset, verification = send_password_reset_email(user)
            
            if password_reset is None or verification is None:
                # Email sending failed - log it but don't reveal to prevent user enumeration
                logger.error(f"Password reset email failed for {email}")
                # Return success anyway to prevent user enumeration
                return Response({
                    'message': 'If an account with this email exists, a password reset link has been sent.',
                    'email_sent': False
                }, status=status.HTTP_200_OK)

            logger.info(f"Password reset email with verification code sent to {email}")
            return Response({
                'message': 'If an account with this email exists, check your email for a verification code.',
                'email_sent': True,
                'requires_verification': True
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists (security best practice)
            logger.debug(f"Password reset requested for non-existent email: {email}")
            return Response({
                'message': 'If an account with this email exists, check your email for a verification code.',
                'requires_verification': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error in password reset request for {email}: {error_msg}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing your request'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmView(APIView):
    """Confirm password reset endpoint."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Validate a password reset token (called by frontend before showing form)."""
        token = request.query_params.get('token')
        if not token:
            return Response({'valid': False, 'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            password_reset = PasswordReset.objects.get(
                token=token,
                expires_at__gt=timezone.now(),
                is_used=False
            )
            return Response({'valid': True}, status=status.HTTP_200_OK)
        except PasswordReset.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid or expired reset token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error validating password reset token: {e}")
            return Response(
                {'valid': False, 'error': 'An error occurred while validating the token'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Reset password using token with validation."""
        try:
            token = request.data.get('token', '').strip()
            new_password = request.data.get('new_password') or request.data.get('password')
            
            if not token:
                return Response({
                    'error': 'Password reset token is required',
                    'code': 'MISSING_TOKEN'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not new_password:
                return Response({
                    'error': 'New password is required',
                    'code': 'MISSING_PASSWORD'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate password strength
            try:
                new_password = validate_password(new_password)
            except ValidationError as ve:
                return Response({
                    'error': ve.message,
                    'code': ve.code
                }, status=ve.status_code)
            
            # Find and validate token
            try:
                password_reset = PasswordReset.objects.get(
                    token=token,
                    expires_at__gt=timezone.now(),
                    is_used=False
                )
            except PasswordReset.DoesNotExist:
                logger.warning("Invalid or expired password reset token attempted: " + token[:20] + "...")
                return Response({
                    'error': 'Invalid or expired reset token',
                    'code': 'INVALID_TOKEN'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user's email has been verified (similar to 2FA requirement)
            user = password_reset.user
            email_verification = EmailVerification.objects.filter(
                user=user,
                is_used=True,
                expires_at__gt=timezone.now()
            ).exists()
            
            if not email_verification:
                logger.warning(f"Attempted password reset without email verification: {user.email}")
                return Response({
                    'error': 'Please verify your email before resetting your password',
                    'code': 'EMAIL_NOT_VERIFIED',
                    'requires_verification': True
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Use transaction to ensure atomicity
            with transaction.atomic():
                # Update user password
                user.set_password(new_password)
                user.save()
                
                # Mark token as used AFTER successful password save
                password_reset.is_used = True
                password_reset.save()
                
                logger.info("Password successfully reset for user " + user.email)
            
            return Response({
                'message': 'Password reset successfully',
                'reset': True,
                'code': 'PASSWORD_RESET_SUCCESS'
            }, status=status.HTTP_200_OK)
            
        except ValidationError as ve:
            return Response({
                'error': ve.message,
                'code': ve.code
            }, status=ve.status_code)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error in PasswordResetConfirmView: {error_msg}")
            return Response({
                'error': 'An error occurred during password reset',
                'code': 'PASSWORD_RESET_ERROR',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetVerifyEmailView(APIView):
    """
    Verify email for password reset using verification code.
    Similar to 2FA OTP verification - user must verify email before resetting password.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Verify email code for password reset.
        
        After user submits verification code from email, this endpoint:
        1. Validates the code matches an active EmailVerification record
        2. Marks the verification as used
        3. Returns reset token for actual password reset
        """
        try:
            email = request.data.get('email', '').strip()
            verification_code = request.data.get('code', '').strip()
            
            if not email:
                return Response({
                    'error': 'Email is required',
                    'code': 'MISSING_EMAIL'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not verification_code:
                return Response({
                    'error': 'Verification code is required',
                    'code': 'MISSING_CODE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find user and verification record
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.debug(f"Email verification attempted for non-existent user: {email}")
                return Response({
                    'error': 'Invalid email or verification code',
                    'code': 'INVALID_EMAIL'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find valid (not expired, not used) verification record
            try:
                verification = EmailVerification.objects.get(
                    user=user,
                    token=verification_code,
                    expires_at__gt=timezone.now(),
                    is_used=False
                )
            except EmailVerification.DoesNotExist:
                logger.warning(f"Invalid or expired verification code attempted for {email}")
                return Response({
                    'error': 'Invalid or expired verification code',
                    'code': 'INVALID_CODE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find corresponding password reset token
            try:
                password_reset = PasswordReset.objects.get(
                    user=user,
                    expires_at__gt=timezone.now(),
                    is_used=False
                )
            except PasswordReset.DoesNotExist:
                logger.warning(f"No valid password reset token found for {email} after email verification")
                return Response({
                    'error': 'Password reset token not found. Please restart the process.',
                    'code': 'TOKEN_NOT_FOUND'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark verification as used (one-time only - similar to 2FA)
            verification.is_used = True
            verification.save()
            
            logger.info(f"Email verified for password reset: {email}")
            
            return Response({
                'message': 'Email verified successfully',
                'verified': True,
                'reset_token': password_reset.token,
                'code': 'EMAIL_VERIFIED'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error in PasswordResetVerifyEmailView: {error_msg}", exc_info=True)
            return Response({
                'error': 'An error occurred during email verification',
                'code': 'VERIFICATION_ERROR',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    """User logout endpoint - invalidates JWT tokens."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout user by invalidating their refresh token."""
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                # Allow logout without refresh token (frontend may not have it)
                logger.info("User " + request.user.email + " logged out without providing refresh token")
                return Response({
                    'message': 'Successfully logged out'
                }, status=status.HTTP_200_OK)
            
            try:
                refresh = RefreshToken(refresh_token)
                # Blacklist the token by adding it to a blacklist
                # NOTE: This requires django-rest-framework-simplejwt >= 4.6.0 with TOKEN_BLACKLIST app
                refresh.blacklist()
                logger.info(f"User {request.user.email} successfully logged out")
                
                return Response({
                    'message': 'Successfully logged out'
                }, status=status.HTTP_200_OK)
                
            except (InvalidToken, TokenError):
                # Token is already invalid or blacklisted
                logger.warning(f"Logout attempted with invalid refresh token for user {request.user.email}")
                return Response({
                    'message': 'Already logged out or invalid token'
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error("Error during logout: " + str(e))
            return Response({
                'error': 'An error occurred during logout',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleAuthView(APIView):
    """Google OAuth authentication endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate with Google OAuth token."""
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response({
                'error': 'Google ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            import requests
            
            # Verify token with Google (with timeout to prevent hanging)
            google_response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}',
                timeout=10
            )
            
            if google_response.status_code != 200:
                return Response({
                    'error': 'Invalid Google token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            google_data = google_response.json()
            email = google_data.get('email')
            
            if not email:
                return Response({
                    'error': 'Email not found in Google token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': google_data.get('given_name', ''),
                    'last_name': google_data.get('family_name', ''),
                    'is_active': True,
                    'is_verified': True,  # Google verified emails are trusted
                }
            )
            
            # Update profile picture if available
            if google_data.get('picture') and not user.profile_picture_url:
                user.profile_picture_url = google_data.get('picture')
                user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Serialize user data
            serializer = UserSerializer(user, context={'request': request})
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': serializer.data,
                'created': created
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in GoogleAuthView: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred during Google authentication',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
