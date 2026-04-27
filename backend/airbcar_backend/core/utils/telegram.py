"""
Telegram integration helpers.
"""
from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


def _is_enabled() -> bool:
    return bool(
        getattr(settings, 'TELEGRAM_NOTIFICATIONS_ENABLED', False)
        and getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    )


def send_telegram_message(
    chat_id: str,
    text: str,
    parse_mode: str | None = None,
    reply_markup: dict | None = None,
) -> bool:
    """Send a Telegram message using the Bot API.

    `reply_markup` may be any Telegram reply_markup object (inline_keyboard,
    keyboard, etc.). It will be JSON-encoded for the form post.

    Returns True on success, False otherwise.
    """
    if not chat_id or not text or not _is_enabled():
        return False

    token = settings.TELEGRAM_BOT_TOKEN
    api_url = f"https://api.telegram.org/bot{token}/sendMessage"

    payload = {
        'chat_id': str(chat_id),
        'text': text,
        'disable_web_page_preview': True,
    }
    if parse_mode:
        payload['parse_mode'] = parse_mode
    if reply_markup is not None:
        payload['reply_markup'] = json.dumps(reply_markup)

    body = urllib.parse.urlencode(payload).encode('utf-8')
    request = urllib.request.Request(api_url, data=body, method='POST')

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode('utf-8', errors='ignore')
            data = json.loads(raw) if raw else {}
            return bool(data.get('ok'))
    except urllib.error.HTTPError as exc:
        logger.warning('Telegram HTTP error: %s', exc)
    except urllib.error.URLError as exc:
        logger.warning('Telegram URL error: %s', exc)
    except Exception as exc:
        logger.warning('Telegram send failed: %s', exc)

    return False


def answer_callback_query(callback_query_id: str, text: str = '', show_alert: bool = False) -> bool:
    """Acknowledge an inline-button press. Required by Telegram so the
    spinning loader on the user's button stops."""
    if not callback_query_id or not _is_enabled():
        return False

    token = settings.TELEGRAM_BOT_TOKEN
    api_url = f"https://api.telegram.org/bot{token}/answerCallbackQuery"

    payload = {'callback_query_id': str(callback_query_id)}
    if text:
        payload['text'] = text
    if show_alert:
        payload['show_alert'] = 'true'

    body = urllib.parse.urlencode(payload).encode('utf-8')
    request = urllib.request.Request(api_url, data=body, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode('utf-8', errors='ignore')
            data = json.loads(raw) if raw else {}
            return bool(data.get('ok'))
    except Exception as exc:
        logger.warning('Telegram callback ack failed: %s', exc)
    return False


def edit_message_text(chat_id: str, message_id: int, text: str, parse_mode: str | None = None) -> bool:
    """Edit a previously-sent message (used after accept/reject to remove
    the inline buttons and show the resolved state)."""
    if not chat_id or not message_id or not _is_enabled():
        return False

    token = settings.TELEGRAM_BOT_TOKEN
    api_url = f"https://api.telegram.org/bot{token}/editMessageText"

    payload = {
        'chat_id': str(chat_id),
        'message_id': str(message_id),
        'text': text,
        'disable_web_page_preview': True,
    }
    if parse_mode:
        payload['parse_mode'] = parse_mode

    body = urllib.parse.urlencode(payload).encode('utf-8')
    request = urllib.request.Request(api_url, data=body, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode('utf-8', errors='ignore')
            data = json.loads(raw) if raw else {}
            return bool(data.get('ok'))
    except Exception as exc:
        logger.warning('Telegram edit failed: %s', exc)
    return False


def notify_user_telegram(user, title: str, message: str) -> bool:
    """Send notification text to a user's Telegram chat when available.

    Fallbacks:
    1) user.telegram_chat_id (if your user model has this attribute)
    2) TELEGRAM_DEFAULT_CHAT_ID from settings
    """
    chat_id = getattr(user, 'telegram_chat_id', None)
    if not chat_id:
        chat_id = getattr(settings, 'TELEGRAM_DEFAULT_CHAT_ID', '')

    if not chat_id:
        return False

    text = f"{title}\n{message}"
    return send_telegram_message(str(chat_id), text)
