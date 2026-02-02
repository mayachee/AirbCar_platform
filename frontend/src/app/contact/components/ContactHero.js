'use client';

import { motion } from 'framer-motion';

export default function ContactHero() {
  return (
    <section className="relative pt-24 pb-12 md:pt-40 md:pb-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-orange-500/5 to-transparent -z-10 blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-orange-500/20 bg-orange-500/5 backdrop-blur-md text-orange-400 text-[10px] md:text-sm font-bold uppercase tracking-wider mb-6 md:mb-8 hover:bg-orange-500/10 transition-colors"
        >
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-orange-500"></span>
            </span>
            Get in Touch
        </motion.div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 md:mb-8 text-white leading-tight md:leading-[0.95]">
          <span className="block">We're here to</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 pb-2 block">
            help you grow.
          </span>
        </h1>
        
        <p className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed px-4 sm:px-0 font-medium">
          Have a question about our services or just want to say hello? 
          We'd love to hear from you and our team is ready to answer.
        </p>
      </motion.div>
    </section>
  );
}
