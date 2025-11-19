'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

export default function AnimatedBreadcrumb({ vehicleName }) {
  const router = useRouter()

  return (
    <motion.div
      className="bg-white border-b"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <motion.button
                  onClick={() => router.push('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Home
                </motion.button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white px-2 py-1 rounded text-xs z-50"
                  sideOffset={5}
                >
                  Go to homepage
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <motion.svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <motion.button
                  onClick={() => router.push('/search')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.15 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cars in Morocco
                </motion.button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white px-2 py-1 rounded text-xs z-50"
                  sideOffset={5}
                >
                  Browse all vehicles
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <motion.svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>

          <motion.span
            className="text-gray-900 font-medium truncate max-w-xs"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.25 }}
          >
            {vehicleName}
          </motion.span>
        </nav>
      </div>
    </motion.div>
  )
}

