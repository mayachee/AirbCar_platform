'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-none p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-600 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                A critical error occurred. Please refresh the page.
              </p>
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-orange-500 text-white px-4 py-2 rounded-none hover:bg-orange-600 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-none hover:bg-gray-50 transition-colors"
                >
                  Go to home page
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

