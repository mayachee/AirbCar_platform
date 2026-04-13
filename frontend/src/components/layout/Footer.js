'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APP_NAME } from '@/constants'
import { apiClient } from '@/lib/api/client'
import { organizationConfig } from '@/lib/seoConfig'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const tc = useTranslations('common')
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const footerSections = [
    {
      title: t('section_company'),
      links: [
        { label: t('link_about_us'), href: '/mission#about-us', prefetch: true },
        { label: t('link_mission'), href: '/mission', prefetch: true },
        { label: t('link_the_impact'), href: '/mission#impact', prefetch: true },
      ]
    },
    {
      title: t('section_services'),
      links: [
        { label: t('link_car_rental'), href: '/search', prefetch: true },
        { label: t('link_partner_program'), href: '/partner', prefetch: true },
      ]
    },
    {
      title: t('section_support'),
      links: [
        { label: t('link_help_center'), href: '/help', prefetch: false },
        { label: t('link_contact_us'), href: '/contact', prefetch: false },
        { label: t('link_safety'), href: '/safety', prefetch: false },
      ]
    }
  ]

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError(t('newsletter_error_empty'))
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('newsletter_error_invalid'))
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess(false)
    try {
      await apiClient.post('/api/newsletter/subscribe/', { email }, { skipAuth: true })
      setSuccess(true)
      setEmail('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      let errorMessage = t('newsletter_error_generic')
      if (error?.message) errorMessage = error.message
      else if (error?.data?.error) errorMessage = error.data.error
      else if (error?.data?.detail) errorMessage = error.data.detail
      else if (typeof error === 'string') errorMessage = error
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const socialLinks = [
    {
      name: 'Facebook',
      href: organizationConfig.socialMedia.facebook,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: organizationConfig.socialMedia.instagram,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: organizationConfig.socialMedia.youtube,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: organizationConfig.socialMedia.linkedin,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    }
  ]

  return (
    <footer className="relative bg-[var(--surface-container-high)] text-[var(--text-primary)] overflow-hidden">
      {/* Ambient glow */}
      <div className="glow-orange absolute -top-[200px] -left-[200px] w-[800px] h-[800px] opacity-10 pointer-events-none" />
      <div className="glow-blue absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] opacity-8 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24 mb-16 sm:mb-24">
          {/* Brand Section */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <h2 className="headline-lg text-[var(--text-primary)]">
              {t('heading')}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-md text-lg font-light">
              {t('description')}
            </p>

            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="relative max-w-md pt-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t('newsletter_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--surface-container-lowest)] rounded-3xl py-3.5 pl-6 pr-36 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40 shadow-ambient-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 btn-brand rounded-[calc(var(--radius)-0.125rem)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '...' : t('newsletter_subscribe')}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-[var(--color-kc-error)] pl-4 animate-in fade-in slide-in-from-top-1">{error}</p>}
              {success && <p className="mt-2 text-xs text-[var(--color-kc-tertiary)] pl-4 animate-in fade-in slide-in-from-top-1">{t('newsletter_success')}</p>}
            </form>

            <div className="pt-6 flex gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--color-orange-500)] transition-colors transform hover:scale-110 duration-200"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 pt-2">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="label-sm text-[var(--text-primary)] mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={link.prefetch}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--color-orange-500)] transition-colors block hover:translate-x-1 duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="label-sm text-[var(--text-primary)] mb-6">
                {t('section_contact')}
              </h3>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                <li>
                  <a href="mailto:hello@airbcar.com" className="hover:text-[var(--color-orange-500)] transition-colors">
                    hello@airbcar.com
                  </a>
                </li>
                <li>Tetouan, Morocco</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider — tonal shift, not a line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-medium)] to-transparent mb-8 sm:mb-12" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[var(--text-muted)] mb-12 sm:mb-20">
          <p className="text-center md:text-left">&copy; {currentYear} {APP_NAME}. {tc('all_rights_reserved')}</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">{t('privacy_policy')}</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">{t('terms_of_service')}</Link>
            <Link href="/cookies" className="hover:text-[var(--text-primary)] transition-colors">{t('cookie_settings')}</Link>
          </div>
        </div>

        {/* Big Brand Watermark */}
        <div className="relative w-full flex justify-center overflow-hidden select-none pointer-events-none opacity-[0.06] pt-8 sm:pt-0 sm:-mb-24">
          <h1 className="text-[28vw] sm:text-[25vw] leading-[0.7] font-bold text-center tracking-tighter text-[var(--text-primary)]">
            {APP_NAME}
          </h1>
        </div>
      </div>
    </footer>
  )
}
