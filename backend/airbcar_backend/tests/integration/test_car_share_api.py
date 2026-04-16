import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from core.models import User, Partner, Listing, CarShareRequest
from decimal import Decimal

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
def test_inter_agency_car_share_api(api_client):
    # Setup test data
    u1 = User.objects.create(username="agency1", email="a1@test.com")
    p1 = Partner.objects.create(user=u1, business_name="Agency 1", username="age1", total_earnings=Decimal("1000.00"))
    
    u2 = User.objects.create(username="agency2", email="a2@test.com")
    p2 = Partner.objects.create(user=u2, business_name="Agency 2", username="age2", total_earnings=Decimal("2000.00"))

    l1 = Listing.objects.create(
        partner=p1, make="Toyota", model="Camry", year=2021, 
        price_per_day=50, location="NY", seating_capacity=5, 
        vehicle_style="sedan", transmission="automatic", fuel_type="gas"
    )

    share_url = '/partners/car-shares/' # Note: we mapped this in router.register

    # 1. Test unauthenticated access (Should be 401)
    res = api_client.get(share_url)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # 2. Authenticate as Agency 2
    api_client.force_authenticate(user=u2)

    # 3. Test creating a share request
    req_payload = {
        "public_id": l1.public_id,
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=2)),
        "total_price": "200.00",
        "notes": "Need this for a VIP client"
    }
    
    print("\n--- Testing POST request to create a car share ---")
    post_res = api_client.post(share_url, req_payload, format='json')
    assert post_res.status_code == status.HTTP_201_CREATED, f"Expected 201, got {post_res.status_code}: {post_res.data}"
    
    share_id = post_res.data['id']
    print(f"Success! Created Share Request ID: {share_id}, Status: {post_res.data['status']}")
    
    # 4. Try requesting own car (Authenticate as Agency 1)
    api_client.force_authenticate(user=u1)
    print("\n--- Testing attempting to request OWN car ---")
    own_req_res = api_client.post(share_url, req_payload, format='json')
    assert own_req_res.status_code == status.HTTP_400_BAD_REQUEST
    print("Success! System explicitly prevented requesting own vehicle.")

    # 5. Test getting lists 
    print("\n--- Testing GET requests list as Car Owner ---")
    get_res = api_client.get(share_url)
    assert get_res.status_code == status.HTTP_200_OK
    
    results = get_res.data.get('results', get_res.data) # handle pagination if present
    assert len(results) > 0
    assert results[0]['id'] == share_id
    print(f"Success! Found {len(results)} incoming requests.")

    # 6. Test accepting a request (as Owner - u1)
    print("\n--- Testing Accepted Status & Financial Transition ---")
    patch_url = f"{share_url}{share_id}/status/"
    patch_res = api_client.patch(patch_url, {"status": "accepted"}, format='json')
    assert patch_res.status_code == status.HTTP_200_OK, patch_res.content
    
    # Reload partners to check earnings update
    p1.refresh_from_db()
    p2.refresh_from_db()
    
    # Expected: p1 (owner) gets +200, p2 (requester) gets -200
    print(f"Owner Earnings Post-Accept: {p1.total_earnings}")
    print(f"Requester Earnings Post-Accept: {p2.total_earnings}")
    assert p1.total_earnings == Decimal("1200.00")
    assert p2.total_earnings == Decimal("1800.00")
    print("Success! Financial settlement applied properly.")

    print("\nALL API INTEGRATION TESTS PASSED SUCCESSFULLY!")
