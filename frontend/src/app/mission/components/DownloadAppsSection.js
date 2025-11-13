'use client';

import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Parallax scroll effect for background elements
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.05, 0.04, 0.03]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.05, 0.04, 0.03]);

  return (
    <section ref={ref} className="py-24 bg-gray-900 relative overflow-hidden">
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
                className="bg-gray-900 px-4 text-gray-500 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                Download Apps
              </motion.span>
            </div>
          </motion.div>

          {/* Header Section with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Download our apps
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 font-light">
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
              className="relative flex justify-center items-center order-2 md:order-1"
            >
              {/* Glow effect behind phone */}
              <div 
                className="absolute inset-0 blur-3xl opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 70%)',
                  transform: 'rotate(5deg) scale(1.2)'
                }}
              />
              
              {/* Enhanced App Download Visual - Responsive sizing */}
              <motion.div
                className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-lg lg:max-w-xl xl:max-w-2xl h-[600px] sm:h-[650px] md:h-[600px] lg:h-[700px] xl:h-[800px] flex items-center justify-center"
                variants={phoneVariants}
                animate="float"
              >
                {/* Floating particles background */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-[#FF6B35]/30 rounded-full"
                    initial={{ 
                      x: Math.random() * 400 - 200, 
                      y: Math.random() * 400 - 200,
                      opacity: 0 
                    }}
                    animate={{
                      y: [null, Math.random() * 100 - 50],
                      x: [null, Math.random() * 100 - 50],
                      opacity: [0, 0.5, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                ))}

                <div className="relative w-full h-full flex flex-col items-center justify-center space-y-6 sm:space-y-8 p-6 sm:p-8">
                  {/* Main App Icon with enhanced effects */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                    animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -180 }}
                    transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 200 }}
                  >
                    {/* Outer glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#FF6B35] via-[#FF8555] to-[#FF6B35] opacity-50 blur-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Main icon container */}
                    <motion.div
                      className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-br from-[#FF6B35] via-[#FF8555] to-[#FF6B35] rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden"
                      whileHover={{ scale: 1.15, rotate: [0, -5, 5, -5, 0] }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {/* Animated gradient overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Car Icon */}
                      <svg className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white z-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                      </svg>
                    </motion.div>
                  </motion.div>

                  {/* App Name with enhanced styling */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-center space-y-2"
                  >
                    <motion.h3 
                      className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ['0%', '100%', '0%']
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      AirbCar
                    </motion.h3>
                    <p className="text-gray-300 text-sm sm:text-base font-medium">Your ride, your way</p>
                    
                    {/* Rating stars */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      className="flex items-center justify-center gap-1 mt-2"
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.svg
                          key={i}
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          initial={{ opacity: 0, y: -10 }}
                          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                          transition={{ delay: 0.7 + i * 0.1 }}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </motion.svg>
                      ))}
                      <span className="ml-2 text-xs text-gray-400">4.8 • 10K+ downloads</span>
                    </motion.div>
                  </motion.div>

                  {/* Feature highlights */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex flex-wrap gap-2 justify-center max-w-xs"
                  >
                    {['Instant Booking', '24/7 Support', 'Secure Payment'].map((feature, i) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                        transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs text-gray-300"
                      >
                        {feature}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Enhanced App Store Badges */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
                  >
                    {/* App Store Badge */}
                    <motion.a
                      href="#"
                      className="relative inline-block w-full sm:w-auto"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="flex items-center gap-3 bg-gradient-to-br from-black/90 to-black/70 hover:from-black hover:to-black/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-700/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#FF6B35]/20"
                        whileHover={{ borderColor: '#FF6B35' }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.42-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.42C7.28 19.17 6.98 18.04 7.11 16.8c.12-1.2.69-2.37 1.62-3.39 1.77-1.9 3.98-3.15 6.24-3.88.5-.16 1-.29 1.51-.41.76-.17 1.48-.13 2.17.15 1.11.36 1.89 1.12 2.08 2.28-.19 1.16-1.01 1.88-2.08 2.28-.69.28-1.41.32-2.17.15-.51-.12-1.01-.25-1.51-.41-2.26-.73-4.47-1.98-6.24-3.88-.93-1.02-1.5-2.19-1.62-3.39-.13-1.24.17-2.37 1.24-3.28.86-.86 1.62-1.04 3.06-.42 1.15.48 2.15.46 3.24 0 1.03-.46 2.1-.53 3.08.42 1.07.91 1.37 2.04 1.24 3.28-.12 1.2-.69 2.37-1.62 3.39-1.77 1.9-3.98 3.15-6.24 3.88-.5.16-1 .29-1.51.41-.76.17-1.48.13-2.17-.15-1.07-.4-1.89-1.12-2.08-2.28.19-1.16 1.01-1.88 2.08-2.28.69-.28 1.41-.32 2.17-.15.51.12 1.01.25 1.51.41 2.26.73 4.47 1.98 6.24 3.88.93 1.02 1.5 2.19 1.62 3.39.13 1.24-.17 2.37-1.24 3.28z"/>
                          </svg>
                        </motion.div>
                        <div className="text-left">
                          <div className="text-xs text-gray-400 font-medium">Download on the</div>
                          <div className="text-lg font-bold text-white">App Store</div>
                        </div>
                      </motion.div>
                    </motion.a>

                    {/* Google Play Badge */}
                    <motion.a
                      href="#"
                      className="relative inline-block w-full sm:w-auto"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="flex items-center gap-3 bg-gradient-to-br from-black/90 to-black/70 hover:from-black hover:to-black/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-700/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#FF6B35]/20"
                        whileHover={{ borderColor: '#FF6B35' }}
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L16.81,15.12L14.54,12.85L16.81,10.81L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                          </svg>
                        </motion.div>
                        <div className="text-left">
                          <div className="text-xs text-gray-400 font-medium">Get it on</div>
                          <div className="text-lg font-bold text-white">Google Play</div>
                        </div>
                      </motion.div>
                    </motion.a>
                  </motion.div>

                  {/* QR Code option for mobile */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-center"
                  >
                    <p className="text-xs text-gray-500 mb-2">Scan QR code to download</p>
                    <motion.div
                      className="inline-block p-3 bg-white rounded-xl shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300">
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Enhanced decorative elements */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="absolute -z-10 w-64 h-64 bg-[#FF6B35]/20 rounded-full blur-3xl"
                  ></motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={isInView ? { opacity: 0.5, scale: 1 } : { opacity: 0, scale: 0.6 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="absolute -z-10 top-1/4 right-1/4 w-48 h-48 bg-[#FF8555]/15 rounded-full blur-2xl"
                  ></motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Content with Tabs */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col order-1 md:order-2"
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
                  <motion.span
                    className="relative z-10 block"
                    animate={{ 
                      color: activeTab === 'Rides' ? '#FF6B35' : '#ffffff'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    iOS
                  </motion.span>
                  {activeTab === 'Rides' && (
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
                  )}
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('Delivery')}
                  className="relative text-white text-lg sm:text-xl font-medium pb-3 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ willChange: 'transform' }}
                >
                  <motion.span
                    className="relative z-10 block"
                    animate={{ 
                      color: activeTab === 'Delivery' ? '#FF6B35' : '#ffffff'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    Android
                  </motion.span>
                  {activeTab === 'Delivery' && (
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
                  )}
                </motion.button>
              </div>

              {/* Content with staggered animations - switches based on activeTab */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <motion.div 
                    className="space-y-4"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <motion.h3 
                      className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {activeTab === 'Rides' 
                        ? 'The fast, affordable way to ride.'
                        : 'Deliver anything, anywhere, anytime.'}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-lg sm:text-xl text-gray-300 leading-relaxed"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {activeTab === 'Rides'
                        ? 'Available for iOS devices. Book rides, track your driver, and pay seamlessly.'
                        : 'Available for Android devices. Order food, track deliveries, and enjoy fast service.'}
                    </motion.p>
                  </motion.div>
                  
                  {/* Enhanced CTA Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                      {activeTab === 'Rides' ? 'Get Airbcar' : 'Get Airbcar'}
                    </motion.span>
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
