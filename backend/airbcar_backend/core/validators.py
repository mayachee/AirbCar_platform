"""
Input validation utilities for API endpoints.
"""
import re
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response


class ValidationError(Exception):
    """Custom validation error."""
    def __init__(self, message, code='VALIDATION_ERROR', status_code=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


def validate_email(email):
    """Validate email format."""
    if not email:
        raise ValidationError('Email is required')
    
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        raise ValidationError('Invalid email format', code='INVALID_EMAIL')
    
    return email.lower().strip()


def validate_password(password):
    """Validate password strength."""
    if not password:
        raise ValidationError('Password is required')
    
    if len(password) < 8:
        raise ValidationError('Password must be at least 8 characters long', code='WEAK_PASSWORD')
    
    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        raise ValidationError('Password must contain at least one uppercase letter', code='WEAK_PASSWORD')
    
    # Check for at least one digit
    if not re.search(r'\d', password):
        raise ValidationError('Password must contain at least one digit', code='WEAK_PASSWORD')
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError('Password must contain at least one special character', code='WEAK_PASSWORD')
    
    return password


def validate_pagination(page=None, page_size=None, max_page_size=1000):
    """Validate pagination parameters."""
    try:
        page = int(page or 1)
    except (ValueError, TypeError):
        raise ValidationError('Page must be an integer', code='INVALID_PAGINATION')
    
    if page < 1:
        raise ValidationError('Page must be greater than 0', code='INVALID_PAGINATION')
    
    try:
        page_size = int(page_size or 20)
    except (ValueError, TypeError):
        raise ValidationError('Page size must be an integer', code='INVALID_PAGINATION')
    
    if page_size < 1:
        raise ValidationError('Page size must be greater than 0', code='INVALID_PAGINATION')
    
    if page_size > max_page_size:
        page_size = max_page_size
    
    return page, page_size


def validate_date_range(start_date, end_date, date_format='%Y-%m-%d'):
    """Validate date range."""
    try:
        if isinstance(start_date, str):
            start = datetime.strptime(start_date, date_format).date()
        else:
            start = start_date
        
        if isinstance(end_date, str):
            end = datetime.strptime(end_date, date_format).date()
        else:
            end = end_date
    except ValueError:
        msg = 'Invalid date format. Use ' + date_format
        raise ValidationError(msg, code='INVALID_DATE_FORMAT')
    
    if start > end:
        raise ValidationError('Start date must be before end date', code='INVALID_DATE_RANGE')
    
    return start, end


def validate_booking_dates(pickup_date_str, return_date_str):
    """Validate booking dates (must be in future and valid range)."""
    try:
        pickup = datetime.strptime(pickup_date_str, '%Y-%m-%d').date()
        return_d = datetime.strptime(return_date_str, '%Y-%m-%d').date()
    except ValueError:
        raise ValidationError('Invalid date format. Use YYYY-MM-DD', code='INVALID_DATE_FORMAT')
    
    today = timezone.now().date()
    
    if pickup < today:
        raise ValidationError('Pickup date cannot be in the past', code='DATE_IN_PAST')
    
    if return_d <= pickup:
        raise ValidationError('Return date must be after pickup date', code='INVALID_DATE_RANGE')
    
    # Limit to 365 days max booking
    if (return_d - pickup).days > 365:
        raise ValidationError('Booking cannot exceed 365 days', code='BOOKING_TOO_LONG')
    
    return pickup, return_d


def validate_price_range(min_price=None, max_price=None):
    """Validate price range filter."""
    prices = {}
    
    if min_price:
        try:
            min_p = float(min_price)
            if min_p < 0:
                raise ValidationError('Minimum price cannot be negative', code='INVALID_PRICE')
            prices['min'] = min_p
        except ValueError:
            raise ValidationError('Invalid minimum price format', code='INVALID_PRICE')
    
    if max_price:
        try:
            max_p = float(max_price)
            if max_p < 0:
                raise ValidationError('Maximum price cannot be negative', code='INVALID_PRICE')
            prices['max'] = max_p
        except ValueError:
            raise ValidationError('Invalid maximum price format', code='INVALID_PRICE')
    
    if 'min' in prices and 'max' in prices and prices['min'] > prices['max']:
        raise ValidationError('Minimum price cannot be greater than maximum price', code='INVALID_PRICE_RANGE')
    
    return prices


def validate_rating(rating):
    """Validate rating value (0-5)."""
    try:
        r = float(rating)
        if r < 0 or r > 5:
            raise ValueError()
    except (ValueError, TypeError):
        raise ValidationError('Rating must be between 0 and 5', code='INVALID_RATING')
    
    return r


def validate_phone_number(phone_number):
    """Validate phone number format."""
    if not phone_number:
        raise ValidationError('Phone number is required')
    
    # Remove all non-digit characters except leading +
    cleaned = phone_number.strip()
    if cleaned.startswith('+'):
        digits_only = cleaned[1:].replace(' ', '').replace('-', '')
    else:
        digits_only = cleaned.replace(' ', '').replace('-', '')
    
    # Check length (7-15 digits is typical international format)
    if len(digits_only) < 7 or len(digits_only) > 15:
        raise ValidationError('Phone number must be between 7 and 15 digits', code='INVALID_PHONE')
    
    return cleaned


def validate_file_upload(file_obj, allowed_extensions=None, max_size_mb=10):
    """Validate file upload."""
    if not file_obj:
        raise ValidationError('File is required')
    
    if hasattr(file_obj, 'size') and file_obj.size > (max_size_mb * 1024 * 1024):
        msg = 'File size must not exceed ' + str(max_size_mb) + 'MB'
        raise ValidationError(msg, code='FILE_TOO_LARGE')
    
    if allowed_extensions:
        file_extension = file_obj.name.rsplit('.', 1)[-1].lower()
        if file_extension not in allowed_extensions:
            msg = 'File type not allowed. Allowed types: ' + ', '.join(allowed_extensions)
            raise ValidationError(msg, code='INVALID_FILE_TYPE')
    
    return file_obj
