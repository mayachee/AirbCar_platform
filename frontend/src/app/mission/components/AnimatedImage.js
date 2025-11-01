'use client';

import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

export default function AnimatedImage({ 
  src, 
  alt, 
  className = '',
  parallaxSpeed = 0.5,
  delay = 0,
  height = 'auto'
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Smooth parallax effect
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [100 * parallaxSpeed, -100 * parallaxSpeed]
  );

  // Apply spring physics to parallax for smoother motion
  const ySpring = useSpring(y, {
    stiffness: 50,
    damping: 30,
    mass: 0.5,
  });

  // Smooth opacity transitions
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0.3, 1, 1, 0.3]
  );

  // Apply spring to opacity for smoother fade
  const opacitySpring = useSpring(opacity, {
    stiffness: 100,
    damping: 30,
  });

  // Smooth scale with spring
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1.08, 1, 0.92]
  );

  // Apply spring to scale for smoother zoom
  const scaleSpring = useSpring(scale, {
    stiffness: 100,
    damping: 30,
  });

  return (
    <div ref={containerRef} className="w-full overflow-hidden relative my-8 sm:my-12" style={{ height }}>
      <motion.div
        ref={ref}
        style={{ 
          y: ySpring,
        }}
        initial={{ opacity: 0, y: 80, scale: 0.92 }}
        animate={isInView ? { 
          opacity: 1, 
          y: 0, 
          scale: 1 
        } : { 
          opacity: 0, 
          y: 80, 
          scale: 0.92 
        }}
        transition={{ 
          type: 'spring',
          stiffness: 60,
          damping: 25,
          mass: 0.8,
          delay,
        }}
        className={`relative w-full ${className}`}
        whileHover={{ 
          scale: 1.015,
          transition: { duration: 0.3, ease: 'easeOut' }
        }}
      >
        <motion.img
          src={src}
          alt={alt}
          style={{ 
            scale: scaleSpring,
            opacity: opacitySpring,
          }}
          className="w-full h-auto object-cover rounded-lg sm:rounded-xl shadow-2xl will-change-transform"
          loading="lazy"
          whileHover={{ 
            scale: 1.03,
            transition: { 
              type: 'spring',
              stiffness: 300,
              damping: 20
            }
          }}
        />
        {/* Enhanced gradient overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none rounded-lg sm:rounded-xl"
          style={{ 
            opacity: opacitySpring
          }}
        />
      </motion.div>
    </div>
  );
}

