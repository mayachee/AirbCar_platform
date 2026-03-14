#!/usr/bin/env python
"""
Test script for email verification in password reset flow.
Tests all email verification functionality end-to-end.
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
from core.models import PasswordReset, EmailVerification

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

def test_email_verification_model():
    """Test EmailVerification model functionality."""
    print_header("Testing EmailVerification Model")
    
    # Clean up test data
    EmailVerification.objects.filter(user__username='test_email_verify_user').delete()
    User.objects.filter(username='test_email_verify_user').delete()
    
    # Create test user
    user = User.objects.create_user(
        username='test_email_verify_user',
        email='verify_test@example.com',
        password='password_123'
    )
    print_success(f"Created test user: {user.email}")
    
    # Test code generation
    code = EmailVerification.generate_token()
    print_success(f"Generated verification code: {code}")
    
    # Test EmailVerification creation
    verification = EmailVerification.objects.create(
        user=user,
        token=code,
        expires_at=timezone.now() + timedelta(minutes=15)
    )
    print_success(f"Created EmailVerification record: {verification.id}")
    
    # Test is_valid() for fresh code
    if verification.is_valid():
        print_success("Fresh verification code is valid")
    else:
        print_error("Fresh verification code shows as invalid")
    
    # Test expired code
    expired_code = EmailVerification.generate_token()
    expired_verification = EmailVerification.objects.create(
        user=user,
        token=expired_code,
        expires_at=timezone.now() - timedelta(minutes=1)
    )
    if not expired_verification.is_valid():
        print_success("Expired verification code correctly identified as invalid")
    else:
        print_error("Expired code not detected")
    
    # Test used code
    used_code = EmailVerification.generate_token()
    used_verification = EmailVerification.objects.create(
        user=user,
        token=used_code,
        expires_at=timezone.now() + timedelta(minutes=15),
        is_used=True
    )
    if not used_verification.is_valid():
        print_success("Used verification code correctly identified as invalid")
    else:
        print_error("Used code not detected")
    
    return user, code

def test_send_password_reset_with_verification(user):
    """Test sending password reset email with verification."""
    print_header("Testing Password Reset with Verification Email")
    
    from core.utils import send_password_reset_email
    
    # Clean up old records
    PasswordReset.objects.filter(user=user).delete()
    EmailVerification.objects.filter(user=user, is_used=False).delete()
    
    # Send password reset email
    try:
        password_reset, verification = send_password_reset_email(user)
        
        if password_reset and verification:
            print_success(f"Password reset record created: {password_reset.id}")
            print_success(f"Verification code created: {verification.token}")
            print_info(f"Verification expires at: {verification.expires_at}")
            print_info(f"Password reset token: {password_reset.token[:20]}...")
            return password_reset, verification
        else:
            print_error("Failed to create password reset or verification records")
            return None, None
    except Exception as e:
        print_error(f"Error sending password reset: {e}")
        return None, None

def test_api_email_verification():
    """Test API endpoints for email verification."""
    print_header("Testing Email Verification API Endpoints")
    
    base_url = "http://localhost:8000"
    
    # Create test user and send reset
    EmailVerification.objects.filter(user__username='api_test_user').delete()
    PasswordReset.objects.filter(user__username='api_test_user').delete()
    User.objects.filter(username='api_test_user').delete()
    
    test_user = User.objects.create_user(
        username='api_test_user',
        email='api_test@example.com',
        password='password_123'
    )
    
    password_reset, verification = send_password_reset_email(test_user)
    
    if not password_reset or not verification:
        print_error("Could not create test data")
        return
    
    # Test 1: Request password reset (API)
    print_info("\nTest 1: POST /api/password-reset/ (request reset)")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/",
            json={"email": test_user.email},
            timeout=10
        )
        print_success(f"Response status: {response.status_code}")
        data = response.json()
        if data.get('requires_verification'):
            print_success("Response indicates email verification required")
        else:
            print_info("requires_verification field: " + str(data.get('requires_verification')))
    except Exception as e:
        print_error(f"Failed to connect to API: {e}")
        return
    
    # Test 2: Verify email code
    print_info("\nTest 2: POST /api/password-reset/verify-email/ (verify code)")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/verify-email/",
            json={
                "email": test_user.email,
                "code": verification.token
            },
            timeout=10
        )
        print_success(f"Response status: {response.status_code}")
        data = response.json()
        if response.status_code == 200:
            if data.get('verified'):
                print_success("Email verification succeeded")
                if data.get('reset_token'):
                    print_success(f"Reset token received: {data['reset_token'][:20]}...")
                else:
                    print_error("Reset token not in response")
            else:
                print_error(f"Verification failed: {data}")
        else:
            print_error(f"Unexpected status: {data}")
    except Exception as e:
        print_error(f"Failed to verify email: {e}")
        return
    
    # Test 3: Verify with wrong code
    print_info("\nTest 3: Wrong verification code (should fail)")
    try:
        response = requests.post(
            f"{base_url}/api/password-reset/verify-email/",
            json={
                "email": test_user.email,
                "code": "wrongcode"
            },
            timeout=10
        )
        if response.status_code == 400:
            print_success("Correctly rejected invalid code (400 error)")
        else:
            print_error(f"Expected 400, got {response.status_code}")
    except Exception as e:
        print_error(f"Connection error: {e}")

def test_code_reuse_prevention():
    """Test that verification codes can't be reused."""
    print_header("Testing Code Reuse Prevention")
    
    base_url = "http://localhost:8000"
    
    # Create test user
    EmailVerification.objects.filter(user__username='reuse_test').delete()
    PasswordReset.objects.filter(user__username='reuse_test').delete()
    User.objects.filter(username='reuse_test').delete()
    
    test_user = User.objects.create_user(
        username='reuse_test',
        email='reuse@example.com',
        password='password_123'
    )
    
    password_reset, verification = send_password_reset_email(test_user)
    
    try:
        # First use should work
        response1 = requests.post(
            f"{base_url}/api/password-reset/verify-email/",
            json={"email": test_user.email, "code": verification.token},
            timeout=10
        )
        
        if response1.status_code == 200:
            print_success("First verification succeeded")
        else:
            print_error(f"First verification failed: {response1.status_code}")
            return
        
        # Second use should fail
        response2 = requests.post(
            f"{base_url}/api/password-reset/verify-email/",
            json={"email": test_user.email, "code": verification.token},
            timeout=10
        )
        
        if response2.status_code == 400:
            print_success("Correctly rejected reused code (code marked as used)")
            print_info(f"Error: {response2.json().get('error')}")
        else:
            print_error(f"Expected 400 for reused code, got {response2.status_code}")
    except Exception as e:
        print_error(f"Error testing code reuse: {e}")

