'use client'

import { motion } from 'framer-motion'

export default function AnimatedSection({ children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1 
      }}
    >
      {children}
    </motion.div>
  )
}

