'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <motion.button
      onClick={handleBack}
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm hover:shadow-md"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </motion.button>
  )
}

