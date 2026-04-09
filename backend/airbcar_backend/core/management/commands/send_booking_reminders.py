from datetime import timedelta, datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Booking, Notification
from core.utils.notifications import create_notification


class Command(BaseCommand):
    help = 'Send next-day booking reminder notifications to customers and partners.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Target pickup date in YYYY-MM-DD (defaults to tomorrow).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without creating notifications.',
        )

    def handle(self, *args, **options):
        target_date = self._get_target_date(options.get('date'))
        dry_run = bool(options.get('dry_run'))
        today = timezone.now().date()

        bookings = Booking.objects.filter(
            pickup_date=target_date,
            status__in=['pending', 'confirmed'],
        ).select_related('listing', 'customer', 'partner__user')

        created = 0
        skipped_existing = 0
        missing_users = 0

        for booking in bookings:
            listing_name = f"{booking.listing.make} {booking.listing.model}"

            recipients = []
            if booking.customer_id:
                recipients.append((
                    booking.customer,
                    'Booking Reminder: Pickup Tomorrow',
                    f'Reminder: your booking #{booking.id} for {listing_name} starts tomorrow ({booking.pickup_date}).',
                ))

            partner_user = getattr(booking.partner, 'user', None)
            if partner_user:
                recipients.append((
                    partner_user,
                    'Booking Reminder: Customer Pickup Tomorrow',
                    f'Reminder: booking #{booking.id} for {listing_name} starts tomorrow ({booking.pickup_date}).',
                ))

            if not recipients:
                missing_users += 1
                continue

            for user, title, message in recipients:
                exists = Notification.objects.filter(
                    user=user,
                    related_object_type='booking_reminder',
                    related_object_id=booking.id,
                    created_at__date=today,
                ).exists()

                if exists:
                    skipped_existing += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"[DRY RUN] Would notify user={user.id} booking={booking.id}: {title}"
                        )
                    )
                    continue

                create_notification(
                    user=user,
                    title=title,
                    message=message,
                    notif_type='info',
                    related_object_id=booking.id,
                    related_object_type='booking_reminder',
                )
                created += 1

        summary = (
            f"Target date: {target_date} | Bookings scanned: {bookings.count()} | "
            f"Notifications created: {created} | Duplicates skipped: {skipped_existing} | "
            f"Bookings with no recipients: {missing_users}"
        )
        self.stdout.write(self.style.SUCCESS(summary))

    def _get_target_date(self, date_arg):
        if date_arg:
            try:
                return datetime.strptime(date_arg, '%Y-%m-%d').date()
            except ValueError as exc:
                raise ValueError('Invalid --date format. Use YYYY-MM-DD.') from exc
        return timezone.now().date() + timedelta(days=1)
