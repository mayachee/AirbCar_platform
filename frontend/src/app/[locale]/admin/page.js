'use client'

import { useAdminAuth } from './hooks'
import { LoadingSpinner } from './components'

export default function AdminPage() {
  const { checking } = useAdminAuth()

  // This page will redirect to dashboard or signin based on auth
  // The useAdminAuth hook handles all the logic
  
  return <LoadingSpinner fullScreen size="lg" />
}