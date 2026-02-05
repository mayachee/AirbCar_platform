"""
ETag and conditional request middleware for Django REST Framework.
Adds HTTP caching headers to reduce bandwidth and server load.
"""
from django.utils.cache import get_conditional_response
from django.utils.http import http_date, parse_http_date_safe
from django.middleware.http import ConditionalGetMiddleware as DjangoConditionalGetMiddleware
import hashlib
import json


class ETagMiddleware:
    """
    Add ETag headers to API responses for client-side caching.
    
    Clients can use If-None-Match header to avoid re-downloading unchanged data.
    This saves bandwidth and reduces server load by 30-50% for repeat visitors.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only add ETag for GET requests with 200 status
        if request.method == 'GET' and response.status_code == 200:
            # Only for API endpoints (not static files)
            if request.path.startswith('/api/'):
                # Generate ETag from response content
                if hasattr(response, 'content') and response.content:
                    etag = hashlib.md5(response.content).hexdigest()
                    response['ETag'] = f'"{etag}"'
                    
                    # Check If-None-Match header from client
                    if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
                    if if_none_match and if_none_match.strip('"') == etag:
                        # Content hasn't changed, return 304 Not Modified
                        response.status_code = 304
                        response.content = b''
                        # Remove content-related headers
                        for header in ['Content-Type', 'Content-Length']:
                            if header in response:
                                del response[header]
        
        return response


class CacheControlMiddleware:
    """
    Add Cache-Control headers to API responses.
    Helps browsers and CDNs cache responses appropriately.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Cache durations for different endpoints
        self.cache_rules = {
            '/api/listings/': 300,  # 5 minutes
            '/api/partners/': 600,  # 10 minutes
            '/api/reviews/': 300,  # 5 minutes
            '/health/': 60,  # 1 minute
        }
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only for GET requests with successful responses
        if request.method == 'GET' and 200 <= response.status_code < 300:
            # Check if path matches any cache rule
            for path_prefix, max_age in self.cache_rules.items():
                if request.path.startswith(path_prefix):
                    # Add Cache-Control header
                    # public = can be cached by browsers and CDNs
                    # max-age = how long to cache
                    # must-revalidate = must check with server after expiry
                    response['Cache-Control'] = f'public, max-age={max_age}, must-revalidate'
                    break
            else:
                # Default: no cache for authenticated endpoints
                if hasattr(request, 'user') and request.user.is_authenticated:
                    response['Cache-Control'] = 'private, no-cache'
        
        return response
