'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  MissionLayout,
  BoltHeroSection,
  CitiesForPeopleSection,
  SharingBestPracticesSection,
  EarnMoneySection,
  BookRideSection,
  DownloadAppsSection,
  AboutUsSection,
  AnimatedImage,
} from './components';

// Creative section separator component
function CreativeSeparator({ index, variant = 'default' }) {
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
          className="text-white dark:text-gray-900"
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
          className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-gray-900/50 dark:to-gray-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-1 h-16 bg-gradient-to-b from-[#FF6B35] via-[#FF6B35]/50 to-transparent rounded-full"
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

// Section wrapper with reveal animation
function SectionWrapper({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scroll progress indicator
function ScrollProgress() {
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

export default function MissionPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Background gradient animation based on scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.05, 0]);

  return (
    <MissionLayout>
      <ScrollProgress />
      
      {/* Animated background gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 107, 53, 0.15), transparent)',
          y: backgroundY,
          opacity: backgroundOpacity,
        }}
      />

      <div ref={containerRef} className="relative z-10">
        {/* Hero Section - Full Impact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <BoltHeroSection />
        </motion.div>

        {/* Creative Wave Separator */}
        <CreativeSeparator variant="wave" index={0} />

        {/* About Section with Smooth Reveal */}
        <SectionWrapper delay={0.1}>
          <AboutUsSection />
        </SectionWrapper>

        {/* Image with Enhanced Animation */}
        <SectionWrapper delay={0.2}>
          <motion.div
            style={{ marginTop: "-50px" }}
            className="py-12"
          >
            <img 
              src="/ChatGPT Image Jul 22, 2025, 02_32_15 PM.png" 
              alt="About Us"
            />
          </motion.div>
        </SectionWrapper>

        {/* Diagonal Separator */}
        <CreativeSeparator variant="diagonal" index={1} />

        {/* Earn Money Section */}
        <SectionWrapper delay={0.15} className="pt-8">
          <EarnMoneySection />
        </SectionWrapper>

        {/* Image with Parallax */}
        <SectionWrapper delay={0.25}>
          <motion.div
            className="py-12 relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <img 
              src="/Index_DT_Media_08_2b9a617d79.webp" 
              alt="Sharing Best Practices"
              parallaxSpeed={0.4}
              delay={0.2}
            />
          </motion.div>
        </SectionWrapper>

        {/* Default Separator */}
        <CreativeSeparator variant="default" index={2} />

        {/* Cities Section */}
        <SectionWrapper delay={0.1} className="pt-8">
          <CitiesForPeopleSection />
        </SectionWrapper>

        {/* Sharing Section */}
        <SectionWrapper delay={0.2}>
          <SharingBestPracticesSection />
        </SectionWrapper>

        {/* Image with Fade In */}
        <SectionWrapper delay={0.3}>
          <motion.div
            className="py-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img 
              src="/Figure.jpg" 
              alt="Figure"
              parallaxSpeed={0.35}
              delay={0.15}
            />
          </motion.div>
        </SectionWrapper>

        {/* Wave Separator */}
        <CreativeSeparator variant="wave" index={3} />

        {/* Book Ride Section */}
        <SectionWrapper delay={0.1} className="pt-8">
          <BookRideSection />
        </SectionWrapper>

        {/* Image with Scale Animation */}
        <SectionWrapper delay={0.2}>
          <motion.div
            className="py-12"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ 
              duration: 1, 
              ease: [0.22, 1, 0.36, 1],
              type: "spring",
              stiffness: 100
            }}
          >
            <img 
              src="/Figure1.jpg" 
              alt="Book a Ride"
              parallaxSpeed={0.4}
              delay={0.2}
            />
          </motion.div>
        </SectionWrapper>

        {/* Diagonal Separator before Final Section */}
        <CreativeSeparator variant="diagonal" index={4} />

        {/* Download Apps Section - Grand Finale */}
        <SectionWrapper delay={0.15} className="pt-8">
          <DownloadAppsSection />
        </SectionWrapper>

        {/* Floating particles effect (optional decorative element) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#FF6B35] rounded-full opacity-20 blur-sm"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </MissionLayout>
  );
}
