'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNotifications } from '@/contexts/NotificationContext'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { APP_NAME } from '@/constants'
import { SelectField } from '@/components/ui/select-field'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'

// Navigation items
const navigationItemKeys = [
  { key: 'nav_search', href: '/search' },
  { key: 'nav_mission', href: '/mission' }
]

export default function Header({ theme = 'dark' }) {
  const { user, loading, logout } = useAuth()
  const { currency, setCurrency, currencies } = useCurrency() // Get currencies from context
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTranslations('header')
  const tc = useTranslations('common')

  const pathname = usePathname()

  const isPartner = !!user && (
    user.is_partner === true || 
    user.is_partner === 'true' || 
    user.is_partner === 1 || 
    (user.role && user.role.toLowerCase() === 'partner')
  )
  
  // Debug partner status
  useEffect(() => {
    if (user) {
      console.log('👤 Header auth state:', { 
        id: user.id, 
        role: user.role, 
        is_partner: user.is_partner, 
        computedIsPartner: isPartner 
      })
    }
  }, [user, isPartner])

  const isAdmin = !!user && (
    user.email === 'admin@airbcar.com' ||
    user.email === 'ayacheyassine2000@gmail.com' ||
    (user.role && user.role.toLowerCase() === 'admin') ||
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

  const handleCurrencyChange = (event) => {
    const value = event.target.value
    setCurrency(value)
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
      
      // Check for clicks inside Radix Select content (which renders in a portal)
      const clickedSelectContent = target.closest('[role="listbox"]') || target.closest('[data-radix-popper-content-wrapper]') || target.closest('.ignore-outside-click')
      
      if (!clickedPanel && !clickedButton && !clickedSelectContent) closeMenu()
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
    const items = [{ label: t('nav_search'), href: '/search' }]

    if (!loading) {
      if (user && isPartner) {
        items.push({ label: t('nav_partner_dashboard'), href: '/partner/dashboard', type: 'partner' })
      } else {
        items.push({ label: t('nav_be_partner'), href: '/partner' })
      }
    } else {
      items.push({ label: t('nav_be_partner'), href: '/partner' })
    }

    items.push({ label: t('nav_mission'), href: '/mission' })

    if (!loading) {
      if (user) {
        items.push(
          { label: t('nav_account'), href: '/account' },
          { label: t('nav_my_bookings'), href: '/account?tab=bookings' }
        )

        if (isAdmin) items.push({ label: 'Admin Dashboard', href: '/admin/dashboard' })
      } else {
        items.push(
          { label: tc('sign_in'), href: '/auth?mode=signin' },
          { label: tc('sign_up'), href: '/auth?mode=signup' }
        )
      }
    }

    return items
  }, [user, loading, isPartner, isAdmin, t, tc])

  const headerClassName = `fixed inset-x-0 top-0 z-40
    transition-all duration-500 ease-in-out
    ${isScrolled 
      ? 'py-2 shadow-lg shadow-black/0' 
      : 'bg-transparent py-6'}`
  
  const isLight = theme === 'light'

  const navTextClassName = isScrolled 
    ? (isLight ? 'text-gray-900' : 'text-white') 
    : (isLight ? 'text-gray-900' : 'text-white drop-shadow-md')
  
  const buttonClassName = isScrolled 
    ? (isLight ? 'bg-white/80 text-gray-900 border-gray-200 shadow-sm' : 'bg-[#0B0F19]/80 text-white border-transparent shadow-sm')
    : (isLight ? 'bg-white/50 hover:bg-white/80 text-gray-900 backdrop-blur-md border-gray-200 shadow-lg shadow-black/5' : 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border-white/10 shadow-lg shadow-black/5')

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
                className={`group inline-flex items-center justify-center rounded-full px-2.5 sm:px-5 py-2 sm:py-2.5 transition-all duration-300 border ${buttonClassName}`}
              >
                <div className="flex flex-col space-y-1.5 sm:mr-3 group-hover:space-y-0 relative h-3 w-5 justify-center">
                  <span className="w-5 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:rotate-45 group-hover:absolute"></span>
                  <span className="w-3 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:w-5 group-hover:-rotate-45 group-hover:absolute"></span>
                </div>
                <span className="hidden sm:inline text-sm font-bold tracking-wide uppercase">{t('menu')}</span>
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center">
              <Link href="/" className="select-none group flex items-center space-x-3">
                <span className={`text-3xl font-black text-orange-600 tracking-tighter transition-all duration-300 ${navTextClassName} drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]`}>
                  {APP_NAME}
                </span>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center justify-end space-x-1.5 sm:space-x-3">

              <Link
                href="/search"
                aria-label="Search"
                className={`group ${(!loading && !user) ? 'hidden md:inline-flex' : 'inline-flex'} items-center justify-center rounded-full p-2 sm:p-3 transition-all duration-300 border ${buttonClassName}`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Notification Bell */}
              {!loading && user && (
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    aria-label="Notifications"
                    className={`group inline-flex items-center justify-center rounded-full p-2 sm:p-3 transition-all duration-300 border ${buttonClassName}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      <div className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-96 max-h-[70vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('notifications_title')}</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button onClick={() => markAllAsRead()} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                {t('notifications_mark_all_read')}
                              </button>
                            )}
                            <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-80 divide-y divide-gray-100 dark:divide-gray-800">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications_empty')}</p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => { if (!n.is_read) markAsRead(n.id); setIsNotifOpen(false); }}
                                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                  !n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{(() => { try { const d = Math.floor((Date.now() - new Date(n.created_at)) / 60000); return d < 1 ? t('notifications_just_now') : d < 60 ? d + 'm ago' : d < 1440 ? Math.floor(d/60) + 'h ago' : Math.floor(d/1440) + 'd ago'; } catch { return ''; } })()}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!loading && isPartner && (
                <Link
                  href="/partner/dashboard"
                  className={`hidden md:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 bg-orange-600 text-white border border-transparent hover:bg-orange-700 shadow-lg shadow-orange-900/20`}
                >
                  {t('nav_partner_dashboard')}
                </Link>
              )}

              {!loading && !user && (
                <>
                  <Link
                    href="/auth?mode=signin"
                    aria-label={tc('sign_in')}
                    className={`md:hidden group inline-flex items-center justify-center rounded-full p-2 sm:p-3 transition-all duration-300 border ${buttonClassName}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <Link
                    href="/auth?mode=signin"
                    className={`hidden md:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 border ${buttonClassName}`}
                  >
                    {tc('sign_in')}
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className={`hidden md:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 bg-orange-600 text-white border border-transparent hover:bg-orange-700 shadow-lg shadow-orange-900/20`}
                  >
                    {tc('sign_up')}
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
            className="airbcar-menu-scroll relative h-full w-full sm:w-[480px] max-w-md bg-[#0B0F19] shadow-2xl px-6 sm:px-8 pt-8 pb-10 overflow-y-auto overscroll-contain
              animate-in slide-in-from-left duration-300 border-r border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
               <span className="text-sm font-medium text-white/40 uppercase tracking-widest">{t('menu')}</span>
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
                      className={`group flex items-center text-3xl sm:text-5xl font-bold transition-all duration-300 ${
                        item.type === 'partner' 
                          ? 'text-orange-500 hover:text-white' 
                          : 'text-white hover:text-orange-500'
                      }`}
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-2 flex items-center gap-4">
                        {item.label}
                        {item.type === 'partner' && (
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </span>
                    </Link>
                  ))}

                  {user && !loading && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="group flex items-center text-3xl sm:text-5xl font-bold text-white hover:text-orange-500 transition-colors duration-300 text-left w-full"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-2">{tc('sign_out')}</span>
                    </button>
                  )}
                </div>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2">
                      {t('settings_language')}
                    </label>
                    <LanguageSwitcher />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2">
                      {t('settings_currency')}
                    </label>
                      <SelectField
                        value={currency}
                        onChange={(e) => handleCurrencyChange(e)}
                        contentProps={{ className: 'z-[100] ignore-outside-click', position: 'popper' }}
                        options={currencies.map(c => ({ value: c.code, label: c.label }))}
                        className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                      />
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-white/20">© {new Date().getFullYear()} {APP_NAME}. {tc('all_rights_reserved')}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
