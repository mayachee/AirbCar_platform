from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import uuid
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail, EmailMultiAlternatives
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from common.utils import upload_file_to_supabase
import logging

from .models import User
from .serializers import (
    UserSerializer, CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from bookings.serializers import BookingSerializer
from bookings.models import Booking

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            raise ValidationError({"detail": "You are not logged in."})
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        user = serializer.save()
        profile_pic = self.request.FILES.get("profile_picture")
        front_doc = self.request.FILES.get("id_front_document_url")
        back_doc = self.request.FILES.get("id_back_document_url")

        if profile_pic:
            url = upload_file_to_supabase(profile_pic, folder=f"id_documents/{user.id}")
            user.profile_picture = url
            user.save(update_fields=["profile_picture"])
        if front_doc:
            url = upload_file_to_supabase(front_doc, folder=f"id_documents/{user.id}")
            user.id_front_document_url = url
            user.save(update_fields=["id_front_document_url"])
        if back_doc:
            url = upload_file_to_supabase(back_doc, folder=f"id_documents/{user.id}")
            user.id_back_document_url = url
            user.save(update_fields=["id_back_document_url"])

        user.email_verification_token = str(uuid.uuid4())
        user.save()

        verification_url = f"{self.request.build_absolute_uri('/verify-email/')}?token={user.email_verification_token}"
        send_mail(
            subject='Verify your email',
            message=f'Click the link to verify your email: {verification_url}',
            from_email='no-reply@airbcar.com',
            recipient_list=[user.email],
            fail_silently=False,
        )

    def perform_update(self, serializer):
        user = serializer.save()
        
        profile_picture = self.request.FILES.get("profile_picture")
        id_front_document = self.request.FILES.get("id_front_document_url")
        id_back_document = self.request.FILES.get("id_back_document_url")

        if profile_picture:
            url = upload_file_to_supabase(profile_picture, folder=f"id_documents/{user.id}")
            user.profile_picture = url
            user.save(update_fields=["profile_picture"])
        if id_front_document:
            url = upload_file_to_supabase(id_front_document, folder=f"id_documents/{user.id}")
            user.id_front_document_url = url
            user.save(update_fields=["id_front_document_url"])
        if id_back_document:
            url = upload_file_to_supabase(id_back_document, folder=f"id_documents/{user.id}")
            user.id_back_document_url = url
            user.save(update_fields=["id_back_document_url"])

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update the current user's profile"""
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                self.perform_update(serializer)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='me/bookings/history')
    def booking_history(self, request):
        """Get booking history for the current user (past/completed bookings)"""
        user = request.user
        now = timezone.now()
        
        # Build query - user can see their own bookings or bookings for their listings if partner
        query = Q(user=user)
        if user.is_partner:
            query |= Q(listing__partner__user=user)
        
        # Get bookings that are in the past or completed/cancelled/rejected
        bookings = Booking.objects.select_related(
            'user', 'listing', 'listing__partner', 'listing__partner__user'
        ).filter(query).filter(
            Q(status__in=['completed', 'cancelled', 'rejected']) | 
            Q(end_time__lt=now)
        ).distinct().order_by('-end_time', '-requested_at')
        
        # Apply pagination
        page = self.paginate_queryset(bookings)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        # Check if email exists in database - but ALWAYS send an email regardless
        user = None
        user_exists = False
        user_active = False
        
        try:
            user = User.objects.filter(email=email).first()
            
            if user:
                user_exists = True
                user_active = user.is_active
                logger.info(f'Password reset requested for email: {email} (User ID: {user.id}, Active: {user.is_active})')
        except Exception as db_error:
            logger.error(f'Database error while checking email {email}: {str(db_error)}', exc_info=True)
        
        # ALWAYS send an email - regardless of whether user exists
        try:
            from django.conf import settings
            import urllib.parse
            
            # If user exists and is active, generate reset token and URL
            reset_url = None
            if user_exists and user_active:
                token_generator = PasswordResetTokenGenerator()
                token = token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                encoded_uid = urllib.parse.quote(uid, safe='')
                encoded_token = urllib.parse.quote(token, safe='')
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                reset_url = f"{frontend_url}/auth/reset-password?uid={encoded_uid}&token={encoded_token}"
            
            subject = 'Reset Your Password - AirbCar'
            
            # Generate email content
            if reset_url:
                text_content = f'''Hello,

You requested to reset your password for your AirbCar account.

Click the following link to reset your password:
{reset_url}

This link will expire in 24 hours for security reasons.

If you did not request this password reset, please ignore this email. Your account remains secure.

Need help? Contact us at support@airbcar.com

Best regards,
The AirbCar Team'''
                message_html = '<p class="message">We received a request to reset the password for your AirbCar account. If you made this request, please click the button below to create a new password.</p>'
                button_html = f'''<div class="button-container"><a href="{reset_url}" class="button">Reset My Password</a></div>'''
            else:
                text_content = f'''Hello,

We received a request to reset the password for an AirbCar account associated with this email address.

If you have an account with us and requested this password reset, please try again using the email address associated with your account.

If you did not request this password reset, please ignore this email. Your account remains secure.

Need help? Contact us at support@airbcar.com

Best regards,
The AirbCar Team'''
                message_html = '<p class="message">We received a request to reset the password for an AirbCar account associated with this email address.</p>'
                button_html = ''
            
            # Simplified HTML email (full version available in original)
            html_content = f'''<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Reset Your Password</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>🚗 AirbCar</h1>
    {message_html}
    {button_html}
    <p>If you did not request this, please ignore this email.</p>
</body>
</html>'''
            
            msg = EmailMultiAlternatives(
                subject, text_content, settings.DEFAULT_FROM_EMAIL, [email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            
            logger.info(f'Password reset email sent to {email}')
            return Response(
                {'message': 'If an account with that email exists, we have sent a password reset link.'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f'Failed to send password reset email: {str(e)}', exc_info=True)
            return Response(
                {'message': 'If an account with that email exists, we have sent a password reset link.'}, 
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            import urllib.parse
            uidb64_decoded = urllib.parse.unquote(uidb64)
            uid_bytes = urlsafe_base64_decode(uidb64_decoded)
            uid = uid_bytes.decode('utf-8')
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist) as e:
            logger.warning(f'Password reset failed: Invalid uid. Error: {str(e)}')
            user = None

        import urllib.parse
        token_decoded = urllib.parse.unquote(token) if '%' in token else token
        
        token_generator = PasswordResetTokenGenerator()
        if user and token_generator.check_token(user, token_decoded):
            user.set_password(serializer.validated_data['password'])
            user.save()
            logger.info(f'Password reset successful for user ID: {user.id}')
            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
        
        logger.warning(f'Password reset failed: Invalid token or user')
        return Response({'error': 'Invalid token or user. The reset link may have expired.'}, status=status.HTTP_400_BAD_REQUEST)


def verify_email(request):
    token = request.GET.get("token")
    if not token:
        return HttpResponse("Invalid token", status=400)

    try:
        user = User.objects.get(email_verification_token=token)
        user.is_verified = True
        user.email_verification_token = None
        user.save()
        return HttpResponse("Email successfully verified!")
    except User.DoesNotExist:
        return HttpResponse("Invalid or expired token", status=400)


class UserVerificationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        token = request.data.get('token')
        if token == user.email_verification_token:
            user.email_verified = True
            user.is_verified = True
            user.email_verification_token = None
            user.save()
            return Response({'message': 'Email verified'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_partner': user.is_partner,
                'is_verified': user.is_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'role': getattr(user, 'role', 'user'),
            }
        return response


class UserStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_partner': user.is_partner,
            'is_verified': user.is_verified,
            'email_verified': user.email_verified,
            'is_staff': user.is_staff,
        })

    def post(self, request):
        """Handle email verification"""
        user = request.user
        token = request.data.get('token')
        if token == user.email_verification_token:
            user.email_verified = True
            user.is_verified = True
            user.email_verification_token = None
            user.save()
            return Response({'message': 'Email verified'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class AdminStatusView(generics.GenericAPIView):
    """Simplified admin check"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'is_admin': request.user.is_staff})


class GoogleOAuthView(APIView):
    """Google OAuth authentication endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response(
                {'error': 'ID token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            import httpx
            from django.conf import settings
            
            # Verify the ID token with Google
            google_verify_url = 'https://oauth2.googleapis.com/tokeninfo'
            params = {'id_token': id_token}
            response = httpx.get(google_verify_url, params=params, timeout=10.0)
            
            if response.status_code != 200:
                return Response(
                    {'error': 'Invalid ID token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token_data = response.json()
            email = token_data.get('email', '').lower()
            first_name = token_data.get('given_name', '')
            last_name = token_data.get('family_name', '')
            picture = token_data.get('picture', '')
            email_verified = token_data.get('email_verified', False)
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                if not user.first_name and first_name:
                    user.first_name = first_name
                if not user.last_name and last_name:
                    user.last_name = last_name
                if not user.profile_picture and picture:
                    user.profile_picture = picture
                if email_verified:
                    user.is_verified = True
                user.save()
            except User.DoesNotExist:
                # Create new user
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                import secrets
                random_password = secrets.token_urlsafe(32)
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=random_password
                )
                if picture:
                    user.profile_picture = picture
                if email_verified:
                    user.is_verified = True
                    user.email_verified = True
                user.save()
                logger.info(f'New user created via Google OAuth: {email}')
            
            # Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Add custom claims
            access_token['email'] = user.email
            access_token['is_partner'] = getattr(user, 'is_partner', False)
            access_token['is_verified'] = getattr(user, 'is_verified', False) or email_verified
            access_token['is_staff'] = user.is_staff
            access_token['is_superuser'] = user.is_superuser
            access_token['role'] = getattr(user, 'role', 'user')
            access_token['first_name'] = user.first_name or first_name
            access_token['last_name'] = user.last_name or last_name
            
            logger.info(f'Google OAuth login successful: {email}')
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name or first_name,
                    'last_name': user.last_name or last_name,
                    'is_partner': getattr(user, 'is_partner', False),
                    'is_verified': getattr(user, 'is_verified', False) or email_verified,
                    'is_staff': user.is_staff,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Google OAuth error: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Authentication failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NewsletterSubscriptionView(APIView):
    """Newsletter subscription endpoint"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response(
            {'message': 'Newsletter subscription endpoint. Use POST to subscribe.'}, 
            status=status.HTTP_200_OK
        )
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response(
                {'error': 'Invalid email format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_exists = User.objects.filter(email=email).exists()
            logger.info(f'Newsletter subscription: {email} (user exists: {user_exists})')
            
            # Send welcome email
            try:
                from django.conf import settings
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                
                subject = 'Welcome to Airbcar Newsletter!'
                text_message = f"""Hello!

Thank you for subscribing to the Airbcar newsletter!

You'll now receive updates about:
- Latest car rental deals and promotions
- New vehicles added to our fleet
- Special offers and discounts
- Travel tips and destination guides

We're excited to have you on board!

Best regards,
The Airbcar Team"""
                
                html_message = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>🚗 Welcome to Airbcar!</h1>
    <p>Thank you for subscribing to the <strong>Airbcar newsletter</strong>!</p>
    <p>You'll now receive updates about latest deals, new vehicles, and special offers.</p>
    <p><a href="{frontend_url}" style="background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Explore Our Cars</a></p>
</body>
</html>"""
                
                from_email = settings.DEFAULT_FROM_EMAIL
                msg = EmailMultiAlternatives(subject, text_message, from_email, [email])
                msg.attach_alternative(html_message, "text/html")
                msg.send()
                
                logger.info(f'Newsletter welcome email sent to: {email}')
            except Exception as email_error:
                logger.error(f'Failed to send newsletter email: {str(email_error)}', exc_info=True)
            
            return Response(
                {'message': 'Successfully subscribed to newsletter!'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f'Newsletter subscription error: {str(e)}', exc_info=True)
            return Response(
                {'message': 'Successfully subscribed to newsletter!'}, 
                status=status.HTTP_200_OK
            )


def home_view(request):
    """Home view for API documentation"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Airbcar Backend API</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 2rem; background-color: #f9f9f9; color: #333; }
            h1 { color: #1e88e5; border-bottom: 2px solid #1e88e5; padding-bottom: 0.3rem; }
            .container { max-width: 900px; margin: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚗 Airbcar Backend API</h1>
            <p><strong>Base URL:</strong> <code>http://localhost:8000/</code></p>
            <p>API endpoints are available at <code>/api/</code></p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)
