'use client'

import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

export default function VehicleHeader({ vehicle }) {
  return (
    <motion.div
      className="mb-6"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <motion.h1
        className="text-3xl font-bold text-gray-900 mb-2"
        variants={itemVariants}
      >
        {vehicle.name}
      </motion.h1>
      <motion.div
        className="flex items-center gap-4 text-sm text-gray-600 flex-wrap"
        variants={itemVariants}
      >
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.div
                className="flex items-center cursor-help"
                whileHover={{ scale: 1.05 }}
              >
                <motion.svg
                  className="w-4 h-4 text-yellow-400 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  whileHover={{ rotate: 15, scale: 1.1 }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
                <span className="font-medium">{vehicle.rating}</span>
                <span className="ml-1">({vehicle.reviewCount} reviews)</span>
              </motion.div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-2 py-1 rounded text-xs z-50"
                sideOffset={5}
              >
                Average rating from {vehicle.reviewCount} reviews
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          •
        </motion.span>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {vehicle.totalTrips} trips
        </motion.span>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          •
        </motion.span>

        <motion.span
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.05 }}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {vehicle.location}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}

