'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APP_NAME } from '@/constants'
import { apiClient } from '@/lib/api/client'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Pages that exist and can be prefetched
  const existingPages = ['/mission', '/search', '/partner', '/booking']
  
  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about', prefetch: false },
        { label: 'Mission', href: '/mission', prefetch: true },
        { label: 'Careers', href: '/careers', prefetch: false },
      ]
    },
    {
      title: 'Services',
      links: [
        { label: 'Car Rental', href: '/search', prefetch: true },
        { label: 'Partner Program', href: '/partner', prefetch: true },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help', prefetch: false },
        { label: 'Contact Us', href: '/contact', prefetch: false },
        { label: 'Safety', href: '/safety', prefetch: false },
      ]
    }
  ]

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const response = await apiClient.post('/api/newsletter/subscribe/', { email }, { skipAuth: true })
      setSuccess(true)
      setEmail('')
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      // Extract error message from different possible error structures
      let errorMessage = 'Failed to subscribe. Please try again later.'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.data?.error) {
        errorMessage = error.data.error
      } else if (error?.data?.detail) {
        errorMessage = error.data.detail
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const socialLinks = [
    {
      name: 'Facebook',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988c6.62 0 11.987-5.367 11.987-11.988C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.73-3.016-1.8L4.27 17.33c.568 1.07 1.719 1.8 3.016 1.8h.163zm7.101 0h.163c1.297 0 2.448-.73 3.016-1.8l1.163 2.142c-.568 1.07-1.719 1.8-3.016 1.8z" />
        </svg>
      )
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    }
  ]

  return (
    <footer className="relative bg-[#0B0F19] text-white overflow-hidden">
      {/* Deep Space Background */}
      <div className="absolute inset-0 bg-[#0B0F19]" />
      
      {/* Main Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-orange-950/40 via-[#0B0F19] to-[#0B0F19]" />
      
      {/* Vivid Orange Glow (Top Left) */}
      <div className="absolute -top-[200px] -left-[200px] w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      {/* Subtle Purple/Blue Contrast (Bottom Right) */}
      <div className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Top Highlight Line (Aurora) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent shadow-[0_1px_20px_rgba(249,115,22,0.2)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24 mb-16 sm:mb-24">
          {/* Brand Section - Spans 5 columns */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Stay Focused,<br />Stay Ahead
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-md text-lg font-light">
              Join thousands of teams using {APP_NAME} to streamline work and unlock clarity every day.
            </p>
            
            {/* Newsletter Form */}
            <form onSubmit={handleNewsletterSubmit} className="relative max-w-md pt-2">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-6 pr-36 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all backdrop-blur-sm"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-full transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '...' : 'Subscribe'}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-400 pl-4 animate-in fade-in slide-in-from-top-1">{error}</p>}
              {success && <p className="mt-2 text-xs text-green-400 pl-4 animate-in fade-in slide-in-from-top-1">Thanks for subscribing!</p>}
            </form>

            <div className="pt-6 flex gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-orange-500 transition-colors transform hover:scale-110 duration-200"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections - Spans 7 columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 pt-2">
            {/* Dynamic Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={link.prefetch !== undefined ? link.prefetch : existingPages.includes(link.href)}
                        className="text-sm text-gray-400 hover:text-orange-500 transition-colors block hover:translate-x-1 duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {/* Contact Info */}
            <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">
                  Contact
                </h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li>
                        <a href="mailto:hello@airbcar.com" className="hover:text-orange-500 transition-colors">
                            hello@airbcar.com
                        </a>
                    </li>
                    <li>Tetouan, Morocco</li>
                </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 sm:mb-12" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500 mb-12 sm:mb-20">
            <p className="text-center md:text-left">&copy; {currentYear} {APP_NAME}. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookie Settings</Link>
            </div>
        </div>

        {/* Big Brand Name */}
        <div className="relative w-full flex justify-center overflow-hidden select-none pointer-events-none opacity-40 pt-8 sm:pt-0 sm:-mb-24">
          <h1 className="text-[28vw] sm:text-[25vw] leading-[0.7] font-bold text-center tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-transparent blur-sm">
            {APP_NAME}
          </h1>
        </div>
      </div>
    </footer>
  )
}
