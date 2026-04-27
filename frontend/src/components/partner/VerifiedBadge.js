'use client'

import { BadgeCheck } from 'lucide-react'

/**
 * Trust pill shown next to a partner's name when the agency has been
 * verified by the Airbcar team.
 *
 * Variants:
 *   - "pill"  (default) — full text + icon, used on detail pages
 *   - "icon"           — icon-only, used in dense layouts (cards, lists)
 */
export default function VerifiedBadge({ verified, variant = 'pill', className = '' }) {
  if (!verified) return null

  if (variant === 'icon') {
    return (
      <span
        title="Verified agency"
        aria-label="Verified agency"
        className={`inline-flex items-center justify-center text-[var(--color-kc-primary)] ${className}`}
      >
        <BadgeCheck className="w-4 h-4" />
      </span>
    )
  }

  return (
    <span
      title="Verified by the Airbcar team"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-kc-primary)]/10 text-[var(--color-kc-primary)] border border-[var(--color-kc-primary)]/20 ${className}`}
    >
      <BadgeCheck className="w-3.5 h-3.5" />
      Verified
    </span>
  )
}
