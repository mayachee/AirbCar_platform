"""
Custom middleware to ensure CORS headers are always added, even on errors.
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.http import JsonResponse


class EnsureCorsHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to ensure CORS headers are always present, even on error responses.
    This is a fallback in case the corsheaders middleware doesn't add headers on errors.
    """
    
    def process_response(self, request, response):
        """Add CORS headers to response, handling errors gracefully."""
        try:
            # Get the origin from the request
            origin = request.META.get('HTTP_ORIGIN', '')
            
            # Always add CORS headers if CORS_ALLOW_ALL_ORIGINS is True (for development)
            # This ensures headers are added even on error responses
            if getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False):
                # If origin is provided, use it; otherwise use *
                if origin:
                    response['Access-Control-Allow-Origin'] = origin
                else:
                    response['Access-Control-Allow-Origin'] = '*'
                
                # Add other CORS headers
                if getattr(settings, 'CORS_ALLOW_CREDENTIALS', False):
                    response['Access-Control-Allow-Credentials'] = 'true'
                
                # Add allowed methods
                allowed_methods = getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
                if isinstance(allowed_methods, list):
                    response['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
                
                # Add allowed headers
                allowed_headers = getattr(settings, 'CORS_ALLOW_HEADERS', ['content-type', 'authorization', 'x-requested-with'])
                if isinstance(allowed_headers, list):
                    response['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
            
            # If CORS headers are not already present, try to add them based on allowed origins
            elif 'Access-Control-Allow-Origin' not in response:
                # Check if origin is in allowed origins list
                allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
                if origin and (origin in allowed_origins or any(origin.startswith(allowed) for allowed in allowed_origins if '*' in allowed)):
                    response['Access-Control-Allow-Origin'] = origin
                    if getattr(settings, 'CORS_ALLOW_CREDENTIALS', False):
                        response['Access-Control-Allow-Credentials'] = 'true'
                # Also check for production domains
                elif origin and ('airbcar.com' in origin or 'www.airbcar.com' in origin):
                    response['Access-Control-Allow-Origin'] = origin
                    if getattr(settings, 'CORS_ALLOW_CREDENTIALS', False):
                        response['Access-Control-Allow-Credentials'] = 'true'
            
            # Handle OPTIONS preflight requests
            if request.method == 'OPTIONS':
                response['Access-Control-Max-Age'] = '86400'  # 24 hours
        except Exception as e:
            # If middleware fails, log but don't break the response
            if settings.DEBUG:
                import traceback
                print(f"⚠️ Middleware error: {str(e)}")
                traceback.print_exc()
        
        return response

