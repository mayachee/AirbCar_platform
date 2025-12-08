#!/usr/bin/env python3
"""
Script to split views.py into multiple organized files.
This script extracts classes and functions from views.py and organizes them into separate files.
"""
import re
import os

# Read the original views.py file
with open('views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Common imports that all view files will need
common_imports = '''"""
API views for core app - using database models.
"""
from rest_framework import status
from rest_framework.decorators import api_view
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

'''

# Function to extract a class definition
def extract_class(content, class_name):
    """Extract a class definition from content."""
    # Pattern to match class definition and everything until next class or end of file
    pattern = rf'^class {class_name}\(.*?)(?=^class |^def serve_media|\Z)'
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    if match:
        class_def = match.group(0)
        # Fix imports - change from .supabase_storage to ..supabase_storage
        class_def = re.sub(r'from \.supabase_storage', r'from ...supabase_storage', class_def)
        class_def = re.sub(r'from \.utils', r'from ...utils', class_def)
        class_def = re.sub(r'from \.models', r'from ...models', class_def)
        class_def = re.sub(r'from \.serializers', r'from ...serializers', class_def)
        return class_def
    return None

# Function to extract serve_media function
def extract_serve_media(content):
    """Extract the serve_media function."""
    pattern = r'^def serve_media\(.*?)(?=^def |^class |\Z)'
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    if match:
        func_def = match.group(0)
        # Fix imports
        func_def = re.sub(r'from \.', r'from ..', func_def)
        return func_def
    return None

# Create views directory
os.makedirs('views', exist_ok=True)

# Define the splits - class name to file mapping
splits = {
    'listing_views.py': ['ListingListView', 'ListingDetailView'],
    'booking_views.py': ['BookingListView', 'BookingPendingRequestsView', 'BookingUpcomingView', 
                         'BookingCancelView', 'BookingAcceptView', 'BookingRejectView',
                         'BookingDetailView', 'PartnerCustomerInfoView'],
    'user_views.py': ['UserListView', 'UserMeView', 'UserStatsView', 'ChangePasswordView', 'UserDetailView'],
    'favorite_views.py': ['FavoriteListView', 'MyFavoritesView', 'FavoriteDetailView'],
    'partner_views.py': ['PartnerListView', 'PartnerMeView', 'PartnerDetailView',
                         'PartnerEarningsView', 'PartnerAnalyticsView', 'PartnerReviewsView', 'PartnerActivityView'],
    'review_views.py': ['ReviewListView', 'CanReviewView'],
    'auth_views.py': ['LoginView', 'RegisterView', 'RefreshTokenView', 'VerifyTokenView',
                      'VerifyEmailView', 'ResendVerificationEmailView',
                      'PasswordResetRequestView', 'PasswordResetConfirmView', 'GoogleAuthView'],
    'health_views.py': ['RootView', 'HealthCheckView'],
}

# Process each split
for filename, class_names in splits.items():
    file_content = common_imports + '\n'
    
    for class_name in class_names:
        class_def = extract_class(content, class_name)
        if class_def:
            file_content += class_def + '\n\n'
        else:
            print(f"Warning: Could not find {class_name}")
    
    # Special handling for health_views.py - add serve_media
    if filename == 'health_views.py':
        serve_media_def = extract_serve_media(content)
        if serve_media_def:
            file_content += serve_media_def
    
    # Write the file
    with open(f'views/{filename}', 'w', encoding='utf-8') as f:
        f.write(file_content)
    
    print(f"Created views/{filename}")

print("\nDone! All view files have been created in the views/ directory.")
print("Next steps:")
print("1. Verify the imports are correct (especially relative imports)")
print("2. Test that the application still works")
print("3. Delete the original views.py file once everything is confirmed working")

