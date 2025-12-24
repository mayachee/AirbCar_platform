'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { APP_NAME } from '@/constants'

// Navigation items
const navigationItems = [
  { label: 'Search', href: '/search' },
  { label: 'Be Partner', href: '/partner' },
  { label: 'Mission', href: '/mission' }
]

export default function Header() {
  const { user, loading, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const [currency, setCurrency] = useState('MAD')
  const [isScrolled, setIsScrolled] = useState(false)

  const pathname = usePathname()

  const isPartner = !!user && (user.is_partner === true || user.role === 'partner')
  const isAdmin = !!user && (
    user.email === 'admin@airbcar.com' ||
    user.role === 'admin' ||
    user.is_admin === true
  )

  const menuButtonRef = useRef(null)
  const menuPanelRef = useRef(null)

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  // Close menus on route change
  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  // Glass effect when user scrolls
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Restore preferences
  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('airbcar_language')
      const storedCurrency = localStorage.getItem('airbcar_currency')
      if (storedLanguage) setLanguage(storedLanguage)
      if (storedCurrency) setCurrency(storedCurrency)
    } catch {
      // ignore storage errors
    }
  }, [])

  const handleLanguageChange = (event) => {
    const value = event.target.value
    setLanguage(value)
    try {
      localStorage.setItem('airbcar_language', value)
    } catch {
      // ignore storage errors
    }
  }

  const handleCurrencyChange = (event) => {
    const value = event.target.value
    setCurrency(value)
    try {
      localStorage.setItem('airbcar_currency', value)
    } catch {
      // ignore storage errors
    }
  }

  // Close menus on ESC
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeMenu])

  // Click outside overlay to close
  useEffect(() => {
    if (!isMenuOpen) return

    const onPointerDown = (event) => {
      const target = event.target
      if (!(target instanceof Node)) return

      const clickedPanel = menuPanelRef.current?.contains(target)
      const clickedButton = menuButtonRef.current?.contains(target)
      if (!clickedPanel && !clickedButton) closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isMenuOpen, closeMenu])

  const handleSignOut = () => {
    localStorage.removeItem('isPartnerUser')
    logout()
    closeMenu()
  }

  const overlayItems = useMemo(() => {
    const items = [...navigationItems]

    if (!loading) {
      if (user) {
        items.push(
          { label: 'Account', href: '/account' },
          { label: 'My Bookings', href: '/account?tab=bookings' }
        )

        if (isPartner) items.push({ label: 'Partner Dashboard', href: '/partner/dashboard' })
        if (isAdmin) items.push({ label: 'Admin Dashboard', href: '/admin/dashboard' })
      } else {
        items.push(
          { label: 'Sign In', href: '/auth?mode=signin' },
          { label: 'Sign Up', href: '/auth?mode=signin' }
        )
      }
    }

    return items
  }, [user, loading, isPartner, isAdmin])

  const headerClassName = `fixed inset-x-0 top-0 z-40
    transition-all duration-300 ease-out
    ${isScrolled ? 'bg-transparent' : 'bg-transparent'}`
  const navTextClassName = 'text-gray-900 mix-blend-difference'
  const navHoverClassName = 'hover:bg-white/10'

  return (
    <>
      <header className={headerClassName}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            <div className="flex items-center justify-start">
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
                className={`inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 active:scale-[0.98] ${navTextClassName} ${navHoverClassName}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                MENU
              </button>
            </div>

            <div className="flex items-center justify-center">
              <Link href="/" className="select-none">
                <span className={`text-xl font-extrabold tracking-tight transition-transform duration-200 hover:scale-[1.02] ${navTextClassName}`}>{APP_NAME}</span>
              </Link>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/search"
                aria-label="Search"
                className={`inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 active:scale-[0.98] ${navTextClassName} ${navHoverClassName}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            ref={menuPanelRef}
            className="airbcar-menu-scroll relative h-full w-[86vw] max-w-md bg-gray-900 shadow-2xl px-10 pt-10 pb-10 overflow-y-auto overscroll-contain
              animate-in slide-in-from-left duration-300"
          >
            <div className="min-h-full flex flex-col">
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="inline-flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <nav className="mt-8" aria-label="Site">
                <div className="space-y-7">
                  {overlayItems.map((item) => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      onClick={closeMenu}
                      className="block -mb-2 text-5xl sm:text-6xl leading-[1.02] font-semibold text-white hover:text-white/80 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {user && !loading && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block text-5xl sm:text-6xl leading-[1.02] font-semibold text-white hover:text-white/80 transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </nav>

              <div className="mt-16 pt-8 border-t border-white/10">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-white/60 mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="w-full rounded-2xl bg-white/10 text-white px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                    >
                      <option className="text-gray-900" value="ar">Arabic</option>
                      <option className="text-gray-900" value="en">English</option>
                      <option className="text-gray-900" value="fr">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-white/60 mb-2">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={handleCurrencyChange}
                      className="w-full rounded-2xl bg-white/10 text-white px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                    >
                      <option className="text-gray-900" value="USD">Dollar (USD)</option>
                      <option className="text-gray-900" value="EUR">Euro (EUR)</option>
                      <option className="text-gray-900" value="MAD">Dirham (MAD)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
