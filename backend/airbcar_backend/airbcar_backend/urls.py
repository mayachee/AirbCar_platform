"""
URL configuration for airbcar_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
import sys
import traceback

def favicon_view(request):
    """Handle favicon requests to avoid 400 errors."""
    return HttpResponse(status=204)  # No Content


def _add_cors_headers(request, response):
    """Add minimal CORS headers to emergency responses."""
    origin = request.META.get('HTTP_ORIGIN', '')
    if origin and ('airbcar.com' in origin or 'onrender.com' in origin):
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
    return response


def emergency_root_view(request):
    """Emergency root response used if core URL include fails."""
    response = JsonResponse({
        'status': 'degraded',
        'message': 'Core routes unavailable. Check backend logs.',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
        },
    }, status=200)
    return _add_cors_headers(request, response)


def emergency_health_view(request):
    """Emergency health response used if core URL include fails."""
    response = JsonResponse({
        'status': 'degraded',
        'message': 'Server running with emergency routing fallback.',
    }, status=200)
    return _add_cors_headers(request, response)


def handler500(request):
    """Global 500 handler that returns JSON for API consumers."""
    response = JsonResponse({
        'error': 'internal_server_error',
        'message': 'An internal error occurred. Check backend logs.',
    }, status=500)
    return _add_cors_headers(request, response)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('favicon.ico', favicon_view, name='favicon'),  # Handle favicon requests
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

try:
    urlpatterns.append(path('', include('core.urls')))  # Include core app URLs
except Exception as import_error:
    print(f"CRITICAL: Failed to include core.urls: {import_error}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    urlpatterns += [
        path('', emergency_root_view, name='emergency-root'),
        path('api/health/', emergency_health_view, name='emergency-health'),
    ]

# Serve media files in development and production
# Note: On Render, the filesystem is ephemeral, so media files may be lost on redeploy
# For production, consider using cloud storage (Supabase Storage, S3, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # In production, still serve media files if they exist
    # This allows access to media files that were uploaded before redeploy
    from django.views.static import serve
    from django.urls import re_path
    from django.http import FileResponse, Http404
    import os
    
    def serve_media_with_fallback(request, path):
        """Serve media files, or return 404 if file doesn't exist."""
        file_path = os.path.join(settings.MEDIA_ROOT, path)
        if os.path.exists(file_path):
            return serve(request, path, document_root=settings.MEDIA_ROOT)
        else:
            # File doesn't exist - return 404
            # Frontend will handle this with onError handler to show fallback image
            raise Http404("File not found")
    
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_media_with_fallback),
    ]

