'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import MissionDialog from './MissionDialog';

export default function AboutUsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-20 sm:py-24 md:py-32 bg-orange-600 overflow-hidden">
      {/* Background Pattern - optional subtle texture */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* "About us" Label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <span className="text-green-800/70 text-base sm:text-lg font-medium">
              About us
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight"
          >
            Airbcar is the first Moroccan<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>mobility super-app.
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-orange-800/80 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            We're making cities for people, offering better alternatives for every purpose a private car serves — including ride-hailing, shared cars, scooters, and food and grocery delivery.
          </motion.p>

          {/* "Our mission" Button - Enhanced Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <MissionDialog>
              <motion.button
                className="group relative overflow-hidden px-8 py-4 sm:px-10 sm:py-5 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-300"
                whileHover={{ 
                  scale: 1.08,
                  y: -2,
                  boxShadow: "0 20px 40px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)"
                }}
                whileTap={{ scale: 0.96 }}
                style={{ willChange: 'transform' }}
              >
                {/* Multi-layer glassmorphism background */}
                <div className="absolute inset-0 bg-white/15 backdrop-blur-xl rounded-lg sm:rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-lg rounded-lg sm:rounded-xl"></div>
                
                {/* Animated gradient border */}
                <motion.div
                  className="absolute -inset-[1px] rounded-lg sm:rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2), rgba(255,255,255,0.6))',
                    borderRadius: 'inherit',
                  }}
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2), rgba(255,255,255,0.6))',
                      'linear-gradient(315deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2), rgba(255,255,255,0.6))',
                      'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2), rgba(255,255,255,0.6))',
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-[1px] bg-orange-600 rounded-lg sm:rounded-xl" />
                </motion.div>
                
                {/* Shimmer/Shine effect */}
                <motion.div
                  className="absolute inset-0 -z-10"
                  initial={{ x: '-200%', skewX: '-20deg' }}
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    width: '50%',
                  }}
                />
                
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.2), transparent 70%)',
                    filter: 'blur(10px)',
                  }}
                />
                
                {/* Text with subtle shadow for depth */}
                <span className="relative z-10 text-white drop-shadow-lg font-semibold tracking-wide">
                  Our mission
                </span>
                
                {/* Animated sparkle effect */}
                <motion.div
                  className="absolute top-2 right-4 w-1 h-1 bg-white rounded-full"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.5,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute bottom-2 left-4 w-1 h-1 bg-white rounded-full"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 1,
                    ease: "easeInOut",
                  }}
                />
              </motion.button>
            </MissionDialog>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

