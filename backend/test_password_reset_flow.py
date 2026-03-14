#!/usr/bin/env python
"""
Comprehensive test script for password reset flow.
Tests all password reset functionality end-to-end.
"""

import os
import sys
import json
import django
import requests
from datetime import timedelta

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from core.models import PasswordReset

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(msg):
    print(f"\n{BLUE}{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ {msg}{RESET}")

def test_email_config():
    """Test email backend configuration."""
    print_header("Testing Email Configuration")
    
    resend_key = os.environ.get('RESEND_API_KEY', '')
    smtp_user = os.environ.get('EMAIL_HOST_USER', '')
    
    if resend_key:
        print_success(f"Resend API Key configured: {resend_key[:10]}...")
    else:
        print_info("Resend API Key not configured")
    
    if smtp_user:
        print_success(f"SMTP User configured: {smtp_user}")
    else:
        print_info("SMTP User not configured")
    
    print_info(f"Email Backend: {settings.EMAIL_BACKEND}")
    print_info(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    print_info(f"Frontend URL: {settings.FRONTEND_URL}")

def test_password_reset_model():
    """Test PasswordReset model functionality."""
    print_header("Testing PasswordReset Model")
    
    # Clean up test data
    PasswordReset.objects.filter(user__username='test_reset_user').delete()
    User.objects.filter(username='test_reset_user').delete()
    
    # Create test user
    user = User.objects.create_user(
        username='test_reset_user',
        email='test_reset@example.com',
        password='original_password_123'
    )
    print_success(f"Created test user: {user.email}")
    
    # Test token generation
    token = PasswordReset.generate_token()
    print_success(f"Generated token: {token[:20]}...")
    
    # Test PasswordReset creation
    reset_record = PasswordReset.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=24)
    )
    print_success(f"Created PasswordReset record: {reset_record.id}")
    
    # Test is_valid() method
    if reset_record.is_valid():
        print_success("Token is valid (not expired)")
    else:
        print_error("Token validation failed")
    
    # Test expired token
    expired_record = PasswordReset.objects.create(
        user=user,
        token=PasswordReset.generate_token(),
        expires_at=timezone.now() - timedelta(hours=1)  # Already expired
    )
    if not expired_record.is_valid():
        print_success("Expired token correctly identified as invalid")
    else:
        print_error("Expired token not detected")
    
    # Test used token
    used_record = PasswordReset.objects.create(
        user=user,
        token=PasswordReset.generate_token(),
        expires_at=timezone.now() + timedelta(hours=24),
        is_used=True
    )
    if not used_record.is_valid():
        print_success("Used token correctly identified as invalid")
    else:
        print_error("Used token not detected")
    
    return user, token

def test_api_endpoints(user_email, test_token):
    """Test API endpoints."""
    print_header("Testing API Endpoints")
    
    base_url = "http://localhost:8000"
    
    # Test 1: Request password reset
    print_info("Testing POST /api/password-reset/ (request reset)")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/",
            json={"email": user_email},
            timeout=10
        )
        print_success(f"Response status: {response.status_code}")
        if response.status_code == 200:
            print_success("Password reset request succeeded")
            print_info(f"Response: {response.json()}")
        else:
            print_error(f"Unexpected status: {response.json()}")
    except Exception as e:
        print_error(f"Failed to connect to API: {e}")
        return
    
    # Test 2: Validate token
    print_info("\nTesting GET /api/password-reset/confirm/?token=... (validate token)")
    try:
        response = requests.get(
            f"{base_url}/api/password-reset/confirm/?token={test_token}",
            timeout=10
        )
        print_success(f"Response status: {response.status_code}")
        data = response.json()
        if data.get('valid'):
            print_success("Token validation succeeded")
        else:
            print_error(f"Token validation failed: {data}")
    except Exception as e:
        print_error(f"Failed to connect to API: {e}")
        return
    
    # Test 3: Reset password
    print_info("\nTesting POST /api/password-reset/confirm/ (reset password)")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/confirm/",
            json={
                "token": test_token,
                "new_password": "new_password_456"
            },
            timeout=10
        )
        print_success(f"Response status: {response.status_code}")
        data = response.json()
        if response.status_code == 200 and data.get('reset'):
            print_success("Password reset succeeded")
        else:
            print_error(f"Password reset failed: {data}")
    except Exception as e:
        print_error(f"Failed to connect to API: {e}")

def test_error_cases():
    """Test error handling."""
    print_header("Testing Error Cases")
    
    base_url = "http://localhost:8000"
    
    # Test 1: Invalid token
    print_info("Test 1: Invalid token")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/confirm/",
            json={
                "token": "invalid_token_xyz",
                "new_password": "new_password_456"
            },
            timeout=10
        )
        if response.status_code == 400:
            print_success("Correctly rejected invalid token")
        else:
            print_error(f"Expected 400, got {response.status_code}")
    except Exception as e:
        print_error(f"Connection error: {e}")
    
    # Test 2: Missing token
    print_info("\nTest 2: Missing token")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/confirm/",
            json={
                "new_password": "new_password_456"
            },
            timeout=10
        )
        if response.status_code == 400:
            print_success("Correctly rejected missing token")
        else:
            print_error(f"Expected 400, got {response.status_code}")
    except Exception as e:
        print_error(f"Connection error: {e}")
    
    # Test 3: Missing password
    print_info("\nTest 3: Missing password")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/confirm/",
            json={
                "token": "some_token"
            },
            timeout=10
        )
        if response.status_code == 400:
            print_success("Correctly rejected missing password")
        else:
            print_error(f"Expected 400, got {response.status_code}")
    except Exception as e:
        print_error(f"Connection error: {e}")

def main():
    print(f"\n{BLUE}Password Reset Flow Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    # Test email configuration
    test_email_config()
    
    # Test model functionality
    user, token = test_password_reset_model()
    
    # Check if API server is running
    try:
        requests.get("http://localhost:8000/", timeout=2)
        print_info("\nAPI server is running, testing endpoints...")
        
        # Test API endpoints
        test_api_endpoints(user.email, token)
        
        # Test error cases
        test_error_cases()
    except requests.exceptions.ConnectionError:
        print_error("\nAPI server not running. Start with: python manage.py runserver")
    except Exception as e:
        print_error(f"\nError connecting to API: {e}")
    
    print(f"\n{BLUE}{'='*60}")
    print(f"  Test Suite Complete")
    print(f"{'='*60}{RESET}\n")

if __name__ == '__main__':
    main()
