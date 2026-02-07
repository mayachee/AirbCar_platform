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

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset, EmailVerification
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)
from ..utils import send_verification_email, send_password_reset_email


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
                error_msg = f"Error generating tokens: {str(token_error)}"
                if settings.DEBUG:
                    print(f"Token generation error: {error_msg}")
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
                error_msg = f"Error serializing user data: {str(serialization_error)}"
                if settings.DEBUG:
                    print(f"Serialization error: {error_msg}")
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
                print(f"Error in LoginView: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred during login',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    """User registration endpoint."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register a new user."""
        email = request.data.get('email')
        password = request.data.get('password')
        username = request.data.get('username') or email.split('@')[0] if email else None
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'customer')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if username and User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already taken'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user
            user = User.objects.create_user(
                username=username or email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=True  # User is active but email not verified
            )
            
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
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in RegisterView: {error_msg}")
                traceback.print_exc()
            return Response({
                'error': 'An error occurred during registration',
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
    
    def _send_email_resend(self, to_email, subject, body):
        """Send email via Resend HTTP API (bypasses SMTP entirely)."""
        import json
        import urllib.request
        import urllib.error
        
        api_key = getattr(settings, 'RESEND_API_KEY', '') or os.environ.get('RESEND_API_KEY', '')
        if not api_key:
            raise RuntimeError('RESEND_API_KEY not configured')
        
        # Use Resend's free test sender if no verified domain is configured
        from_email = getattr(settings, 'RESEND_FROM_EMAIL', '') or os.environ.get('RESEND_FROM_EMAIL', '')
        if not from_email:
            from_email = 'AirbCar <onboarding@resend.dev>'
        
        payload = json.dumps({
            'from': from_email,
            'to': [to_email],
            'subject': subject,
            'text': body,
        }).encode('utf-8')
        
        req = urllib.request.Request(
            'https://api.resend.com/emails',
            data=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    
    def _send_email_smtp(self, to_email, subject, body):
        """Send email via Django's SMTP backend."""
        from django.core.mail import send_mail
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
    
    def post(self, request):
        """Send password reset email."""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Create password reset token
            token = PasswordReset.generate_token()
            password_reset = PasswordReset.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
            subject = 'Reset your AirbCar password'
            body = (
                f"Hello {user.first_name or user.email},\n\n"
                f"You requested to reset your password for your AirbCar account.\n\n"
                f"Click the link below to reset your password:\n\n"
                f"{reset_url}\n\n"
                f"This link will expire in 24 hours.\n\n"
                f"If you didn't request a password reset, please ignore this email. "
                f"Your password will remain unchanged.\n\n"
                f"Best regards,\nThe AirbCar Team"
            )
            
            try:
                # Try Resend HTTP API first (works on Render which blocks SMTP)
                resend_key = getattr(settings, 'RESEND_API_KEY', '') or os.environ.get('RESEND_API_KEY', '')
                if resend_key:
                    self._send_email_resend(user.email, subject, body)
                else:
                    self._send_email_smtp(user.email, subject, body)
            except Exception as mail_err:
                print(f"Email send error to {user.email}: {mail_err}")
                print(traceback.format_exc())
                password_reset.delete()
                return Response({
                    'error': 'Failed to send password reset email. Please try again later.',
                    'detail': str(mail_err),
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.',
                'email_sent': True
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            print(f"Error in password reset request: {error_msg}")
            print(traceback.format_exc())
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
            PasswordReset.objects.get(
                token=token,
                expires_at__gt=timezone.now(),
                is_used=False
            )
            return Response({'valid': True}, status=status.HTTP_200_OK)
        except PasswordReset.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid or expired reset token'}, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request):
        """Reset password using token."""
        token = request.data.get('token')
        new_password = request.data.get('new_password') or request.data.get('password')
        
        if not token or not new_password:
            return Response({
                'error': 'Token and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            password_reset = PasswordReset.objects.get(
                token=token,
                expires_at__gt=timezone.now(),
                is_used=False
            )
            
            # Update user password
            user = password_reset.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            password_reset.is_used = True
            password_reset.save()
            
            return Response({
                'message': 'Password reset successfully',
                'reset': True
            }, status=status.HTTP_200_OK)
            
        except PasswordReset.DoesNotExist:
            return Response({
                'error': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in PasswordResetConfirmView: {error_msg}")
            return Response({
                'error': 'An error occurred during password reset',
                'message': error_msg if settings.DEBUG else None
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
            
            # Verify token with Google
            google_response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}'
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
