"""
Simple test script for newsletter endpoint
Tests both GET and POST requests
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"
ENDPOINT = "/api/newsletter/subscribe/"

print("=" * 60)
print("Testing Newsletter Subscription Endpoint")
print("=" * 60)
print(f"URL: {BASE_URL}{ENDPOINT}")
print()

# Test 1: GET request (should work now that we added GET handler)
print("Test 1: GET request")
try:
    response = requests.get(f"{BASE_URL}{ENDPOINT}")
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✅ GET request successful")
        print(f"  Response: {response.json()}")
    elif response.status_code == 404:
        print(f"  ❌ 404 Not Found - Route is not registered")
        print(f"  Make sure:")
        print(f"    1. Django server is running")
        print(f"    2. Server was restarted after adding the route")
        print(f"    3. No import errors in server logs")
    else:
        print(f"  ⚠️ Unexpected status: {response.status_code}")
        print(f"  Response: {response.text}")
except requests.exceptions.ConnectionError:
    print("  ❌ Cannot connect to server")
    print("  Make sure Django server is running on http://127.0.0.1:8000")
except Exception as e:
    print(f"  ❌ Error: {e}")

print()

# Test 2: POST request with valid email
print("Test 2: POST request with valid email")
try:
    response = requests.post(
        f"{BASE_URL}{ENDPOINT}",
        json={"email": "test@example.com"},
        headers={"Content-Type": "application/json"}
    )
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✅ POST request successful")
        print(f"  Response: {response.json()}")
    elif response.status_code == 404:
        print(f"  ❌ 404 Not Found - Route is not registered")
    else:
        print(f"  Response: {response.text}")
except requests.exceptions.ConnectionError:
    print("  ❌ Cannot connect to server")
except Exception as e:
    print(f"  ❌ Error: {e}")

print()

# Test 3: POST request with invalid email
print("Test 3: POST request with invalid email")
try:
    response = requests.post(
        f"{BASE_URL}{ENDPOINT}",
        json={"email": "invalid-email"},
        headers={"Content-Type": "application/json"}
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.text}")
    if response.status_code == 400:
        print(f"  ✅ Validation working correctly")
except requests.exceptions.ConnectionError:
    print("  ❌ Cannot connect to server")
except Exception as e:
    print(f"  ❌ Error: {e}")

print()
print("=" * 60)
print("Test Complete")
print("=" * 60)

