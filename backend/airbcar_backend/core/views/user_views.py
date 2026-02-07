"""
User-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum, Count
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
import traceback

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)


class UserListView(APIView):
    """List all users."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List all users (admin only)."""
        # Only admins can list all users
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            users = User.objects.all()
            
            # Filter by role if provided
            role_filter = request.query_params.get('role')
            if role_filter:
                users = users.filter(role=role_filter)
            
            # Search by name or email
            search = request.query_params.get('search')
            if search:
                users = users.filter(
                    Q(username__icontains=search) |
                    Q(email__icontains=search) |
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            
            # Order by
            order_by = request.query_params.get('order_by', '-date_joined')
            if order_by in ['date_joined', '-date_joined', 'username', '-username', 'email', '-email']:
                users = users.order_by(order_by)
            else:
                users = users.order_by('-date_joined')
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 1000)
            
            total_count = users.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            users = users[start:end]
            
            serializer = UserSerializer(users, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserListView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserMeView(APIView):
    """Get current user's profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user profile."""
        try:
            serializer = UserSerializer(request.user, context={'request': request})
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserMeView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request):
        """Update current user profile (partial)."""
        return self._update(request, partial=True)

    def put(self, request):
        """Update current user profile."""
        return self._update(request, partial=False)

    def _update(self, request, partial=True):
        """Helper to handle profile updates."""
        try:
            # Prepare user data - create clean copy without file objects
            user_data = {}
            for key, value in request.data.items():
                if hasattr(value, 'read') or hasattr(value, 'chunks'):
                    continue
                user_data[key] = value
            
            serializer = UserSerializer(
                request.user,
                data=user_data,
                partial=partial,
                context={'request': request}
            )
            
            if serializer.is_valid():
                try:
                    with transaction.atomic():
                        serializer.save()
                        # Refresh from database
                        request.user.refresh_from_db()
                        
                        if settings.DEBUG:
                            print(f"✅ User profile updated successfully")
                        
                        return Response({
                            'data': UserSerializer(request.user, context={'request': request}).data,
                            'message': 'Profile updated successfully'
                        }, status=status.HTTP_200_OK)
                except ValueError as ve:
                    # Provide specific error details
                    error_msg = str(ve)
                    if settings.DEBUG:
                        print(f"❌ User update error: {error_msg}")
                    return Response({
                        'error': error_msg,
                        'message': error_msg
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserMeView.update: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStatsView(APIView):
    """Get user statistics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user statistics."""
        try:
            user = request.user
            
            # Get booking stats
            bookings = Booking.objects.filter(customer=user)
            total_bookings = bookings.count()
            pending_bookings = bookings.filter(status='pending').count()
            confirmed_bookings = bookings.filter(status='confirmed').count()
            active_bookings = bookings.filter(status='active').count()
            completed_bookings = bookings.filter(status='completed').count()
            cancelled_bookings = bookings.filter(status='cancelled').count()
            
            # Get favorite count
            favorite_count = Favorite.objects.filter(user=user).count()
            
            # Get review count
            review_count = Review.objects.filter(user=user, is_published=True).count()
            
            # Get total spent
            total_spent = bookings.filter(
                status='completed',
                payment_status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            return Response({
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'confirmed': confirmed_bookings,
                    'active': active_bookings,
                    'completed': completed_bookings,
                    'cancelled': cancelled_bookings
                },
                'favorite_count': favorite_count,
                'review_count': review_count,
                'total_spent': float(total_spent)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserStatsView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Change user password."""
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Both old_password and new_password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.check_password(old_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'New password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            request.user.set_password(new_password)
            request.user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in ChangePasswordView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserDetailView(APIView):
    """Get user detail by ID."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get user detail by ID."""
        try:
            # Users can view their own profile, admins can view any
            if pk == request.user.id or request.user.role == 'admin' or request.user.is_superuser:
                user = User.objects.get(pk=pk)
                serializer = UserSerializer(user, context={'request': request})
                return Response({
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
                
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserDetailView: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserDocumentUploadView(APIView):
    """Upload user documents (license, etc)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload license front or back document."""
        try:
            if 'document' not in request.FILES:
                return Response({
                    'error': 'Missing document file',
                    'message': 'Please provide a document file'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            document = request.FILES['document']
            doc_type = request.data.get('type', 'license_front')  # license_front or license_back
            
            # Validate file type and size
            MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
            if document.size > MAX_FILE_SIZE:
                return Response({
                    'error': 'File too large',
                    'message': 'Maximum file size is 5MB'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Allowed MIME types
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if document.content_type not in allowed_types:
                return Response({
                    'error': 'Invalid file type',
                    'message': 'Only JPEG, PNG, and PDF files are allowed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update user document
            if doc_type == 'license_front':
                request.user.license_front_document = document
            elif doc_type == 'license_back':
                request.user.license_back_document = document
            else:
                return Response({
                    'error': 'Invalid document type',
                    'message': 'Type must be license_front or license_back'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            request.user.save()
            
            serializer = UserSerializer(request.user, context={'request': request})
            return Response({
                'message': 'Document uploaded successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in UserDocumentUploadView: {error_msg}")
                import traceback
                traceback.print_exc()
            return Response({
                'error': 'Upload failed',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)