"""Persistence helpers for driver license verification results."""

from __future__ import annotations

from typing import Any, Dict, Optional
import logging

from core.models import LicenseVerificationRecord


logger = logging.getLogger(__name__)


def store_license_verification_result(
    *,
    user,
    verification: Dict[str, Any],
    context: str,
    booking=None,
    front_document_url: Optional[str] = None,
    back_document_url: Optional[str] = None,
) -> LicenseVerificationRecord:
    """Store one verification result row for auditing and support workflows."""
    if verification is None:
        verification = {}

    date_check = verification.get('date_check') or {}

    try:
        return LicenseVerificationRecord.objects.create(
            user=user,
            booking=booking,
            context=context,
            is_valid=bool(verification.get('is_valid', False)),
            score=verification.get('score'),
            detected_country=(verification.get('detected_country') or 'UNKNOWN')[:10],
            issue_date=LicenseVerificationRecord.parse_iso_date(date_check.get('issue_date')),
            expiry_date=LicenseVerificationRecord.parse_iso_date(date_check.get('expiry_date')),
            is_expired=bool(date_check.get('is_expired', False)),
            front_document_url=front_document_url,
            back_document_url=back_document_url,
            errors=list(verification.get('errors', []) or []),
            warnings=list(verification.get('warnings', []) or []),
            payload=verification,
        )
    except Exception:
        # Audit logging must never block profile/booking document flows.
        logger.exception('Failed to persist license verification record', extra={'context': context})
        return None
