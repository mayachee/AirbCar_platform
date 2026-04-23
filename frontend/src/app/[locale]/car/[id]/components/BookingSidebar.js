'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { calculateTotalPrice } from '../utils/pricing'
import { useCurrency } from '@/contexts/CurrencyContext'
import { Headphones, ChevronRight, Info } from 'lucide-react'
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
  const params = useParams()
  const locale = params?.locale || 'en'

  if (!vehicle) {
    return null
  }

  const price = vehicle.price || vehicle.price_per_day || vehicle.dailyRate || 0
  const securityDeposit = Number(vehicle.security_deposit ?? vehicle.securityDeposit ?? 5000)
  const duration = searchDetails?.duration || 1
  const { basePrice, serviceFee, total } = calculateTotalPrice(price, duration, securityDeposit)

  const pickupDisplay = formatDateDisplay(selectedDates?.pickup)
  const returnDisplay = formatDateDisplay(selectedDates?.return)

  const partner = vehicle?.partner
  const partnerSlug = partner?.slug || partner?.id
  const partnerHref = partnerSlug ? `/${locale}/partner/${partnerSlug}` : null
  const hostFirstName =
    partner?.user?.first_name ||
    (partner?.business_name ? partner.business_name.split(' ')[0] : null) ||
    'Host'

  return (
    <div className="sticky top-24 space-y-5">
      {/* Booking Card */}
      <div className="relative bg-white rounded-3xl border border-[var(--surface-3)] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 md:p-7 overflow-hidden">
        <div className="absolute top-4 right-4">
          <span className="bg-orange-100 text-[var(--color-kc-primary)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {t('recommended')}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-7">
          <span className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">
            {formatPrice(price)}
          </span>
          <span className="text-base font-bold text-[var(--text-secondary)]">/ {t('day')}</span>
        </div>

        <div
          role="group"
          className="rounded-2xl border border-[var(--surface-3)] overflow-hidden mb-5"
        >
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={onChangeDates}
              className="text-left p-4 border-r border-[var(--surface-3)] hover:bg-[var(--surface-1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-0"
            >
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                {t('pickup')}
              </p>
              <p className="font-bold text-[var(--text-primary)]">
                {pickupDisplay || t('select_date')}
              </p>
            </button>
            <button
              type="button"
              onClick={onChangeDates}
              className="text-left p-4 hover:bg-[var(--surface-1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-0"
            >
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                {t('return')}
              </p>
              <p className="font-bold text-[var(--text-primary)]">
                {returnDisplay || t('select_date')}
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-5 border-t border-[var(--surface-3)] pt-5">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              {formatPrice(price)} × {duration} {duration === 1 ? t('day') : t('days')}
            </span>
            <span className="font-bold text-[var(--text-primary)]">{formatPrice(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{t('service_fee')}</span>
            <span className={`font-bold ${serviceFee === 0 ? 'text-green-600' : 'text-[var(--text-primary)]'}`}>
              {serviceFee === 0 ? t('free').toUpperCase() : formatPrice(serviceFee)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[var(--surface-3)]">
            <span className="text-lg font-bold text-[var(--text-primary)]">{t('total')}</span>
            <span className="text-lg font-black text-[var(--color-kc-primary)]">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Security Deposit Callout */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-5">
          <div className="flex items-center gap-2 text-orange-700 mb-1">
            <Info className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {t('security_deposit')}
            </span>
          </div>
          <p className="text-sm font-semibold text-orange-800">
            {formatPrice(securityDeposit)}{' '}
            <span className="font-normal opacity-75">({t('refundable')})</span>
          </p>
          <p className="text-[10px] text-orange-700/70 mt-1 italic">
            {t('deposit_callout_note')}
          </p>
        </div>

        <button
          onClick={onBookNow}
          className="w-full bg-[var(--color-kc-primary)] text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:ring-offset-2"
        >
          {t('book_now')}
        </button>

        <p className="text-center text-[10px] text-[var(--text-secondary)] mt-3 font-medium uppercase tracking-widest">
          {t('not_charged_yet')}
        </p>
      </div>

      {/* Contact Host Card */}
      {partnerHref && (
        <Link
          href={partnerHref}
          className="group flex items-center justify-between gap-3 bg-[var(--surface-1)] p-4 md:p-5 rounded-2xl border border-[var(--surface-3)] hover:border-[var(--color-kc-primary)]/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
              <Headphones className="w-5 h-5 text-[var(--color-kc-primary)] transition-transform group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {t('need_help')}
              </p>
              <p className="font-bold text-[var(--text-primary)] text-sm truncate">
                {t('chat_with_host', { name: hostFirstName })}
              </p>
            </div>
          </div>
          <span className="w-9 h-9 rounded-full border border-[var(--surface-3)] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[var(--color-kc-primary)] group-hover:border-[var(--color-kc-primary)] text-[var(--text-secondary)] group-hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  )
}
