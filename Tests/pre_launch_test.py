"""
Quick Pre-Launch Test Script
Runs essential tests before deploying to production.

Usage: python pre_launch_tests.py
"""

import requests
import sys
import time
from urllib.parse import urljoin


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_test(name):
    print(f"\n{Colors.BLUE}Testing: {name}...{Colors.END}")


def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")


def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")


def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")


def test_endpoint(base_url, endpoint, expected_status=200, method='GET', data=None):
    """Test a single endpoint."""
    url = urljoin(base_url, endpoint)
    
    try:
        start_time = time.time()
        
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        else:
            response = requests.request(method, url, json=data, timeout=10)
        
        response_time = (time.time() - start_time) * 1000
        
        if response.status_code == expected_status:
            print_success(f"{endpoint} - Status: {response.status_code}, Time: {response_time:.0f}ms")
            return True
        else:
            print_error(f"{endpoint} - Expected {expected_status}, got {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_error(f"{endpoint} - Request timed out (>10s)")
        return False
    except requests.exceptions.ConnectionError:
        print_error(f"{endpoint} - Connection failed")
        return False
    except Exception as e:
        print_error(f"{endpoint} - Error: {str(e)}")
        return False


def run_tests(base_url):
    """Run all pre-launch tests."""
    
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}🚀 PRE-LAUNCH TEST SUITE{Colors.END}")
    print(f"Testing: {base_url}")
    print(f"{'='*60}")
    
    results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }
    
    tests = [
        # Health and basic endpoints
        ("Health Check", "/health/", 200, 'GET'),
        ("Root API", "/api/", 200, 'GET'),
        
        # Listings endpoints
        ("List Listings", "/api/listings/", 200, 'GET'),
        ("List Listings (Page 2)", "/api/listings/?page=2", 200, 'GET'),
        ("List Listings (With Filters)", "/api/listings/?transmission=automatic&fuel_type=diesel", 200, 'GET'),
        ("Listing Detail (ID 1)", "/api/listings/1/", 200, 'GET'),  # May 404 if no data
        
        # Partners endpoints
        ("List Partners", "/api/partners/", 200, 'GET'),
        
        # Reviews endpoints
        ("List Reviews", "/api/reviews/", 200, 'GET'),
        
        # Auth endpoints (unauthenticated)
        ("Register (No Data)", "/api/register/", 400, 'POST', {}),  # Should fail with 400
        ("Login (No Data)", "/api/login/", 400, 'POST', {}),  # Should fail with 400
        
        # 404 test
        ("Non-existent Endpoint", "/api/nonexistent/", 404, 'GET'),
    ]
    
    for test_name, endpoint, expected_status, method in tests:
        print_test(test_name)
        results['total'] += 1
        
        if test_endpoint(base_url, endpoint, expected_status, method):
            results['passed'] += 1
        else:
            results['failed'] += 1
        
        time.sleep(0.5)  # Rate limit ourselves
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}📊 TEST SUMMARY{Colors.END}")
    print(f"{'='*60}")
    print(f"Total Tests: {results['total']}")
    print_success(f"Passed: {results['passed']}")
    
    if results['failed'] > 0:
        print_error(f"Failed: {results['failed']}")
    
    pass_rate = (results['passed'] / results['total']) * 100
    print(f"Pass Rate: {pass_rate:.1f}%")
    
    if pass_rate >= 90:
        print_success("✅ Platform is ready for launch!")
        return 0
    elif pass_rate >= 70:
        print_warning("⚠️  Platform needs minor fixes before launch")
        return 1
    else:
        print_error("❌ Platform has critical issues - DO NOT LAUNCH")
        return 2


def main():
    """Main entry point."""
    
    # Test production URL
    production_url = "https://airbcar-backend.onrender.com"
    
    # Or test local
    # production_url = "http://localhost:8000"
    
    exit_code = run_tests(production_url)
    
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}💡 RECOMMENDATIONS{Colors.END}")
    print(f"{'='*60}")
    
    if exit_code == 0:
        print_success("All systems operational. Safe to launch.")
        print("Next steps:")
        print("  1. Run load tests: locust -f load_test.py")
        print("  2. Enable monitoring (Sentry)")
        print("  3. Configure rate limiting")
    elif exit_code == 1:
        print_warning("Minor issues detected. Review failed tests.")
        print("Action items:")
        print("  1. Check failed endpoints")
        print("  2. Verify database connection")
        print("  3. Test again after fixes")
    else:
        print_error("Critical failures. DO NOT LAUNCH yet.")
        print("Action items:")
        print("  1. Check server logs")
        print("  2. Verify all environment variables")
        print("  3. Test database connection")
        print("  4. Run migrations")
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
