"""
Quick test to verify backend endpoint is accessible
Run: python test_backend_endpoint.py
"""

import requests
import sys

def test_endpoints():
    base_url = "http://localhost:8000"
    
    print("=" * 60)
    print("Testing Backend Endpoints")
    print("=" * 60)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   ✅ Root endpoint is accessible")
    except Exception as e:
        print(f"   ❌ Root endpoint failed: {e}")
        return
    
    # Test 2: Partner public endpoint
    print("\n2. Testing partner public endpoint...")
    test_urls = [
        f"{base_url}/partners/public/38/",
        f"{base_url}/partners/public/test/",
    ]
    
    for url in test_urls:
        try:
            print(f"\n   Testing: {url}")
            response = requests.get(url, timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success! Partner: {data.get('company_name', 'N/A')}")
            elif response.status_code == 404:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                print(f"   ❌ 404 Not Found: {error_data.get('error', 'Partner not found')}")
            else:
                print(f"   ⚠️  Status {response.status_code}: {response.text[:200]}")
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection Error - Is backend running?")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test 3: List all registered URLs (if Django debug toolbar or similar)
    print("\n3. Available endpoints to check:")
    print(f"   - {base_url}/partners/ (requires auth)")
    print(f"   - {base_url}/partners/public/<slug>/ (public)")
    print(f"   - {base_url}/admin/")
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()


