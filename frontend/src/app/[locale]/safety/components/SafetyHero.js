'use client';

import { motion } from 'framer-motion';

export default function SafetyHero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
      >
        Safety is our <span className="text-orange-500">top priority</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-xl text-gray-300 max-w-2xl mx-auto mb-10"
      >
        From pickup to drop-off, we're dedicated to ensuring your ride is secure, comfortable, and reliable.
      </motion.p>
    </section>
  );
}
