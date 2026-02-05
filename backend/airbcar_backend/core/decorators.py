"""
Custom decorators for caching and performance optimization.
"""
from functools import wraps
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
import hashlib
import json


def cache_api_response(timeout=300, key_prefix='api'):
    """
    Cache API responses based on request parameters.
    More flexible than Django's cache_page for DRF.
    
    Args:
        timeout: Cache timeout in seconds (default 5 minutes)
        key_prefix: Prefix for cache key
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(view_instance, request, *args, **kwargs):
            # Build cache key from request path + query params + user
            cache_key_parts = [
                key_prefix,
                request.path,
                request.method,
                str(sorted(request.query_params.items())),
                str(getattr(request.user, 'id', 'anonymous'))
            ]
            cache_key_str = '|'.join(cache_key_parts)
            cache_key = hashlib.md5(cache_key_str.encode()).hexdigest()
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Return cached response
                return Response(cached_response)
            
            # Call the actual view
            response = view_func(view_instance, request, *args, **kwargs)
            
            # Cache successful responses only
            if isinstance(response, Response) and 200 <= response.status_code < 300:
                cache.set(cache_key, response.data, timeout)
            
            return response
        
        return wrapper
    return decorator


def cache_queryset(timeout=300, key_prefix='qs'):
    """
    Cache queryset results for class-based views.
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
    """
    def decorator(method):
        @wraps(method)
        def wrapper(view_instance, *args, **kwargs):
            # Build cache key
            cache_key_parts = [
                key_prefix,
                view_instance.__class__.__name__,
                method.__name__,
                str(args),
                str(kwargs)
            ]
            cache_key_str = '|'.join(cache_key_parts)
            cache_key = hashlib.md5(cache_key_str.encode()).hexdigest()
            
            # Try cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute method
            result = method(view_instance, *args, **kwargs)
            
            # Cache the result
            cache.set(cache_key, result, timeout)
            
            return result
        
        return wrapper
    return decorator
