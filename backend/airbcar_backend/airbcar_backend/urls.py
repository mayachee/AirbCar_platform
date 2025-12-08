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
    
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

