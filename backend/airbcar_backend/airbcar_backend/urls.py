"""
URL configuration for airbcar_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def favicon_view(request):
    """Handle favicon requests to avoid 400 errors."""
    return HttpResponse(status=204)  # No Content

urlpatterns = [
    path('admin/', admin.site.urls),
    path('favicon.ico', favicon_view, name='favicon'),  # Handle favicon requests
    path('', include('core.urls')),  # Include core app URLs
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

