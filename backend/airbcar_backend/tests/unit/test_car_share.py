import pytest
from datetime import date, timedelta
from core.models import User, Partner, Listing, CarShareRequest

@pytest.mark.django_db
def test_inter_agency_car_share():
    print("\nTesting Car Share Component logic...")
    u1 = User.objects.create(username="agencyA", email="a@a.com")
    p1 = Partner.objects.create(user=u1, business_name="Agency A", username="ageA")

    u2 = User.objects.create(username="agencyB", email="b@b.com")
    p2 = Partner.objects.create(user=u2, business_name="Agency B", username="ageB")

    # 1. Test Listing Generation overrides public_id
    l1 = Listing.objects.create(
        partner=p1, make="Tesla", model="Model 3", year=2025, 
        price_per_day=100, location="Paris", seating_capacity=5, 
        vehicle_style="sedan", transmission="automatic", fuel_type="electric"
    )

    assert l1.public_id is not None
    assert l1.public_id.startswith("CAR-")
    print(f"Successfully generated public_id inside Listing.save(): {l1.public_id}")

    # 2. Test CarShareRequest logic
    req = CarShareRequest.objects.create(
        requester=p2,
        owner=p1,
        listing=l1,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=2),
        total_price=200
    )

    assert req.status == 'pending'
    assert req.owner == p1
    assert req.requester == p2

    print(f"Successfully created CarShareRequest representing an inter-agency loan: {req}")

    # 3. Acceptance transition
    req.status = 'accepted'
    req.save()
    assert req.status == 'accepted'
    print(f"Successfully transitioned state: {req.status}")
