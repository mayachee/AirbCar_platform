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
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', href: '/terms', prefetch: false },
        { label: 'Privacy Policy', href: '/privacy', prefetch: false },
        { label: 'Rental Policies', href: '/rental-policies', prefetch: false },
        { label: 'Cookie Policy', href: '/cookies', prefetch: false },
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
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent opacity-50" />
      
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Section - Spans 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              Premium car rental platform connecting travelers with trusted local partners across Morocco.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/20"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections - Spans 5 columns */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={link.prefetch !== undefined ? link.prefetch : existingPages.includes(link.href)}
                        className="group flex items-center text-gray-400 hover:text-orange-500 transition-colors text-sm"
                      >
                        <span className="w-0 group-hover:w-2 h-px bg-orange-500 mr-0 group-hover:mr-2 transition-all duration-300" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter - Spans 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-2">
                Join our newsletter
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Get exclusive offers and travel inspiration directly in your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                      setSuccess(false)
                    }}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all disabled:opacity-50"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-orange-500 backdrop-blur-xl border border-white/10 text-white hover:from-orange-500 hover:to-orange-500 rounded-xl transition-all duration-300 font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </span>
                  ) : 'Subscribe Now'}
                </button>
                {error && (
                  <p className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs text-green-400 mt-2 bg-green-900/20 p-2 rounded-lg border border-green-900/50">
                    ✓ Subscribed successfully!
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} {APP_NAME}. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center hover:text-gray-300 transition-colors">
                <span className="mr-2">🇲🇦</span> Made in Morocco
              </span>
              <span className="w-1 h-1 bg-gray-700 rounded-full" />
              <span className="flex items-center hover:text-gray-300 transition-colors">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure & Trusted
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
