"""WhatsApp booking helpers.

The "Book via WhatsApp" flow short-circuits the standard online checkout:
the renter creates a `pending_whatsapp` Booking, gets a wa.me link with a
prefilled message, and the partner accepts/rejects from their existing
Telegram bot via inline-button callbacks. Tokens here authenticate those
callbacks against a specific booking + partner pair.
"""
from __future__ import annotations

import hmac
import hashlib
import secrets
import urllib.parse

from django.conf import settings


_TOKEN_SEPARATOR = ':'


def _signing_key() -> bytes:
    """HMAC key. Falls back to SECRET_KEY so the bot still works in dev
    without an extra env var, but production should set this explicitly."""
    key = getattr(settings, 'WHATSAPP_BOOKING_SIGNING_KEY', '') or settings.SECRET_KEY
    return key.encode('utf-8') if isinstance(key, str) else bytes(key)


def generate_booking_token(booking_id: int, partner_id: int) -> str:
    """Return an opaque token the Telegram bot can present back to us
    when the partner taps Accept/Reject.

    Format: `<nonce>:<hmac>` where the HMAC binds nonce + booking_id +
    partner_id. We persist this on the Booking, so the *primary* check
    is "does the stored token match the one in the callback" — the HMAC
    just makes guessing impractical for any third party.
    """
    nonce = secrets.token_urlsafe(16)
    payload = f'{nonce}|{int(booking_id)}|{int(partner_id)}'.encode('utf-8')
    digest = hmac.new(_signing_key(), payload, hashlib.sha256).hexdigest()[:32]
    return f'{nonce}{_TOKEN_SEPARATOR}{digest}'


def build_wa_me_url(phone_e164: str, prefilled_text: str) -> str:
    """Construct a wa.me deep-link with a prefilled message body.

    Strips the leading '+' since wa.me wants bare digits.
    """
    digits = ''.join(c for c in (phone_e164 or '') if c.isdigit())
    encoded = urllib.parse.quote(prefilled_text)
    return f'https://wa.me/{digits}?text={encoded}'


def build_prefilled_message(booking_id: int, vehicle_label: str,
                             pickup_date, return_date, token: str) -> str:
    """Renter's opening WhatsApp message to the partner."""
    short_token = token.split(_TOKEN_SEPARATOR)[0][:8]
    return (
        f'Hello, I would like to book {vehicle_label} from {pickup_date} '
        f'to {return_date}. Ref: AC-{booking_id}-{short_token}'
    )
