"""
Load Testing Script for AirbCar Platform
Run with: locust -f load_test.py --host=https://airbcar-backend.onrender.com
Or: locust -f load_test.py --host=http://localhost:8000 (for local testing)

Install: pip install locust
"""

from locust import HttpUser, task, between
import random


class AirbCarUser(HttpUser):
    """Simulates a typical user browsing the AirbCar platform."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a user starts - simulate user landing on site."""
        self.client.get("/health/")
    
    @task(10)  # Weight: 10 (most common action)
    def browse_listings(self):
        """Browse available car listings."""
        # Random page
        page = random.randint(1, 5)
        self.client.get(f"/api/listings/?page={page}&page_size=20")
    
    @task(5)
    def search_listings(self):
        """Search for cars with filters."""
        locations = ["Paris", "London", "Berlin", "Madrid"]
        transmissions = ["automatic", "manual"]
        
        params = {
            "location": random.choice(locations),
            "transmission": random.choice(transmissions),
            "page": 1,
            "page_size": 20
        }
        
        self.client.get("/api/listings/", params=params)
    
    @task(3)
    def view_listing_detail(self):
        """View a specific listing detail."""
        # Simulate viewing listings with IDs 1-50
        listing_id = random.randint(1, 50)
        self.client.get(f"/api/listings/{listing_id}/")
    
    @task(2)
    def view_partners(self):
        """View partner listings."""
        self.client.get("/api/partners/?page=1&page_size=20")
    
    @task(1)
    def view_reviews(self):
        """View reviews."""
        self.client.get("/api/reviews/?page=1&page_size=20")
    
    @task(1)
    def health_check(self):
        """Check API health."""
        self.client.get("/health/")


class AuthenticatedUser(HttpUser):
    """Simulates an authenticated user performing actions."""
    
    wait_time = between(2, 5)
    
    def on_start(self):
        """Login user."""
        # You'll need to create a test user first
        self.login()
    
    def login(self):
        """Login with test credentials."""
        response = self.client.post("/api/login/", json={
            "username": "testuser",  # Create this user in your database first
            "password": "testpass123"
        })
        
        if response.status_code == 200:
            token = response.json().get("access")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"Login failed: {response.status_code}")
            self.headers = {}
    
    @task(5)
    def view_my_bookings(self):
        """View user's bookings."""
        self.client.get("/api/bookings/", headers=self.headers)
    
    @task(3)
    def view_my_favorites(self):
        """View user's favorite listings."""
        self.client.get("/api/favorites/me/", headers=self.headers)
    
    @task(2)
    def view_my_profile(self):
        """View user profile."""
        self.client.get("/api/users/me/", headers=self.headers)


# Benchmark Tests
"""
EXPECTED RESULTS (Free Tier Render):

Light Load (10 users):
- Response time: 100-300ms (95th percentile)
- Requests/sec: 20-30
- Failure rate: < 1%

Medium Load (50 users):
- Response time: 300-800ms (95th percentile)
- Requests/sec: 50-80
- Failure rate: < 5%

Heavy Load (100 users):
- Response time: 800-2000ms (95th percentile)
- Requests/sec: 80-120
- Failure rate: May increase above 5%

BREAKING POINT:
- Free tier: ~100-150 concurrent users
- Paid tier (512MB): ~300-500 concurrent users
- With caching: 2-3x improvement

RUN COMMANDS:

# Light load test (10 users, 2 minutes)
locust -f load_test.py --host=https://airbcar-backend.onrender.com --users 10 --spawn-rate 2 --run-time 2m --headless

# Medium load test (50 users, 5 minutes)
locust -f load_test.py --host=https://airbcar-backend.onrender.com --users 50 --spawn-rate 5 --run-time 5m --headless

# Heavy load test (100 users, 10 minutes) - May fail on free tier
locust -f load_test.py --host=https://airbcar-backend.onrender.com --users 100 --spawn-rate 10 --run-time 10m --headless

# With web UI (recommended for first time)
locust -f load_test.py --host=https://airbcar-backend.onrender.com
# Then open http://localhost:8089 in browser
"""
