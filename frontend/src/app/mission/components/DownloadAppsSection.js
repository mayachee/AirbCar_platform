'use client';

import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

// Animation variants for better performance and reusability
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // Custom easing for smooth feel
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const phoneVariants = {
  float: {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function DownloadAppsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [activeTab, setActiveTab] = useState('Rides');
  
  // Parallax scroll effect for background elements
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.05, 0.04, 0.03]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.05, 0.04, 0.03]);

  return (
    <section ref={ref} className="py-24 bg-[#121212] relative overflow-hidden">
      {/* Background decorative elements with parallax */}
      <motion.div 
        style={{ 
          y: backgroundY, 
          opacity: opacity1,
          willChange: 'transform, opacity'
        }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl"
      />
      <motion.div 
        style={{ 
          y: useTransform(scrollYProgress, [0, 1], [0, -30]), 
          opacity: opacity2,
          willChange: 'transform, opacity'
        }}
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl"
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-24">
          {/* Latest Features Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="space-y-12"
          >
            <motion.div
              variants={containerVariants}
              className="text-center space-y-4"
            >
              <motion.p 
                variants={itemVariants}
                className="text-lg text-gray-400 uppercase tracking-wider"
                style={{ willChange: 'transform, opacity' }}
              >
                Latest features
              </motion.p>
              <motion.h1 
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text"
                style={{ willChange: 'transform, opacity' }}
              >
                Book a ride in advance
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                style={{ willChange: 'transform, opacity' }}
              >
                Planning a trip? Schedule a Airbcar ride in advance for even more convenient airport transfers, important meetings, or any occasion that requires punctuality. Simply enter your details and secure your ride up to 90 days ahead.
              </motion.p>
            </motion.div>
            
            {/* Feature Image */}
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover="hover"
              className="relative group"
              style={{ willChange: 'transform, filter' }}
            >
              {/* Animated glow effect */}
              <motion.div 
                className="absolute -inset-4 bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/10 to-transparent rounded-3xl blur-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ willChange: 'opacity' }}
              />
              
              {/* Image container */}
              <motion.div 
                className="relative overflow-hidden rounded-3xl shadow-2xl border border-gray-800/50"
                whileHover={{ boxShadow: "0 25px 50px rgba(255, 107, 53, 0.2)" }}
                transition={{ duration: 0.4 }}
              >
                <motion.img 
                  src="/Figure1.jpg" 
                  alt="Book a ride in advance" 
                  className="w-full h-auto max-h-[600px] object-cover" 
                  loading="lazy"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: 'transform' }}
                />
                {/* Gradient overlay for depth */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
                  initial={{ opacity: 0.5 }}
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Animated Divider */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="absolute inset-0 flex items-center">
              <motion.div 
                className="w-full border-t border-gray-800"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
            <div className="relative flex justify-center">
              <motion.span 
                className="bg-[#121212] px-4 text-gray-500 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                Download Apps
              </motion.span>
            </div>
          </motion.div>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Download our apps
            </h2>
            <p className="text-lg sm:text-xl text-gray-300">
              Available for iOS and Android devices.
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.9 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="relative flex justify-center items-center"
            >
              {/* Glow effect behind phone */}
              <div 
                className="absolute inset-0 blur-3xl opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 70%)',
                  transform: 'rotate(5deg) scale(1.2)'
                }}
              />
              
              {/* Phone container with rotation */}
              <motion.div
                className="relative transform rotate-[5deg]"
                initial={{ rotate: 5, scale: 0.9 }}
                animate={isInView ? { rotate: 5, scale: 1 } : { rotate: 5, scale: 0.9 }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: 8,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ willChange: 'transform' }}
              >
                {/* Floating animation */}
                <motion.div
                  variants={phoneVariants}
                  animate="float"
                  className="relative z-10"
                  style={{ willChange: 'transform' }}
                >
                  <motion.img 
                    src="/Gemini_Generated_Image_dfh2pedfh2pedfh2.png" 
                    alt="Mobile apps on phone"
                    className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain select-none"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))',
                      willChange: 'transform'
                    }}
                    loading="eager"
                    draggable="false"
                    whileHover={{ 
                      filter: 'drop-shadow(0 35px 70px rgba(255, 107, 53, 0.3))',
                      transition: { duration: 0.3 }
                    }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side - Content with Tabs */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col"
            >
              {/* Tabs with enhanced animations */}
              <div className="flex gap-8 mb-10">
                <motion.button
                  onClick={() => setActiveTab('Rides')}
                  className="relative text-white text-lg sm:text-xl font-medium pb-3 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ willChange: 'transform' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeTab === 'Rides' ? 'active' : 'inactive'}
                      className="relative z-10 block"
                      initial={{ color: '#ffffff' }}
                      animate={{ 
                        color: activeTab === 'Rides' ? '#FF6B35' : '#ffffff'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      Rides
                    </motion.span>
                  </AnimatePresence>
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/50"
                    initial={false}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 35,
                      mass: 0.8
                    }}
                  />
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('Delivery')}
                  className="relative text-white text-lg sm:text-xl font-medium pb-3 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ willChange: 'transform' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeTab === 'Delivery' ? 'active' : 'inactive'}
                      className="relative z-10 block"
                      initial={{ color: '#ffffff' }}
                      animate={{ 
                        color: activeTab === 'Delivery' ? '#FF6B35' : '#ffffff'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      Delivery
                    </motion.span>
                  </AnimatePresence>
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/50"
                    initial={false}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 35,
                      mass: 0.8
                    }}
                  />
                </motion.button>
              </div>

              {/* Content with staggered animations */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="space-y-8"
              >
                <motion.div 
                  variants={itemVariants}
                  className="space-y-4"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <motion.h3 
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    The fast, affordable way to ride.
                  </motion.h3>
                  
                  <motion.p 
                    className="text-lg sm:text-xl text-gray-300 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Available for iOS and Android devices.
                  </motion.p>
                </motion.div>
                
                {/* Enhanced CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 20px 40px rgba(255, 107, 53, 0.5)",
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative bg-[#FF6B35] hover:bg-[#FF8555] text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#FF6B35]/30 overflow-hidden group"
                  style={{ willChange: 'transform' }}
                >
                  {/* Animated shine effect */}
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    initial={{ x: '-200%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ 
                      duration: 0.8,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                    style={{ willChange: 'transform' }}
                  />
                  <motion.span 
                    className="relative z-10 flex items-center gap-2"
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    Get Airbcar
                  </motion.span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
