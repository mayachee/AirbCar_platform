'use client';

import { motion } from 'framer-motion';

export default function CreativeSeparator({ index, variant = 'default' }) {
  const variants = {
    wave: (
      <motion.svg
        viewBox="0 0 1440 120"
        className="w-full h-24 -mb-24"
        preserveAspectRatio="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <motion.path
          d="M0,80 Q360,20 720,80 T1440,80 L1440,120 L0,120 Z"
          fill="currentColor"
          className="text-white "
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </motion.svg>
    ),
    diagonal: (
      <div className="relative h-24 -mb-24 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 "
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
      </div>
    ),
    default: (
      <motion.div
        className="relative h-32 -mb-32"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white /50 " />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-1 h-16 bg-gradient-to-b from-[#FF6B35] via-[#FF6B35]/50 to-transparent rounded-none"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    ),
  };

  return (
    <div className="relative">
      {variants[variant] || variants.default}
    </div>
  );
}

