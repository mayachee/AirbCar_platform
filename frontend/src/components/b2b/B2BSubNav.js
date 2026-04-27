'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { LayoutGrid, Handshake, Search, ListChecks, Map } from 'lucide-react'

/**
 * Top tab strip shared across all B2B Car Sharing pages
 * (V1 Marketplace · V2 Deals · V3 Browse · V4 My Requests · V5 Map).
 */
const TABS = [
  { href: '/partner/b2b', icon: LayoutGrid, label: 'Marketplace', match: (p) => /\/partner\/b2b\/?$/.test(p) },
  { href: '/partner/b2b/deals', icon: Handshake, label: 'Deals', match: (p) => p.includes('/partner/b2b/deals') },
  { href: '/partner/b2b/browse', icon: Search, label: 'Browse', match: (p) => p.includes('/partner/b2b/browse') },
  { href: '/partner/b2b/requests', icon: ListChecks, label: 'My Requests', match: (p) => p.includes('/partner/b2b/requests') },
  { href: '/partner/b2b/map', icon: Map, label: 'Fleet Map', match: (p) => p.includes('/partner/b2b/map') },
]

export default function B2BSubNav() {
  const pathname = usePathname() || ''

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map(({ href, icon: Icon, label, match }) => {
            const active = match(pathname)
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    active
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
