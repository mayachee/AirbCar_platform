import os

filepath = 'core/views/partner_views.py'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add Notification to imports
content = content.replace(
    'PasswordReset, PartnerFollow, PartnerPost, CarShareRequest',
    'PasswordReset, PartnerFollow, PartnerPost, CarShareRequest, Notification'
)

# 2. Add `_create_notification_safe` function
notification_code = '''
def _create_notification_safe(**kwargs):
    """Best-effort notification creation."""
    try:
        from django.db import transaction, ProgrammingError, OperationalError, DatabaseError
        from ..utils.telegram import notify_user_telegram
        with transaction.atomic():
            Notification.objects.create(**kwargs)
        try:
            user = kwargs.get('user')
            title = kwargs.get('title', '')
            message = kwargs.get('message', '')
            if user and title and message:
                notify_user_telegram(user, title, message)
        except Exception as e:
            if settings.DEBUG:
                print(f"Telegram notification skipped: {e}")
    except Exception as e:
        if settings.DEBUG:
            print(f"Notification creation skipped: {e}")

'''

if '_create_notification_safe' not in content:
    idx = content.find('class PartnerListView')
    content = content[:idx] + notification_code + content[idx:]

# 3. Add perform_create in CarShareRequestViewSet
perform_create_code = '''
    def perform_create(self, serializer):
        car_share = serializer.save()
        _create_notification_safe(
            user=car_share.owner.user,
            title="New B2B Car Share Request",
            message=f"{car_share.requester.business_name} has requested to borrow {car_share.listing.make} {car_share.listing.model}.",
            type="info",
            related_object_type="car_share"
        )
'''

if 'def perform_create' not in content[content.find('class CarShareRequestViewSet'):]:
    idx = content.find('@action', content.find('class CarShareRequestViewSet'))
    content = content[:idx] + perform_create_code + '\n    ' + content[idx:]


# 4. Modify update_status inside CarShareRequestViewSet
old_update_status = '''        car_share.status = new_status
        car_share.save()

        serializer = self.get_serializer(car_share)'''

new_update_status = '''        car_share.status = new_status
        car_share.save()

        if new_status == 'accepted':
            # Handle Partner Earnings
            from django.db.models import F
            requester = car_share.requester
            owner = car_share.owner
            requester.total_earnings = F('total_earnings') - car_share.total_price
            owner.total_earnings = F('total_earnings') + car_share.total_price
            requester.save(update_fields=['total_earnings'])
            owner.save(update_fields=['total_earnings'])
            
            _create_notification_safe(
                user=requester.user,
                title="B2B Share Accepted",
                message=f"Your request to borrow {car_share.listing.make} has been accepted by {owner.business_name}. {car_share.total_price} has been deducted from your earnings.",
                type="success",
                related_object_type="car_share"
            )
        elif new_status == 'rejected':
            _create_notification_safe(
                user=car_share.requester.user,
                title="B2B Share Rejected",
                message=f"{car_share.owner.business_name} has rejected your request to borrow {car_share.listing.make}.",
                type="error",
                related_object_type="car_share"
            )

        serializer = self.get_serializer(car_share)'''

content = content.replace(old_update_status, new_update_status)

with open(filepath, 'w') as f:
    f.write(content)

print("SUCCESS")
