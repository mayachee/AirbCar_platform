"""
Quick test script for partner public profile endpoint
Run this after setting up a partner with slug 'test-partner'
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_partner_profile(slug="test-partner"):
    """Test the public partner profile endpoint"""
    
    url = f"{API_BASE_URL}/partners/public/{slug}/"
    
    print(f"Testing: {url}")
    print("-" * 50)
    
    try:
        response = requests.get(url)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print("-" * 50)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Partner Profile:")
            print(json.dumps(data, indent=2))
            
            print("\n" + "=" * 50)
            print("Summary:")
            print(f"  Company: {data.get('company_name')}")
            print(f"  Slug: {data.get('slug')}")
            print(f"  Total Listings: {data.get('total_listings')}")
            print(f"  Average Rating: {data.get('average_rating')}")
            print(f"  Verification Status: {data.get('verification_status')}")
            
            if data.get('listings'):
                print(f"\n  Listings ({len(data['listings'])}):")
                for listing in data['listings'][:3]:  # Show first 3
                    print(f"    - {listing.get('make')} {listing.get('model')} ({listing.get('year')})")
                    print(f"      ${listing.get('price_per_day')}/day")
            
        elif response.status_code == 404:
            error_data = response.json()
            print(f"❌ Error: {error_data.get('error', 'Partner not found')}")
            print("\nPossible reasons:")
            print("  1. Partner doesn't exist")
            print("  2. Partner slug is incorrect")
            print("  3. Partner verification_status is not 'approved'")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Is the backend server running?")
        print(f"   Try: cd backend/airbcar_backend && python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    import sys
    
    # Get slug from command line or use default
    slug = sys.argv[1] if len(sys.argv) > 1 else "test-partner"
    
    print("=" * 50)
    print("Partner Public Profile API Test")
    print("=" * 50)
    print()
    
    test_partner_profile(slug)


