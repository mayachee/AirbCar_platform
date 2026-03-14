"""
Custom exception handlers for Django REST Framework.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback
import sys
from django.conf import settings


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides better error messages with standardized format.
    Response format: {
        "error": "Human readable message",
        "code": "MACHINE_READABLE_CODE",
        "status_code": 400,
        "detail": "Only in DEBUG mode",
        "data": {} // Optional error context
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If we get a response from the default handler, customize it
    if response is not None:
        status_code = response.status_code
        
        # Map HTTP status to error codes
        error_code_map = {
            400: 'INVALID_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'PERMISSION_DENIED',
            404: 'NOT_FOUND',
            429: 'RATE_LIMITED',
            500: 'INTERNAL_SERVER_ERROR',
        }
        
        error_code = error_code_map.get(status_code, 'UNKNOWN_ERROR')
        
        custom_response_data = {
            'error': str(response.data.get('detail', 'An error occurred')),
            'code': error_code,
            'status_code': status_code
        }
        
        # Add detailed error message in debug mode
        if settings.DEBUG:
            custom_response_data['detail'] = str(exc)
            custom_response_data['traceback'] = traceback.format_exc()
        
        response.data = custom_response_data
    
    # Handle unhandled exceptions (500 errors)
    else:
        error_msg = str(exc)
        if settings.DEBUG:
            print(f"Unhandled exception: {error_msg}")
            traceback.print_exc(file=sys.stderr)
        
        response = Response(
            {
                'error': error_msg if settings.DEBUG else 'An unexpected error occurred. Please try again later.',
                'code': 'INTERNAL_SERVER_ERROR',
                'status_code': 500,
                'detail': error_msg if settings.DEBUG else None,
                'traceback': traceback.format_exc() if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response

