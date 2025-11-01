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
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
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
    <section ref={ref} className="relative bg-gradient-to-b from-white via-gray-50 to-white min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-green-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-200/20 rounded-full"
        />
      </div>
      
      <motion.div
        style={{ opacity, y }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Tagline with sparkle effect */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="h-5 w-5 text-green-500" />
            <p className="text-gray-500 text-lg sm:text-xl font-medium">
              Let's make cities for people
            </p>
            <Sparkles className="h-5 w-5 text-green-500" />
          </motion.div>

          {/* Main Headline with enhanced styling */}
          <motion.h1
            variants={itemVariants}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-block text-orange-500 px-6 py-3 rounded-2xl mb-3"
            >
              Ride out
            </motion.span>
            {' '}
            <span className="block sm:inline">or stay in</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Get picked up anywhere with Airbcar. Have anything delivered with Airbcar Food.
          </motion.p>

          {/* CTA Buttons with enhanced animations */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => router.push('/search')}
                className="bg-orange-500 text-white px-8 sm:px-10 py-5 text-base sm:text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group w-full sm:w-auto"
              >
                Get Airbcar
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <MissionDialog>
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-2 border-transparent hover:border-orange-300 text-gray-700 hover:text-green-700 hover:bg-green-50/50 px-8 sm:px-10 py-5 text-base sm:text-lg font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group w-full sm:w-auto"
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
