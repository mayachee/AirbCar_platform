'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  MissionLayout,
  BoltHeroSection,
  EarnMoneySection,
  BookRideSection,
  DownloadAppsSection,
  AboutUsSection,
  ChallengeSection,
  ImpactSection,
  CreativeSeparator,
  SectionWrapper,
  ScrollProgress,
} from './components';

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
      
      {/* Enhanced animated background gradients - 21st.dev style */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 107, 53, 0.15), transparent)',
            y: backgroundY,
            opacity: backgroundOpacity,
          }}
        />
        {/* Secondary gradient orbs for depth */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255, 107, 53, 0.08), transparent)',
            y: useTransform(scrollYProgress, [0, 1], ['0%', '50%']),
            opacity: useTransform(scrollYProgress, [0, 0.5, 1], [0.08, 0.05, 0]),
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-[600px] h-[500px]"
          style={{
            background: 'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(59, 130, 246, 0.06), transparent)',
            y: useTransform(scrollYProgress, [0, 1], ['0%', '-30%']),
            opacity: useTransform(scrollYProgress, [0, 0.5, 1], [0.06, 0.03, 0]),
          }}
        />
      </div>

      <div ref={containerRef} className="relative z-10">
        {/* Hero Section - Full Impact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <BoltHeroSection />
        </motion.div>

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
              className="w-full h-full"
            />
          </motion.div>
        </SectionWrapper>

        
        {/* The Challenge Section */}
        <ChallengeSection />

        {/* Creative Wave Separator */}
        <CreativeSeparator variant="wave" index={0} />

        {/* Diagonal Separator */}
        <CreativeSeparator variant="diagonal" index={1} />

        {/* Earn Money Section */}
        <SectionWrapper delay={0.15} className="pt-8">
          <EarnMoneySection />
        </SectionWrapper>

        {/* Image with Parallax */}
        {/* <SectionWrapper delay={0.25}>
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
        </SectionWrapper> */}

        {/* Default Separator */}
        <CreativeSeparator variant="default" index={2} />

        {/* Cities Section */}
        {/* <SectionWrapper delay={0.1} className="pt-8">
          <CitiesForPeopleSection />
        </SectionWrapper> */}


        {/* Sharing Section */}
        {/* <SectionWrapper delay={0.2}>
          <SharingBestPracticesSection />
        </SectionWrapper> */}

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

        {/* Image with Fade In */}
        {/* <SectionWrapper delay={0.3}>
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
        </SectionWrapper> */}

        {/* Wave Separator */}
        <CreativeSeparator variant="wave" index={3} />

        {/* Book Ride Section */}
        <SectionWrapper delay={0.1} className="pt-8">
          <BookRideSection />
        </SectionWrapper>


        {/* Diagonal Separator before Final Section */}
        <CreativeSeparator variant="diagonal" index={4} />

        {/* Download Apps Section - Grand Finale */}
        <SectionWrapper delay={0.15} className="pt-8">
          <DownloadAppsSection />
        </SectionWrapper>

        {/* Wave Separator */}
        <CreativeSeparator variant="wave" index={5} />

        {/* Wave Separator */}
        <CreativeSeparator variant="wave" index={6} />

        {/* The Impact Section */}
        <ImpactSection />

        {/* Enhanced floating particles effect - 21st.dev style */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-sm"
              style={{
                width: `${4 + (i % 3) * 2}px`,
                height: `${4 + (i % 3) * 2}px`,
                left: `${15 + i * 12}%`,
                top: `${25 + i * 8}%`,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(255, 107, 53, 0.4), rgba(255, 107, 53, 0.1))'
                  : 'radial-gradient(circle, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))',
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, 20, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </MissionLayout>
  );
}
