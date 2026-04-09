"""
Telegram bot webhook and partner linking views.

Flow:
  1. Partner opens their dashboard → calls GET /api/telegram/link/
     → receives a deep link like https://t.me/<BOT_USERNAME>?start=<token>
  2. Partner clicks the link, opens the bot, sends /start <token>
     → bot links their Telegram chat_id to their Airbcar account
  3. Partner can now use /addcar, /mybookings, /help in the bot
  4. All booking/review notifications are sent directly to their Telegram chat
"""
from __future__ import annotations

import json
import logging
import secrets

from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Listing, Partner, User
from ..utils.telegram import send_telegram_message

logger = logging.getLogger(__name__)

# ── constants ─────────────────────────────────────────────────────────────────

LINK_TOKEN_TTL = 900          # 15 minutes
STATE_TTL = 1800              # 30 minutes conversation window

# Conversation steps for /addcar
ADD_CAR_STEPS = [
    ('make',             'What is the car brand/make? (e.g. Toyota, Renault)'),
    ('model',            'What is the model? (e.g. Corolla, Clio)'),
    ('year',             'What year was it manufactured? (e.g. 2020)'),
    ('color',            'What color is the car? (e.g. White, Black)'),
    ('transmission',     'Transmission type?\nReply: manual or automatic'),
    ('fuel_type',        'Fuel type?\nReply: diesel, electric, or hybrid'),
    ('seating_capacity', 'How many seats does it have? (e.g. 5)'),
    ('vehicle_style',    'Vehicle style?\nReply: sedan, suv, hatchback, coupe, convertible, truck, or van'),
    ('price_per_day',    'Price per day in MAD? (e.g. 350)'),
    ('security_deposit', 'Security deposit in MAD? (default is 5000 — send "skip" to use default)'),
    ('location',         'Where is the car located? (city or address)'),
    ('vehicle_description', 'Any description? (send "skip" to leave it empty)'),
]

STEP_KEYS = [s[0] for s in ADD_CAR_STEPS]

VALID_TRANSMISSIONS = ('manual', 'automatic')
VALID_FUEL_TYPES    = ('diesel', 'electric', 'hybrid')
VALID_STYLES        = ('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van')


# ── helpers ───────────────────────────────────────────────────────────────────

def _state_key(chat_id: str) -> str:
    return f'tg_state_{chat_id}'


def _link_key(token: str) -> str:
    return f'tg_link_{token}'


def _get_bot_username() -> str:
    return getattr(settings, 'TELEGRAM_BOT_USERNAME', 'AirbcarBot')


def _reply(chat_id: str, text: str) -> None:
    send_telegram_message(str(chat_id), text, parse_mode='HTML')


def _get_pending_bookings_text(partner: Partner) -> str:
    from ..models import Booking
    bookings = (
        Booking.objects
        .filter(listing__partner=partner, status='pending')
        .select_related('listing', 'user')
        .order_by('-created_at')[:10]
    )
    if not bookings:
        return 'You have no pending booking requests right now.'

    lines = ['<b>Pending Booking Requests</b>\n']
    for b in bookings:
        car = f'{b.listing.make} {b.listing.model} {b.listing.year}'
        customer = b.user.first_name or b.user.username
        lines.append(
            f'• <b>#{b.id}</b> — {car}\n'
            f'  Customer: {customer}\n'
            f'  Dates: {b.pickup_date} → {b.return_date}\n'
            f'  Total: {b.total_amount} MAD\n'
        )
    return '\n'.join(lines)


def _validate_add_car_step(step_key: str, value: str):
    """Validate and coerce a value for the given step.

    Returns (coerced_value, error_message_or_None).
    """
    v = value.strip()

    if step_key == 'year':
        try:
            y = int(v)
            if not (1900 <= y <= 2100):
                raise ValueError
            return y, None
        except ValueError:
            return None, 'Please enter a valid year (e.g. 2020).'

    if step_key == 'seating_capacity':
        try:
            s = int(v)
            if s < 1:
                raise ValueError
            return s, None
        except ValueError:
            return None, 'Please enter a valid number of seats (e.g. 5).'

    if step_key == 'transmission':
        if v.lower() not in VALID_TRANSMISSIONS:
            return None, f'Please reply with one of: {", ".join(VALID_TRANSMISSIONS)}'
        return v.lower(), None

    if step_key == 'fuel_type':
        if v.lower() not in VALID_FUEL_TYPES:
            return None, f'Please reply with one of: {", ".join(VALID_FUEL_TYPES)}'
        return v.lower(), None

    if step_key == 'vehicle_style':
        if v.lower() not in VALID_STYLES:
            return None, f'Please reply with one of: {", ".join(VALID_STYLES)}'
        return v.lower(), None

    if step_key == 'price_per_day':
        try:
            p = Decimal(v)
            if p <= 0:
                raise ValueError
            return p, None
        except (InvalidOperation, ValueError):
            return None, 'Please enter a valid price (e.g. 350).'

    if step_key == 'security_deposit':
        if v.lower() == 'skip':
            return Decimal('5000'), None
        try:
            d = Decimal(v)
            if d < 0:
                raise ValueError
            return d, None
        except (InvalidOperation, ValueError):
            return None, 'Please enter a valid deposit amount or send "skip" for the default (5000 MAD).'

    if step_key == 'vehicle_description':
        return ('' if v.lower() == 'skip' else v), None

    # Generic string fields
    return v, None


