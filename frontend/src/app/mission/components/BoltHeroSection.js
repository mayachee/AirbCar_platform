'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';

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


      <motion.div
        style={{ opacity, y }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative py-12"
      >
        <div className="text-center">
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
            <span className="block text-orange-500">Feel at home</span>
            <span className="block text-white">wherever you go</span>
          </motion.h1>

          {/* Subheadline - Reassurance and Vision */}
          <motion.p
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl text-orange-500 mb-12 leading-relaxed font-light drop-shadow"
          >
            Airbcar is not just a ride, Experience the startup that's changing how the Morocco moves.
          </motion.p>


        </div>
      </motion.div>
    </section>
  );
}
