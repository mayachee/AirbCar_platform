"""
Script to split the large views.py file into separate modules.
This script reads views.py and splits it into organized view files.
"""
import re
import os

# Define the mapping of classes to their target files
CLASS_MAPPING = {
    'listing_views.py': ['ListingListView', 'ListingDetailView'],
    'favorite_views.py': ['FavoriteListView', 'MyFavoritesView', 'FavoriteDetailView'],
    'user_views.py': ['UserListView', 'ChangePasswordView', 'UserMeView', 'UserStatsView', 'UserDetailView'],
    'review_views.py': ['ReviewListView', 'CanReviewView'],
    'booking_views.py': [
        'BookingListView', 'BookingPendingRequestsView', 'BookingUpcomingView',
        'BookingCancelView', 'BookingAcceptView', 'BookingRejectView',
        'BookingDetailView', 'PartnerCustomerInfoView'
    ],
    'partner_views.py': [
        'PartnerListView', 'PartnerMeView', 'PartnerDetailView',
        'PartnerEarningsView', 'PartnerAnalyticsView', 'PartnerReviewsView', 'PartnerActivityView'
    ],
    'auth_views.py': [
        'LoginView', 'RegisterView', 'RefreshTokenView', 'VerifyTokenView',
        'VerifyEmailView', 'ResendVerificationEmailView',
        'PasswordResetRequestView', 'PasswordResetConfirmView', 'GoogleAuthView'
    ],
    'health_views.py': ['RootView', 'HealthCheckView']  # Already exists, but we'll update it
}

# Common imports that all view files need
COMMON_IMPORTS = """\"\"\"
API views for core app - using database models.
\"\"\"
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import traceback
import json
import os
from pathlib import Path

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer, PartnerSerializer
)

"""

def find_class_boundaries(content, class_name):
    """Find the start and end line numbers for a class definition."""
    pattern = rf'^class {class_name}\(.*?\):'
    match = re.search(pattern, content, re.MULTILINE)
    if not match:
        return None, None
    
    start_line = content[:match.start()].count('\n')
    
    # Find the end of the class by looking for the next class definition or end of file
    remaining = content[match.start():]
    next_class_match = re.search(r'^class \w+\(', remaining[1:], re.MULTILINE)
    if next_class_match:
        end_pos = match.start() + next_class_match.start() + 1
    else:
        end_pos = len(content)
    
    end_line = content[:end_pos].count('\n')
    return start_line, end_line

def extract_class_code(content, start_line, end_line):
    """Extract code for a class from the content."""
    lines = content.split('\n')
    return '\n'.join(lines[start_line:end_line])

def split_views_file():
    """Split the views.py file into separate modules."""
    views_dir = os.path.join(os.path.dirname(__file__), 'views')
    views_file = os.path.join(os.path.dirname(__file__), 'views.py')
    
    # Read the original views.py
    with open(views_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process each target file
    for filename, class_names in CLASS_MAPPING.items():
        filepath = os.path.join(views_dir, filename)
        
        # Collect all classes for this file
        classes_code = []
        for class_name in class_names:
            start, end = find_class_boundaries(content, class_name)
            if start is not None:
                class_code = extract_class_code(content, start, end)
                classes_code.append(class_code)
        
        if classes_code:
            # Write the file with imports and classes
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(COMMON_IMPORTS)
                f.write('\n\n')
                f.write('\n\n\n'.join(classes_code))
                f.write('\n')
            
            print(f"Created {filename} with {len(classes_code)} classes")
    
    # Also extract serve_media function for health_views.py
    serve_media_match = re.search(r'^def serve_media\(.*?\):.*?(?=^def |^class |\Z)', content, re.MULTILINE | re.DOTALL)
    if serve_media_match:
        health_views_path = os.path.join(views_dir, 'health_views.py')
        with open(health_views_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()
        
        if 'def serve_media' not in existing_content:
            with open(health_views_path, 'a', encoding='utf-8') as f:
                f.write('\n\n')
                f.write(serve_media_match.group(0))
            print("Added serve_media to health_views.py")

if __name__ == '__main__':
    split_views_file()
    print("Done splitting views.py!")
