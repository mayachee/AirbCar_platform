'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#FF8555] to-[#FF6B35] z-50 origin-left"
      style={{ 
        scaleX,
        opacity,
        willChange: 'transform, opacity'
      }}
    />
  );
}

