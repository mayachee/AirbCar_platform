'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'

function SignUpRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to unified auth page with signup mode
    router.replace('/auth?mode=signup')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign up...</p>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpRedirect />
    </Suspense>
  )
}