# ── bot command handlers ───────────────────────────────────────────────────────

def handle_start(chat_id: str, token: str | None) -> None:
    """Handle /start [token]."""
    if not token:
        _reply(chat_id, (
            'Welcome to <b>Airbcar Partner Bot</b> 🚗\n\n'
            'To connect your account, go to your partner dashboard '
            'and click <b>Connect Telegram</b>.\n\n'
            'Commands:\n'
            '/addcar — Add a new car listing\n'
            '/mybookings — View pending booking requests\n'
            '/help — Show this message'
        ))
        return

    link_data = cache.get(_link_key(token))
    if not link_data:
        _reply(chat_id, 'This link has expired or is invalid. Please generate a new one from your dashboard.')
        return

    user_id = link_data.get('user_id')
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        _reply(chat_id, 'Account not found. Please try again.')
        return

    if user.role not in ('partner', 'admin', 'ceo'):
        _reply(chat_id, 'Only partner accounts can connect to this bot.')
        return

    user.telegram_chat_id = chat_id
    user.save(update_fields=['telegram_chat_id'])
    cache.delete(_link_key(token))

    partner_name = ''
    try:
        partner_name = user.partner_profile.business_name
    except Exception:
        partner_name = user.first_name or user.username

    _reply(chat_id, (
        f'✅ Connected! Hello, <b>{partner_name}</b>.\n\n'
        'You will now receive booking notifications here.\n\n'
        'Commands:\n'
        '/addcar — Add a new car listing\n'
        '/mybookings — View pending booking requests\n'
        '/help — Show help'
    ))


def handle_help(chat_id: str) -> None:
    _reply(chat_id, (
        '<b>Airbcar Partner Bot</b> 🚗\n\n'
        'Commands:\n'
        '/addcar — Add a new car listing (step by step)\n'
        '/mybookings — View your pending booking requests\n'
        '/help — Show this message\n\n'
        'You receive automatic notifications for:\n'
        '• New booking requests\n'
        '• Booking confirmations & cancellations\n'
        '• New reviews on your listings'
    ))


def handle_mybookings(chat_id: str) -> None:
    user = User.objects.filter(telegram_chat_id=chat_id).first()
    if not user:
        _reply(chat_id, 'Your Telegram is not linked to an Airbcar account. Use the link from your dashboard.')
        return

    try:
        partner = user.partner_profile
    except Exception:
        _reply(chat_id, 'No partner profile found for your account.')
        return

    _reply(chat_id, _get_pending_bookings_text(partner))


def handle_addcar_start(chat_id: str) -> None:
    user = User.objects.filter(telegram_chat_id=chat_id).first()
    if not user:
        _reply(chat_id, 'Your Telegram is not linked to an Airbcar account. Use the link from your dashboard.')
        return

    if not hasattr(user, 'partner_profile'):
        _reply(chat_id, 'Only partner accounts can add car listings.')
        return

    state = {'step': 0, 'data': {}, 'user_id': user.pk}
    cache.set(_state_key(chat_id), state, STATE_TTL)

    _reply(chat_id, (
        "Let's add a new car listing 🚗\n"
        "You can type /cancel at any time to stop.\n\n"
        f"Step 1/{len(ADD_CAR_STEPS)}: {ADD_CAR_STEPS[0][1]}"
    ))


def handle_addcar_step(chat_id: str, text: str, state: dict) -> None:
    if text.strip().lower() == '/cancel':
        cache.delete(_state_key(chat_id))
        _reply(chat_id, 'Car listing cancelled.')
        return

    step_index = state['step']
    step_key, _ = ADD_CAR_STEPS[step_index]

    coerced, error = _validate_add_car_step(step_key, text)
    if error:
        _reply(chat_id, f'⚠️ {error}\n\nStep {step_index + 1}/{len(ADD_CAR_STEPS)}: {ADD_CAR_STEPS[step_index][1]}')
        return

    state['data'][step_key] = coerced
    next_step = step_index + 1

    if next_step >= len(ADD_CAR_STEPS):
        # All steps complete — create the listing
        cache.delete(_state_key(chat_id))
        _create_listing(chat_id, state['user_id'], state['data'])
    else:
        state['step'] = next_step
        cache.set(_state_key(chat_id), state, STATE_TTL)
        _, prompt = ADD_CAR_STEPS[next_step]
        _reply(chat_id, f'Step {next_step + 1}/{len(ADD_CAR_STEPS)}: {prompt}')


