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
      className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/50 hover:text-orange-400 transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </motion.button>
  )
}

