import os
import django
import sys
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.test_settings')
django.setup()

from core.models import User, Partner, Listing, CarShareRequest

def test_car_share():
    print("Testing Car Share Setup...")

    # Clear
    User.objects.filter(username__in=['agency1', 'agency2']).delete()

    u1 = User.objects.create(username="agency1", email="a1@test.com")
    p1 = Partner.objects.create(user=u1, business_name="Agency 1", username="agency1")

    u2 = User.objects.create(username="agency2", email="a2@test.com")
    p2 = Partner.objects.create(user=u2, business_name="Agency 2", username="agency2")

    l1 = Listing.objects.create(
        partner=p1, make="Toyota", model="Camry", year=2020, 
        price_per_day=50, location="Paris", seating_capacity=5, 
        vehicle_style="sedan", transmission="automatic", fuel_type="hybrid"
    )

    print(f"-> Generated Listing: {l1.name} with Public ID: {l1.public_id}")
    assert l1.public_id.startswith("CAR-")

    req = CarShareRequest.objects.create(
        requester=p2,
        owner=p1,
        listing=l1,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=2),
        total_price=100
    )

    print(f"-> Created Request: {req}")
    assert req.status == 'pending'

    req.status = 'accepted'
    req.save()
    print(f"-> Status successfully transitioned to {req.status}")
    print("ALL TESTS PASSED: TRUE")

if __name__ == '__main__':
    test_car_share()