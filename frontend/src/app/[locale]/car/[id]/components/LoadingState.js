'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

import { useTranslations } from 'next-intl'

export default function LoadingState() {
  const t = useTranslations('car_details')
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

