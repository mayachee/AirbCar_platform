"""Integration tests for the B2B agent-to-agent chat layer.

Covers the messages action (POST + GET with pagination + ?after delta),
the new messages/read/ cursor endpoint, the new inbox/ summary endpoint,
permission boundaries, and notification coalescing.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    User, Partner, Listing, CarShareRequest, B2BMessage,
    CarShareRequestRead, Notification,
)


def _make_partner(username, business_name):
    user = User.objects.create(username=username, email=f"{username}@test.com", role='partner')
    partner = Partner.objects.create(
        user=user, business_name=business_name, username=username,
        total_earnings=Decimal("0.00"),
    )
    return user, partner


def _make_listing(partner, **overrides):
    fields = dict(
        partner=partner, make='Toyota', model='Camry', year=2021,
        price_per_day=Decimal("50"), location='Casablanca', seating_capacity=5,
        vehicle_style='sedan', transmission='automatic', fuel_type='gas',
    )
    fields.update(overrides)
    return Listing.objects.create(**fields)


def _make_share(owner, requester, listing):
    return CarShareRequest.objects.create(
        owner=owner, requester=requester, listing=listing,
        start_date=date.today(), end_date=date.today() + timedelta(days=2),
        total_price=Decimal("100.00"), status='pending',
    )


@pytest.fixture
def b2b_setup(db):
    owner_user, owner = _make_partner('owner_agency', 'Owner Agency')
    requester_user, requester = _make_partner('borrow_agency', 'Borrow Agency')
    outsider_user, outsider = _make_partner('outsider_agency', 'Outsider Agency')
    listing = _make_listing(owner)
    share = _make_share(owner=owner, requester=requester, listing=listing)
    return {
        'owner_user': owner_user, 'owner': owner,
        'requester_user': requester_user, 'requester': requester,
        'outsider_user': outsider_user, 'outsider': outsider,
        'listing': listing, 'share': share,
    }


def _client_for(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


# ---------------------------------------------------------------------------
# Messages: auth, pagination, delta cursor
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestB2BMessagesEndpoint:

    def test_non_participant_cannot_access_messages(self, b2b_setup):
        # Defense-in-depth: get_queryset filters to participating partners,
        # so a non-participant hits 404 (don't leak existence) before reaching
        # the explicit 403 guard inside the view.
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/"
        client = _client_for(b2b_setup['outsider_user'])
        assert client.get(url).status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)
        assert client.post(url, {'text': 'spam'}, format='json').status_code in (
            status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND,
        )

    def test_messages_paginated(self, b2b_setup):
        share = b2b_setup['share']
        for i in range(25):
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"msg {i}")
        url = f"/partners/car-shares/{share.id}/messages/"
        client = _client_for(b2b_setup['owner_user'])
        r = client.get(url + '?page_size=10')
        assert r.status_code == 200
        assert r.data['total_count'] == 25
        assert len(r.data['results']) == 10
        assert r.data['page'] == 1

    def test_messages_after_cursor_with_garbage_returns_400(self, b2b_setup):
        # Tighter than swallowing the error and returning the full thread —
        # a malformed ?after now fails fast so the frontend can't accidentally
        # re-fetch every message under a delta-shaped response.
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/?after=not-a-number"
        client = _client_for(b2b_setup['owner_user'])
        r = client.get(url)
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_messages_after_cursor_returns_delta_only(self, b2b_setup):
        share = b2b_setup['share']
        msg_ids = [
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"m{i}").id
            for i in range(5)
        ]
        url = f"/partners/car-shares/{share.id}/messages/?after={msg_ids[2]}"
        client = _client_for(b2b_setup['owner_user'])
        r = client.get(url)
        assert r.status_code == 200
        # Delta endpoint: only id > 2 — newest two only, no pagination wrapper meta
        ids = [m['id'] for m in r.data['results']]
        assert ids == msg_ids[3:]
        assert 'total_count' not in r.data  # delta payload, not paginated

    def test_messages_post_creates_message_and_notification(self, b2b_setup):
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/"
        client = _client_for(b2b_setup['requester_user'])
        r = client.post(url, {'text': 'hello'}, format='json')
        assert r.status_code == 201
        # Recipient (owner) got the notification, sender (requester) did not
        assert Notification.objects.filter(
            user=b2b_setup['owner_user'],
            related_object_type='b2b_message',
            related_object_id=b2b_setup['share'].id,
        ).count() == 1
        assert Notification.objects.filter(user=b2b_setup['requester_user']).count() == 0


# ---------------------------------------------------------------------------
# Notification coalescing
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestB2BNotificationCoalescing:

    def test_second_unread_message_does_not_create_second_notification(self, b2b_setup):
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/"
        client = _client_for(b2b_setup['requester_user'])
        client.post(url, {'text': 'one'}, format='json')
        client.post(url, {'text': 'two'}, format='json')
        client.post(url, {'text': 'three'}, format='json')
        n = Notification.objects.filter(
            user=b2b_setup['owner_user'],
            related_object_type='b2b_message',
            related_object_id=b2b_setup['share'].id,
        )
        assert n.count() == 1, "Expected coalesced single notification per chat burst."

    def test_new_notification_after_recipient_reads(self, b2b_setup):
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/"
        sender = _client_for(b2b_setup['requester_user'])
        sender.post(url, {'text': 'one'}, format='json')
        # Owner reads — marks the existing notification as read
        Notification.objects.filter(user=b2b_setup['owner_user']).update(is_read=True)
        # Sender posts again — coalesce window passes because no UNREAD exists
        sender.post(url, {'text': 'two'}, format='json')
        assert Notification.objects.filter(
            user=b2b_setup['owner_user'],
            related_object_type='b2b_message',
        ).count() == 2


# ---------------------------------------------------------------------------
# Read cursor endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestB2BMessagesReadCursor:

    def test_mark_read_advances_cursor(self, b2b_setup):
        share = b2b_setup['share']
        msgs = [
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"m{i}")
            for i in range(3)
        ]
        url = f"/partners/car-shares/{share.id}/messages/read/"
        client = _client_for(b2b_setup['owner_user'])
        r = client.post(url, {'message_id': msgs[1].id}, format='json')
        assert r.status_code == 200
        assert r.data['last_read_message_id'] == msgs[1].id
        cursor = CarShareRequestRead.objects.get(car_share_request=share, partner=b2b_setup['owner'])
        assert cursor.last_read_message_id == msgs[1].id

    def test_mark_read_does_not_regress(self, b2b_setup):
        share = b2b_setup['share']
        msgs = [
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"m{i}")
            for i in range(3)
        ]
        url = f"/partners/car-shares/{share.id}/messages/read/"
        client = _client_for(b2b_setup['owner_user'])
        client.post(url, {'message_id': msgs[2].id}, format='json')
        # Send an older message_id — cursor must not regress
        r = client.post(url, {'message_id': msgs[0].id}, format='json')
        assert r.status_code == 200
        cursor = CarShareRequestRead.objects.get(car_share_request=share, partner=b2b_setup['owner'])
        assert cursor.last_read_message_id == msgs[2].id

    def test_mark_read_rejects_foreign_thread_message_id(self, b2b_setup):
        # Message belongs to a different share — must 404
        other_listing = _make_listing(b2b_setup['owner'], make='Honda')
        other_share = _make_share(owner=b2b_setup['owner'], requester=b2b_setup['outsider'], listing=other_listing)
        foreign_msg = B2BMessage.objects.create(
            car_share_request=other_share, sender=b2b_setup['outsider'], text='from other',
        )
        url = f"/partners/car-shares/{b2b_setup['share'].id}/messages/read/"
        client = _client_for(b2b_setup['owner_user'])
        r = client.post(url, {'message_id': foreign_msg.id}, format='json')
        assert r.status_code == 404

    def test_mark_read_requires_participant(self, b2b_setup):
        share = b2b_setup['share']
        msg = B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text='m')
        url = f"/partners/car-shares/{share.id}/messages/read/"
        client = _client_for(b2b_setup['outsider_user'])
        r = client.post(url, {'message_id': msg.id}, format='json')
        # 404 from get_queryset filtering, 403 if reached the explicit guard
        assert r.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Inbox endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestB2BInboxEndpoint:

    def test_inbox_returns_unread_count_excluding_own_messages(self, b2b_setup):
        share = b2b_setup['share']
        # Requester sends 3 — owner's unread should be 3
        for i in range(3):
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"m{i}")
        # Owner sends 1 — must NOT count toward owner's own unread
        B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['owner'], text='reply')

        client = _client_for(b2b_setup['owner_user'])
        r = client.get('/partners/car-shares/inbox/')
        assert r.status_code == 200
        items = r.data['results']
        assert len(items) == 1
        assert items[0]['unread_count'] == 3
        assert items[0]['other_partner']['business_name'] == 'Borrow Agency'

    def test_inbox_zero_unread_after_read_cursor(self, b2b_setup):
        share = b2b_setup['share']
        msgs = [
            B2BMessage.objects.create(car_share_request=share, sender=b2b_setup['requester'], text=f"m{i}")
            for i in range(3)
        ]
        owner_client = _client_for(b2b_setup['owner_user'])
        owner_client.post(
            f"/partners/car-shares/{share.id}/messages/read/",
            {'message_id': msgs[-1].id}, format='json',
        )
        r = owner_client.get('/partners/car-shares/inbox/')
        assert r.data['results'][0]['unread_count'] == 0

    def test_inbox_excludes_non_participating_threads(self, b2b_setup):
        # Set up a third thread between owner + outsider that requester is NOT in
        other_listing = _make_listing(b2b_setup['owner'], make='Honda')
        _make_share(owner=b2b_setup['owner'], requester=b2b_setup['outsider'], listing=other_listing)
        client = _client_for(b2b_setup['requester_user'])
        r = client.get('/partners/car-shares/inbox/')
        assert r.status_code == 200
        ids = [item['request_id'] for item in r.data['results']]
        assert b2b_setup['share'].id in ids
        assert len(ids) == 1  # only the one share requester participates in

    def test_inbox_orders_by_most_recent_message(self, b2b_setup):
        # Make a second thread, send msgs in a specific order, assert sort
        other_listing = _make_listing(b2b_setup['requester'], make='BMW')
        share2 = _make_share(owner=b2b_setup['requester'], requester=b2b_setup['owner'], listing=other_listing)
        # Old msg in share1
        B2BMessage.objects.create(car_share_request=b2b_setup['share'], sender=b2b_setup['requester'], text='old')
        # Newer msg in share2
        B2BMessage.objects.create(car_share_request=share2, sender=b2b_setup['owner'], text='newer')
        client = _client_for(b2b_setup['owner_user'])
        r = client.get('/partners/car-shares/inbox/')
        ids = [item['request_id'] for item in r.data['results']]
        assert ids[0] == share2.id
        assert ids[1] == b2b_setup['share'].id