def test_code_expiry():
    """Test that verification codes expire."""
    print_header("Testing Code Expiry")
    
    # Create test user with manually expired code
    EmailVerification.objects.filter(user__username='expiry_test').delete()
    User.objects.filter(username='expiry_test').delete()
    
    test_user = User.objects.create_user(
        username='expiry_test',
        email='expiry@example.com'
    )
    
    # Create expired code (already expired)
    expired_code = EmailVerification.generate_token()
    verification = EmailVerification.objects.create(
        user=test_user,
        token=expired_code,
        expires_at=timezone.now() - timedelta(minutes=1)
    )
    
    if not verification.is_valid():
        print_success("Expired code correctly marked as invalid")
    else:
        print_error("Expired code not detected")

def main():
    print(f"\n{BLUE}Email Verification for Password Reset - Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    # Test models
    user, code = test_email_verification_model()
    
    # Test email sending
    test_send_password_reset_with_verification(user)
    
    # Test expiry
    test_code_expiry()
    
    # Test code reuse prevention
    test_code_reuse_prevention()
    
    # Check if API server is running
    try:
        requests.get("http://localhost:8000/", timeout=2)
        print_info("\nAPI server is running, testing endpoints...")
        
        # Test API endpoints
        test_api_email_verification()
    except requests.exceptions.ConnectionError:
        print_error("\nAPI server not running. Start with: python manage.py runserver")
    except Exception as e:
        print_error(f"\nError connecting to API: {e}")
    
    print(f"\n{BLUE}{'='*60}")
    print(f"  Test Suite Complete")
    print(f"{'='*60}{RESET}\n")

if __name__ == '__main__':
    main()
