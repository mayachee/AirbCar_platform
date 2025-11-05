"""
Test the partner public endpoint
Run: python test_partner_endpoint.py 38
"""

import requests
import sys

API_BASE_URL = "http://localhost:8000"

def test_endpoint(identifier):
    """Test partner endpoint with ID or slug"""
    
    url = f"{API_BASE_URL}/partners/public/{identifier}/"
    
    print(f"\n{'='*60}")
    print(f"Testing: {url}")
    print(f"{'='*60}\n")
    
    try:
        response = requests.get(url, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}\n")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"\nPartner Info:")
            print(f"  Company: {data.get('company_name')}")
            print(f"  Slug: {data.get('slug')}")
            print(f"  Status: {data.get('verification_status')}")
            print(f"  Total Listings: {data.get('total_listings')}")
            print(f"  Average Rating: {data.get('average_rating')}")
            return True
        elif response.status_code == 404:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            print(f"❌ 404 Not Found")
            print(f"Error: {error_data.get('error', 'Partner not found')}")
            print("\nPossible reasons:")
            print("  1. Partner doesn't exist")
            print("  2. Partner verification_status is not 'approved'")
            print("  3. Migration not run (missing slug field)")
            print("\n💡 Run: python check_partner.py 38")
            return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error!")
        print("   Is the backend server running?")
        print("   Start it with: cd backend/airbcar_backend && python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    identifier = sys.argv[1] if len(sys.argv) > 1 else "38"
    
    print(f"🧪 Testing Partner Public Endpoint")
    test_endpoint(identifier)