def _create_listing(chat_id: str, user_id: int, data: dict) -> None:
    try:
        user = User.objects.get(pk=user_id)
        partner = user.partner_profile
    except Exception as exc:
        logger.error('Telegram /addcar: could not load partner for user %s: %s', user_id, exc)
        _reply(chat_id, '❌ Could not find your partner profile. Please contact support.')
        return

    try:
        listing = Listing.objects.create(
            partner=partner,
            make=data['make'],
            model=data['model'],
            year=data['year'],
            color=data['color'],
            transmission=data['transmission'],
            fuel_type=data['fuel_type'],
            seating_capacity=data['seating_capacity'],
            vehicle_style=data['vehicle_style'],
            price_per_day=data['price_per_day'],
            security_deposit=data.get('security_deposit', Decimal('5000')),
            location=data['location'],
            vehicle_description=data.get('vehicle_description') or '',
            is_available=True,
            is_verified=False,
        )
        _reply(chat_id, (
            f'✅ Car listing created successfully!\n\n'
            f'<b>{listing.make} {listing.model} {listing.year}</b>\n'
            f'📍 {listing.location}\n'
            f'💰 {listing.price_per_day} MAD/day\n'
            f'🔑 Deposit: {listing.security_deposit} MAD\n\n'
            f'Listing ID: #{listing.pk}\n'
            f'Status: Pending verification ⏳\n\n'
            f'Your car will be visible once verified by our team.'
        ))
    except Exception as exc:
        logger.error('Telegram /addcar: listing creation failed: %s', exc)
        _reply(chat_id, '❌ Failed to create the listing. Please try again or use the website.')


# ── main dispatcher ────────────────────────────────────────────────────────────

def dispatch_update(update: dict) -> None:
    """Route a Telegram update to the right handler."""
    message = update.get('message') or update.get('edited_message')
    if not message:
        return

    chat_id = str(message.get('chat', {}).get('id', ''))
    text = (message.get('text') or '').strip()

    if not chat_id or not text:
        return

    # Check for active /addcar conversation
    state = cache.get(_state_key(chat_id))
    if state is not None:
        handle_addcar_step(chat_id, text, state)
        return

    # Command routing
    if text.startswith('/start'):
        parts = text.split(maxsplit=1)
        token = parts[1].strip() if len(parts) > 1 else None
        handle_start(chat_id, token)
    elif text == '/addcar':
        handle_addcar_start(chat_id)
    elif text == '/mybookings':
        handle_mybookings(chat_id)
    elif text in ('/help', '/start'):
        handle_help(chat_id)
    else:
        _reply(chat_id, 'Unknown command. Send /help to see available commands.')


# ── Django views ───────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(APIView):
    """Receive updates from Telegram Bot API (POST)."""
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        # Verify secret token to prevent abuse
        secret = getattr(settings, 'TELEGRAM_WEBHOOK_SECRET', '')
        if secret:
            header_secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')
            if header_secret != secret:
                return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            update = request.data if isinstance(request.data, dict) else json.loads(request.body)
            dispatch_update(update)
        except Exception as exc:
            logger.error('Telegram webhook error: %s', exc)

        # Always return 200 so Telegram doesn't retry
        return Response({'ok': True})


class TelegramLinkView(APIView):
    """Generate a one-time Telegram deep link for the authenticated partner."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('partner', 'admin', 'ceo'):
            return Response(
                {'detail': 'Only partner accounts can link Telegram.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = secrets.token_urlsafe(24)
        cache.set(_link_key(token), {'user_id': user.pk}, LINK_TOKEN_TTL)

        bot_username = _get_bot_username()
        deep_link = f'https://t.me/{bot_username}?start={token}'

        return Response({
            'link': deep_link,
            'expires_in': LINK_TOKEN_TTL,
            'connected': bool(user.telegram_chat_id),
        })

    def delete(self, request):
        """Disconnect Telegram from this account."""
        user = request.user
        if user.telegram_chat_id:
            user.telegram_chat_id = None
            user.save(update_fields=['telegram_chat_id'])
        return Response({'detail': 'Telegram disconnected.'})
