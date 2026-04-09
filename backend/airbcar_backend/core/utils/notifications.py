"""
Notification helper utilities.
Creates Notification objects for various events.
"""
from ..models import Notification
from .telegram import notify_user_telegram


def create_notification(user, title, message, notif_type='info', related_object_id=None, related_object_type=None):
    """Create a notification for a user."""
    try:
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=notif_type,
            related_object_id=related_object_id,
            related_object_type=related_object_type,
        )
        # Telegram is best-effort and must never block core app flows.
        try:
            notify_user_telegram(user, title, message)
        except Exception as e:
            print(f"[TELEGRAM] Failed to send Telegram notification: {e}")
        return notification
    except Exception as e:
        print(f"[NOTIFICATION] Failed to create notification for {user}: {e}")
        return None


def notify_new_booking(owner, booking):
    """Notify listing owner about a new booking."""
    return create_notification(
        user=owner,
        title='New Booking Request',
        message=f'You have a new booking request for "{booking.listing.title}" from {booking.user.first_name or booking.user.username}.',
        notif_type='new_booking',
        related_object_id=booking.id,
        related_object_type='booking',
    )


def notify_booking_confirmed(guest, booking):
    """Notify guest that their booking was confirmed."""
    return create_notification(
        user=guest,
        title='Booking Confirmed',
        message=f'Your booking for "{booking.listing.title}" has been confirmed!',
        notif_type='success',
        related_object_id=booking.id,
        related_object_type='booking',
    )


def notify_booking_rejected(guest, booking):
    """Notify guest that their booking was rejected."""
    return create_notification(
        user=guest,
        title='Booking Declined',
        message=f'Unfortunately, your booking for "{booking.listing.title}" was declined.',
        notif_type='warning',
        related_object_id=booking.id,
        related_object_type='booking',
    )


def notify_new_review(owner, review):
    """Notify listing owner about a new review."""
    return create_notification(
        user=owner,
        title='New Review',
        message=f'{review.user.first_name or review.user.username} left a {review.rating}-star review on "{review.listing.title}".',
        notif_type='info',
        related_object_id=review.id,
        related_object_type='review',
    )


def notify_review_reply(reviewer, reply):
    """Notify original reviewer about a reply to their review."""
    text = reply.comment if hasattr(reply, 'comment') else (reply.content if hasattr(reply, 'content') else '')
    msg = f'Someone replied to your review: "{text[:80]}..."' if len(text) > 80 else f'Someone replied to your review: "{text}"'
    return create_notification(
        user=reviewer,
        title='New Reply to Your Review',
        message=msg,
        notif_type='info',
        related_object_id=reply.review.id,
        related_object_type='review',
    )


def notify_welcome(user):
    """Send a welcome notification to a new user."""
    return create_notification(
        user=user,
        title='Welcome to AirBcar! 🚗',
        message='Thanks for joining AirBcar! Browse available cars or list your own to get started.',
        notif_type='success',
    )


def notify_partner_approved(user):
    """Notify a partner that their profile was approved."""
    return create_notification(
        user=user,
        title='Partner Profile Approved ✅',
        message='Congratulations! Your partner profile has been approved. You can now list vehicles and receive bookings.',
        notif_type='success',
        related_object_type='partner',
    )


def notify_partner_rejected(user):
    """Notify a partner that their profile was rejected."""
    return create_notification(
        user=user,
        title='Partner Profile Update Required',
        message='Your partner profile needs some updates before approval. Please review your information and try again.',
        notif_type='warning',
        related_object_type='partner',
    )


def notify_booking_cancelled(owner, booking):
    """Notify listing owner that a booking was cancelled by the guest."""
    return create_notification(
        user=owner,
        title='Booking Cancelled',
        message=f'A booking for "{booking.listing.title}" has been cancelled.',
        notif_type='warning',
        related_object_id=booking.id,
        related_object_type='booking',
    )


def notify_booking_tomorrow(user, booking):
    """Notify a user that a booking pickup is tomorrow."""
    listing_name = f"{booking.listing.make} {booking.listing.model}"
    return create_notification(
        user=user,
        title='Booking Reminder: Pickup Tomorrow',
        message=f'Reminder: your booking #{booking.id} for {listing_name} starts tomorrow ({booking.pickup_date}).',
        notif_type='info',
        related_object_id=booking.id,
        related_object_type='booking_reminder',
    )
