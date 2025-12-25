'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { APP_NAME } from '@/constants'
import { SelectField } from '@/components/ui/select-field'

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
          { label: 'Sign Up', href: '/auth?mode=signup' }
        )
      }
    }

    return items
  }, [user, loading, isPartner, isAdmin])

  const headerClassName = `fixed inset-x-0 top-0 z-40
    transition-all duration-500 ease-in-out
    ${isScrolled 
      ? 'bg-[#0B0F19]/40 backdrop-blur-xl border-b border-white/5 py-2 shadow-lg shadow-black/10' 
      : 'bg-transparent py-6'}`
  
  const navTextClassName = isScrolled ? 'text-white' : 'text-white drop-shadow-md'
  
  const buttonClassName = isScrolled 
    ? 'bg-white/5 hover:bg-orange-600 text-white border-transparent shadow-sm' 
    : 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border-white/10 shadow-lg shadow-black/5'

  return (
    <>
      <header className={headerClassName}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Menu Button */}
            <div className="flex items-center justify-start">
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
                className={`group inline-flex items-center justify-center rounded-full px-5 py-2.5 transition-all duration-300 border ${buttonClassName}`}
              >
                <div className="flex flex-col space-y-1.5 mr-3 group-hover:space-y-0 relative h-3 w-5 justify-center">
                  <span className="w-5 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:rotate-45 group-hover:absolute"></span>
                  <span className="w-3 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:w-5 group-hover:-rotate-45 group-hover:absolute"></span>
                </div>
                <span className="text-sm font-bold tracking-wide uppercase">Menu</span>
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center">
              <Link href="/" className="select-none group flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${isScrolled ? 'bg-orange-600 shadow-orange-900/20' : 'bg-white text-black shadow-black/20'}`}>
                  <span className={`font-bold text-xl ${isScrolled ? 'text-white' : 'text-black'}`}>A</span>
                </div>
                <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${navTextClassName}`}>
                  {APP_NAME}
                </span>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Link
                href="/search"
                aria-label="Search"
                className={`group inline-flex items-center justify-center rounded-full p-3 transition-all duration-300 border ${buttonClassName}`}
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {!loading && !user && (
                <>
                  <Link
                    href="/auth?mode=signin"
                    className={`hidden md:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 border ${buttonClassName}`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className={`hidden md:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 bg-orange-600 text-white border border-transparent hover:bg-orange-700 shadow-lg shadow-orange-900/20`}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeMenu} />

          <div
            ref={menuPanelRef}
            className="airbcar-menu-scroll relative h-full w-full sm:w-[480px] max-w-md bg-[#0B0F19] shadow-2xl px-8 pt-8 pb-10 overflow-y-auto overscroll-contain
              animate-in slide-in-from-left duration-300 border-r border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
               <span className="text-sm font-medium text-white/40 uppercase tracking-widest">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center -mt-10" aria-label="Site">
                <div className="space-y-6">
                  {overlayItems.map((item) => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      onClick={closeMenu}
                      className="group flex items-center text-4xl sm:text-5xl font-bold text-white hover:text-orange-500 transition-colors duration-300"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-2">{item.label}</span>
                    </Link>
                  ))}

                  {user && !loading && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="group flex items-center text-4xl sm:text-5xl font-bold text-white hover:text-orange-500 transition-colors duration-300 text-left w-full"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-2">Sign Out</span>
                    </button>
                  )}
                </div>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2">
                      Language
                    </label>
                      <SelectField
                        value={language}
                        onChange={(e) => handleLanguageChange(e)}
                        options={[
                          { value: 'ar', label: 'Arabic' },
                          { value: 'en', label: 'English' },
                          { value: 'fr', label: 'French' },
                        ]}
                        className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                      />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2">
                      Currency
                    </label>
                      <SelectField
                        value={currency}
                        onChange={(e) => handleCurrencyChange(e)}
                        options={[
                          { value: 'USD', label: 'USD ($)' },
                          { value: 'EUR', label: 'EUR (€)' },
                          { value: 'MAD', label: 'MAD (DH)' },
                        ]}
                        className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                      />
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-white/20">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
