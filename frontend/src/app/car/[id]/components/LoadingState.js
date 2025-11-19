'use client'

import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Loading vehicle details...
          </motion.p>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

