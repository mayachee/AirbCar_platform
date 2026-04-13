'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function ErrorState({ error, vehicleId }) {
  const t = useTranslations('car_details')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white border shadow-sm shadow-gray-200/50 rounded-3xl p-10 max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Unable to Load Vehicle
            </h2>
            <p className="text-gray-500 mb-8 font-medium">
              {error || 'The vehicle you are looking for could not be found.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/search')}
                className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 font-bold transition-colors shadow-sm shadow-orange-500/30"
              >
                Back to Search
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-bold transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

