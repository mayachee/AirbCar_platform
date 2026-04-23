'use client'

import { useTranslations } from 'next-intl'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ShieldCheck } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'

function formatDateDisplay(value) {
  if (!value) return null
  try {
    const d = parseISO(value)
    if (!isValid(d)) return value
    return format(d, 'MMM d, yyyy')
  } catch {
    return value
  }
}

export default function BookingSidebar({ vehicle, searchDetails, selectedDates, onBookNow, onChangeDates }) {
  const { formatPrice } = useCurrency()
  const t = useTranslations('car_details')

  if (!vehicle) {
    return null
  }

  const price = vehicle.price || vehicle.price_per_day || vehicle.dailyRate || 0
  const securityDeposit = Number(vehicle.security_deposit ?? vehicle.securityDeposit ?? 5000)
  const duration = searchDetails?.duration || 1
  const { basePrice, serviceFee, total } = calculateTotalPrice(price, duration, securityDeposit)

  const pickupDisplay = formatDateDisplay(selectedDates?.pickup)
  const returnDisplay = formatDateDisplay(selectedDates?.return)

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-2xl border border-[var(--surface-3)] shadow-[0_6px_16px_rgba(0,0,0,0.06)] p-6">
        <div className="flex items-baseline gap-1.5 mb-6">
          <span className="text-2xl font-semibold text-[var(--text-primary)]">
            {formatPrice(price)}
          </span>
          <span className="text-[var(--text-secondary)]">/ {t('day')}</span>
        </div>

        <div
          role="group"
          className="rounded-xl border border-[var(--surface-3)] overflow-hidden mb-4"
        >
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={onChangeDates}
              className="text-left p-3 border-r border-[var(--surface-3)] hover:bg-[var(--surface-1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-0"
            >
              <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {t('pickup')}
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-0.5">
                {pickupDisplay || t('select_date')}
              </p>
            </button>
            <button
              type="button"
              onClick={onChangeDates}
              className="text-left p-3 hover:bg-[var(--surface-1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-0"
            >
              <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {t('return')}
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-0.5">
                {returnDisplay || t('select_date')}
              </p>
            </button>
          </div>
        </div>

        <button
          onClick={onBookNow}
          className="w-full bg-[var(--color-kc-primary)] text-white py-3 rounded-xl font-semibold text-base hover:brightness-95 active:brightness-90 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-2"
        >
          {t('book_now')}
        </button>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-3">
          {t('not_charged_yet')}
        </p>

        <div className="mt-6 pt-6 border-t border-[var(--surface-3)] space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              {formatPrice(price)} × {duration} {duration === 1 ? t('day') : t('days')}
            </span>
            <span className="text-[var(--text-primary)]">{formatPrice(basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">{t('service_fee')}</span>
            <span className="text-[var(--text-primary)]">
              {serviceFee === 0 ? t('free') : formatPrice(serviceFee)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">{t('security_deposit')}</span>
            <span className="text-[var(--text-primary)]">{formatPrice(securityDeposit)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[var(--surface-3)]">
            <span className="font-semibold text-[var(--text-primary)]">{t('total')}</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
          <span>{t('deposit_refundable_note')}</span>
        </div>
      </div>
    </div>
  )
}
