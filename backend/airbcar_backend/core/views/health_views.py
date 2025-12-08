"""
Health check and root API views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.conf import settings
import os

from ..models import User


class RootView(APIView):
    """Root API endpoint - provides API information."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'AirbCar Backend API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health/',
                'auth': {
                    'login': '/api/login/',
                    'register': '/api/register/',
                    'token_refresh': '/api/token/refresh/',
                },
                'listings': '/listings/',
                'partners': '/partners/',
                'bookings': '/bookings/',
            },
            'docs': 'See API documentation for more details'
        })


class HealthCheckView(APIView):
    """Simple health check endpoint to test CORS and server status."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """Health check endpoint - should always return 200 if server is running."""
        try:
            # Try a simple database query to check DB connectivity
            try:
                # Just check if we can query the database (count users, but don't fail if DB is slow)
                User.objects.exists()
                db_status = 'connected'
            except Exception as db_error:
                # Database might be slow or unavailable, but server is still running
                db_status = 'slow_or_unavailable'
                if settings.DEBUG:
                    print(f"Health check - DB check failed (non-critical): {db_error}")
            
            return Response({
                'status': 'ok',
                'message': 'Backend is running',
                'cors_enabled': True,
                'database': db_status,
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Even if something goes wrong, return a response (don't crash)
            if settings.DEBUG:
                print(f"Health check error: {e}")
                import traceback
                traceback.print_exc()
            return Response({
                'status': 'error',
                'message': 'Backend is running but encountered an error',
                'cors_enabled': True
            }, status=status.HTTP_200_OK)  # Still return 200 so health checks don't fail
    
    def post(self, request):
        """Test POST endpoint."""
        try:
            return Response({
                'status': 'ok',
                'method': 'POST',
                'data_received': str(request.data) if hasattr(request, 'data') else 'No data',
                'cors_enabled': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            if settings.DEBUG:
                print(f"Health check POST error: {e}")
            return Response({
                'status': 'error',
                'message': 'Backend is running but encountered an error',
                'cors_enabled': True
            }, status=status.HTTP_200_OK)
    
    def options(self, request):
        """Handle OPTIONS preflight request."""
        return Response({}, status=status.HTTP_200_OK)


def serve_media(request, path):
    """
    Serve media files in production.
    This view handles requests to /media/... paths.
    """
    from django.http import FileResponse, Http404
    import mimetypes
    
    # Security: Prevent directory traversal
    if '..' in path or path.startswith('/'):
        raise Http404("Invalid path")
    
    # Construct full file path
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Ensure the file is within MEDIA_ROOT (security check)
    file_path = os.path.normpath(file_path)
    if not file_path.startswith(os.path.normpath(settings.MEDIA_ROOT)):
        raise Http404("Invalid path")
    
    # Check if file exists
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Serve the file
    try:
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type
        )
        # Add headers for better caching and security
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        # Cache for 1 hour
        response['Cache-Control'] = 'public, max-age=3600'
        return response
    except (IOError, OSError):
        raise Http404("File not found")

