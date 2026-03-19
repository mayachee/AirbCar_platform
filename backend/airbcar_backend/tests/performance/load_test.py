"""
Load testing with Locust.
Simulates concurrent users accessing the API to identify bottlenecks.

Run with:
    locust -f tests/performance/load_test.py --host=http://localhost:8000 -u 100 -r 10 -t 5m
    (100 users, spawn rate 10/sec, run for 5 minutes)
"""
from locust import HttpUser, task, between
import random
import json


class AirbcarUser(HttpUser):
    """Simulates a basic user browsing listings."""
    
    wait_time = between(2, 5)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.access_token = None
        self.user_id = None
    
    def on_start(self):
        """Called when a Locust user starts."""
        # Register/login to get token
        self.register_user()
    
    def register_user(self):
        """Register a new user."""
        username = f"user_{random.randint(1000000, 9999999)}"
        response = self.client.post(
            "/api/auth/register/",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "TestPass123!",
                "password2": "TestPass123!",
            },
            catch_response=True
        )
        
        if response.status_code in [201, 200]:
            try:
                self.user_id = response.json().get('id')
                self.login_user()
            except:
                pass
        else:
            # Try to login if already exists
            self.login_user()
    
    def login_user(self):
        """Login user and get token."""
        username_num = random.randint(1000000, 9999999)
        response = self.client.post(
            "/api/auth/login/",
            json={
                "username": f"user_{username_num}",
                "password": "TestPass123!",
            },
            catch_response=True
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                self.access_token = data.get('access') or data.get('token')
                self.user_id = data.get('user', {}).get('id')
            except:
                pass
    
    @task(10)
    def list_listings(self):
        """Task: Browse listings (most common action)."""
        with self.client.get(
            "/api/listings/",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(5)
    def filter_listings_by_location(self):
        """Task: Filter listings by location."""
        locations = ['New York', 'Los Angeles', 'Chicago', 'San Francisco']
        location = random.choice(locations)
        
        with self.client.get(
            f"/api/listings/?location={location}",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(3)
    def search_listings_by_price(self):
        """Task: Search listings by price range."""
        min_price = random.randint(30, 100)
        max_price = min_price + 100
        
        with self.client.get(
            f"/api/listings/?price_min={min_price}&price_max={max_price}",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(2)
    def view_listing_detail(self):
        """Task: View listing details."""
        listing_id = random.randint(1, 100)  # Adjust based on your data
        
        with self.client.get(
            f"/api/listings/{listing_id}/",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(5)
    def get_user_profile(self):
        """Task: Get user's own profile."""
        with self.client.get(
            "/api/user/me/",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 401:
                # Not authenticated, that's ok
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(3)
    def list_user_bookings(self):
        """Task: List user's bookings."""
        with self.client.get(
            "/api/bookings/",
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(2)
    def create_booking(self):
        """Task: Create a booking (lower weight, slower operation)."""
        if not self.access_token:
            return
        
        listing_id = random.randint(1, 50)
        data = {
            "listing": listing_id,
            "pickup_date": "2024-12-20",
            "return_date": "2024-12-25",
            "pickup_location": "Downtown",
            "return_location": "Downtown",
            "payment_method": "online",
        }
        
        with self.client.post(
            "/api/bookings/",
            json=data,
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [201, 400]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(1)
    def add_to_favorites(self):
        """Task: Add listing to favorites."""
        if not self.access_token:
            return
        
        listing_id = random.randint(1, 100)
        
        with self.client.post(
            f"/api/favorites/",
            json={"listing": listing_id},
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [201, 400]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    def get_headers(self):
        """Return headers with auth token."""
        headers = {}
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        return headers


class PartnerUser(HttpUser):
    """Simulates a partner user managing their listings."""
    
    wait_time = between(3, 8)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.access_token = None
        self.partner_id = None
    
    def on_start(self):
        """Called when a Locust partner user starts."""
        self.login_partner()
    
    def login_partner(self):
        """Login as partner."""
        response = self.client.post(
            "/api/auth/login/",
            json={
                "username": "partner_demo",  # Assuming this user exists
                "password": "PartnerPass123!",
            },
            catch_response=True
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get('access') or data.get('token')
    
    @task(5)
    def view_partner_listings(self):
        """Task: View own listings."""
        with self.client.get(
            "/api/listings/",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(5)
    def view_partner_bookings(self):
        """Task: View bookings for own listings."""
        with self.client.get(
            "/api/bookings/",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(2)
    def confirm_booking(self):
        """Task: Confirm a booking."""
        booking_id = random.randint(1, 50)
        
        with self.client.post(
            f"/api/bookings/{booking_id}/confirm/",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    @task(1)
    def update_listing(self):
        """Task: Update listing details."""
        listing_id = random.randint(1, 50)
        data = {
            "price_per_day": random.randint(50, 200),
            "is_available": random.choice([True, False]),
        }
        
        with self.client.patch(
            f"/api/listings/{listing_id}/",
            json=data,
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"Got {response.status_code}")
    
    def get_auth_headers(self):
        """Return headers with auth token."""
        headers = {}
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        return headers
