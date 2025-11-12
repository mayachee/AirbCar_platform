'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui';
import MissionDialog from './MissionDialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function BoltHeroSection() {
  const router = useRouter();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={ref} className="relative bg-gradient-to-br from-white via-gray-50/50 to-white min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Enhanced Animated Background Elements - 21st.dev style */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs with enhanced animation */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-orange-400/40 via-orange-300/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.35, 0.15],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-orange-200/20 rounded-full"
        />
        {/* Additional subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-orange-50/20 to-transparent" />
      </div>
      
      <motion.div
        style={{ opacity, y }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Tagline with enhanced sparkle effect */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <p className="text-gray-600 text-lg sm:text-xl font-medium tracking-wide">
              Let's make cities for people
            </p>
          </motion.div>

          {/* Main Headline with enhanced gradient styling */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            <motion.span
              whileHover={{ scale: 1.05, y: -5 }}
              className="inline-block relative"
            >
              <span className="relative z-10 text-orange-600 px-6 py-3 rounded-2xl mb-3 inline-block">
                Ride out
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-orange-300/30 to-orange-400/20 rounded-2xl blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.span>
            {' '}
            <span className="block sm:inline bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              or stay in
            </span>
          </motion.h1>

          {/* Subheadline with enhanced styling */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Get picked up anywhere with Airbcar. Have anything delivered with Airbcar.
          </motion.p>

          {/* CTA Buttons with enhanced glass-morphism effects */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap"
          >
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={() => router.push('/search')}
                className="relative bg-orange-600 text-white px-8 sm:px-10 py-5 text-base sm:text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all flex items-center gap-2 group w-full sm:w-auto overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: 'linear',
                  }}
                />
                <span className="relative z-10">Get Airbcar</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </Button>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              whileTap={{ scale: 0.95 }}
            >
              <MissionDialog>
                <Button
                  size="lg"
                  variant="ghost"
                  className="relative border-2 border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 hover:bg-orange-50/80 backdrop-blur-sm px-8 sm:px-10 py-5 text-base sm:text-lg font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group w-full sm:w-auto bg-white/50"
                >
                  <Info className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Our Mission
                </Button>
              </MissionDialog>
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
