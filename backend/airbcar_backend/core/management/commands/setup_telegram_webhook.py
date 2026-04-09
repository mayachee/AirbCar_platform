"""
Management command to register the Telegram bot webhook.

Usage:
    python manage.py setup_telegram_webhook --url https://your-backend.com

This only needs to be run once after deployment (or when the backend URL changes).
"""
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Register the Telegram bot webhook with the Bot API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            required=False,
            help='Public HTTPS URL of your backend (e.g. https://airbcar-backend.onrender.com). '
                 'Defaults to BACKEND_URL in settings.',
        )
        parser.add_argument(
            '--delete',
            action='store_true',
            help='Delete the existing webhook instead of setting a new one.',
        )

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        if not token:
            raise CommandError('TELEGRAM_BOT_TOKEN is not set.')

        if options['delete']:
            self._delete_webhook(token)
            return

        backend_url = (
            options.get('url')
            or getattr(settings, 'BACKEND_URL', '')
            or getattr(settings, 'RENDER_EXTERNAL_URL', '')
        ).strip().rstrip('/')

        if not backend_url:
            raise CommandError(
                'Provide --url or set BACKEND_URL in your environment.'
            )

        webhook_url = f'{backend_url}/api/telegram/webhook/'
        secret = getattr(settings, 'TELEGRAM_WEBHOOK_SECRET', '').strip()

        self._set_webhook(token, webhook_url, secret)

    def _set_webhook(self, token: str, webhook_url: str, secret: str) -> None:
        api_url = f'https://api.telegram.org/bot{token}/setWebhook'
        payload: dict = {
            'url': webhook_url,
            'allowed_updates': json.dumps(['message']),
            'drop_pending_updates': True,
        }
        if secret:
            payload['secret_token'] = secret

        body = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(api_url, data=body, method='POST')

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8', errors='ignore')
            raise CommandError(f'Telegram API error {exc.code}: {raw}') from exc

        if data.get('ok'):
            self.stdout.write(self.style.SUCCESS(
                f'Webhook set successfully:\n  {webhook_url}'
            ))
        else:
            raise CommandError(f'Telegram returned error: {data}')

    def _delete_webhook(self, token: str) -> None:
        api_url = f'https://api.telegram.org/bot{token}/deleteWebhook'
        req = urllib.request.Request(api_url, data=b'', method='POST')
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8', errors='ignore')
            raise CommandError(f'Telegram API error {exc.code}: {raw}') from exc

        if data.get('ok'):
            self.stdout.write(self.style.SUCCESS('Webhook deleted.'))
        else:
            raise CommandError(f'Telegram returned error: {data}')
