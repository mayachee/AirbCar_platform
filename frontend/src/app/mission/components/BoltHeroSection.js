'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Info, ChevronDown } from 'lucide-react';
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
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Immersive Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.5, 0.25], x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/30 via-orange-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.18, 0.38, 0.18], x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-2 border-orange-200/20 rounded-full"
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
          {/* Comfort Tagline */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <p className="text-orange-200 text-xl sm:text-2xl font-semibold tracking-wide drop-shadow-lg">
              Welcome to the future of comfort and mobility
            </p>
          </motion.div>

          {/* Main Headline - Bold, Modern, Emotional */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-8 leading-[1.05] tracking-tighter bg-gradient-to-br from-orange-400 via-orange-200 to-white text-transparent bg-clip-text drop-shadow-[0_4px_32px_rgba(249,115,22,0.25)]"
          >
            <span className="block">Feel at home,</span>
            <span className="block text-white">wherever you go.</span>
          </motion.h1>

          {/* Subheadline - Reassurance and Vision */}
          <motion.p
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl text-orange-500 mb-12 max-w-3xl mx-auto leading-relaxed font-light drop-shadow"
          >
            Airbcar is not just a ride, it's your comfort zone, your delivery partner, and your community. Experience the startup that's changing how the world moves, with heart.
          </motion.p>

          {/* CTA Buttons - Glassmorphism, Big, Inviting */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center flex-wrap"
          >
            <motion.div 
              whileHover={{ scale: 1.08, y: -2 }} 
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="xl"
                onClick={() => router.push('/search')}
                className="relative bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 text-white px-12 sm:px-16 py-6 text-xl sm:text-2xl font-bold rounded-3xl shadow-2xl hover:shadow-orange-500/50 transition-all flex items-center gap-3 group w-full sm:w-auto overflow-hidden backdrop-blur-xl"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: 'linear' }}
                />
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />
              </Button>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.08, y: -2 }} 
              whileTap={{ scale: 0.97 }}
            >
              <MissionDialog>
                <Button
                  size="xl"
                  variant="ghost"
                  className="relative border-2 border-orange-200 hover:border-orange-400 text-orange-200 hover:text-orange-500 hover:bg-orange-50/80 backdrop-blur-xl px-12 sm:px-16 py-6 text-xl sm:text-2xl font-bold rounded-3xl transition-all shadow-lg hover:shadow-xl flex items-center gap-3 group w-full sm:w-auto bg-white/10"
                >
                  <Info className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                  Learn More
                </Button>
              </MissionDialog>
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
