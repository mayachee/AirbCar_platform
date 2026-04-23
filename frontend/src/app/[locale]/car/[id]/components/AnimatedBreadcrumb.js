'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function AnimatedBreadcrumb({ vehicleName }) {
  const t = useTranslations('car_details')
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-1.5 text-[var(--text-secondary)]">
        <li>
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            {t('home')}
          </Link>
        </li>
        <li>
          <ChevronRight className="w-3.5 h-3.5" />
        </li>
        <li>
          <Link href="/search" className="hover:text-[var(--text-primary)] transition-colors">
            {t('search')}
          </Link>
        </li>
        <li>
          <ChevronRight className="w-3.5 h-3.5" />
        </li>
        <li
          className="text-[var(--text-primary)] truncate max-w-[180px] sm:max-w-md"
          title={vehicleName}
        >
          {vehicleName || t('car_details')}
        </li>
      </ol>
    </nav>
  )
}
