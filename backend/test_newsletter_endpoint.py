"""
Quick test script to verify the newsletter endpoint is accessible
Run this after restarting the Django server: python test_newsletter_endpoint.py
"""
import requests
import json

url = "http://127.0.0.1:8000/api/newsletter/subscribe/"
data = {"email": "test@example.com"}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        print("✅ Newsletter endpoint is working!")
    else:
        print(f"❌ Unexpected status code: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend server. Make sure it's running on http://127.0.0.1:8000")
except Exception as e:
    print(f"❌ Error: {e}")

