'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function ErrorState({ error, vehicleId }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="text-center max-w-md mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="mb-6"
            variants={itemVariants}
          >
            <motion.svg
              className="w-16 h-16 text-orange-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 0,
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </motion.svg>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-900 mb-4"
            variants={itemVariants}
          >
            {error ? 'Unable to load vehicle' : 'Vehicle not found'}
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-6"
            variants={itemVariants}
          >
            {error || "The vehicle you're looking for doesn't exist or has been removed."}
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => router.push('/search')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Search
            </motion.button>
            <motion.button
              onClick={() => router.push('/')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go Home
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

