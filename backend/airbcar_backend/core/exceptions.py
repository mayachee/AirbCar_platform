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
    Custom exception handler that provides better error messages.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If we get a response from the default handler, customize it
    if response is not None:
        custom_response_data = {
            'error': 'An error occurred',
            'status_code': response.status_code
        }
        
        # Add detailed error message in debug mode
        if settings.DEBUG:
            custom_response_data['detail'] = str(exc)
            custom_response_data['traceback'] = traceback.format_exc()
        else:
            # In production, provide generic messages
            if response.status_code == 500:
                custom_response_data['error'] = 'Internal server error. Please try again later.'
            elif response.status_code == 400:
                custom_response_data['error'] = 'Bad request. Please check your input.'
            elif response.status_code == 401:
                custom_response_data['error'] = 'Authentication required.'
            elif response.status_code == 403:
                custom_response_data['error'] = 'Permission denied.'
            elif response.status_code == 404:
                custom_response_data['error'] = 'Resource not found.'
        
        response.data = custom_response_data
    
    # Handle unhandled exceptions (500 errors)
    else:
        error_msg = str(exc)
        if settings.DEBUG:
            print(f"Unhandled exception: {error_msg}")
            traceback.print_exc(file=sys.stderr)
        
        response = Response(
            {
                'error': 'Internal server error',
                'message': error_msg if settings.DEBUG else 'An unexpected error occurred. Please try again later.',
                'status_code': 500
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response

