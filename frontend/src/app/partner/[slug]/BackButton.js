'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function BackButton() {
  const router = useRouter()

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <motion.button
      onClick={handleGoBack}
      className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm border border-neutral-200/60 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 hover:shadow-md backdrop-blur-sm"
      aria-label="Go back to previous page"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.02, x: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.svg 
        className="h-4 w-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
        animate={{ x: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </motion.svg>
      <span>Go back</span>
    </motion.button>
  )
}
