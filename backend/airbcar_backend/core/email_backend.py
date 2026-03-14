"""
Custom email backend using Resend HTTP API.
Render free tier blocks all outbound SMTP ports (25, 465, 587).
Resend provides a free HTTP-based email API (100 emails/day).

Setup:
1. Sign up at https://resend.com (free)
2. Verify your domain or use the onboarding test domain
3. Get your API key from https://resend.com/api-keys
4. Set RESEND_API_KEY env var on Render
"""
import json
import os
import urllib.request
import urllib.error
import urllib.parse
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    """Django email backend that sends via Resend HTTP API."""

    api_url = 'https://api.resend.com/emails'

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'RESEND_API_KEY', '')

    def send_messages(self, email_messages):
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError(
                    'RESEND_API_KEY is not set. '
                    'Sign up at https://resend.com and set the env var.'
                )
            return 0

        sent = 0
        for message in email_messages:
            try:
                self._send(message)
                sent += 1
            except Exception as e:
                if not self.fail_silently:
                    raise
        return sent

    def _send(self, message):
        # Use Resend's free test sender if no verified domain
        from_email = message.from_email
        resend_from = getattr(settings, 'RESEND_FROM_EMAIL', '') or os.environ.get('RESEND_FROM_EMAIL', '')
        if resend_from:
            from_email = resend_from
        elif not from_email or '@resend.dev' not in from_email:
            from_email = 'AirbCar <onboarding@resend.dev>'
        
        payload = {
            'from': from_email,
            'to': list(message.to),
            'subject': message.subject,
            'text': message.body,
        }

        # Add CC/BCC if present
        if message.cc:
            payload['cc'] = list(message.cc)
        if message.bcc:
            payload['bcc'] = list(message.bcc)

        # Add HTML content if present
        if hasattr(message, 'alternatives'):
            for content, mimetype in message.alternatives:
                if mimetype == 'text/html':
                    payload['html'] = content
                    break

        # Add reply-to if present
        if message.reply_to:
            payload['reply_to'] = message.reply_to[0]

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            self.api_url,
            data=data,
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            timeout = getattr(settings, 'EMAIL_TIMEOUT', 15) or 15
            resp = urllib.request.urlopen(req, timeout=timeout)
            resp_data = json.loads(resp.read().decode())
            return resp_data
        except urllib.error.HTTPError as e:
            body = e.read().decode() if e.fp else str(e)
            raise RuntimeError(f'Resend API error ({e.code}): {body}') from e
        except urllib.error.URLError as e:
            raise RuntimeError(f'Resend API connection error: {e.reason}') from e
