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

  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles([...Array(6)].map((_, i) => ({
      initial: { 
        x: Math.random() * 400 - 200, 
        y: Math.random() * 400 - 200,
        opacity: 0 
      },
      animate: {
        y: [null, Math.random() * 100 - 50],
        x: [null, Math.random() * 100 - 50],
        opacity: [0, 0.5, 0],
        scale: [0, 1, 0]
      },
      transition: {
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: i * 0.5,
        ease: "easeInOut"
      }
    })));
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
    <section ref={ref} className="relative py-20 sm:py-24 md:py-32 overflow-hidden">
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
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto">
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
                className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-lg lg:max-w-xl xl:max-w-2xl min-h-[550px] md:h-[600px] lg:h-[700px] xl:h-[800px] flex items-center justify-center"
                variants={phoneVariants}
                animate="float"
              >
                {/* Floating particles background */}
                {particles.map((particle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-[#FF6B35]/30 rounded-full"
                    initial={particle.initial}
                    animate={particle.animate}
                    transition={particle.transition}
                  />
                ))}


                <div className="relative w-full h-full flex flex-col items-center justify-center space-y-0 sm:space-y-8 p-4 sm:p-8">
                  {/* Main App Icon with enhanced effects */}
                  <motion.div
                    className="relative group"
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
                    
                    {/* Main Phone Mockup Container */}
                    <motion.div
                      className="relative w-64 h-[32rem] sm:w-72 sm:h-[36rem] md:w-80 md:h-[40rem] bg-gray-900 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl flex items-center justify-center border-[6px] border-gray-800"
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Dynamic Island / Notch */}
                      <div className="absolute top-3 w-28 sm:w-32 h-6 sm:h-7 bg-black rounded-full z-30 shadow-md transform -translate-x-1/2 left-1/2" />
                       
                      {/* Side Buttons */}
                      <div className="absolute -left-[8px] top-28 w-2 h-10 bg-gray-800 rounded-l-lg" />
                      <div className="absolute -left-[8px] top-44 w-2 h-14 bg-gray-800 rounded-l-lg" />
                      <div className="absolute -right-[8px] top-36 w-2 h-20 bg-gray-800 rounded-r-lg" />

                      {/* Screen Content */}
                      <div className="relative w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-black border-[3px] border-black">
                        {/* App Screenshot */}
                        <img 
                          src="https://ik.imagekit.io/szcfr7vth/localhost_3001_mission(iPhone%2012%20Pro)%20(2).png"
                          alt="AirbCar App Interface"
                          className="w-full h-full object-cover z-10 relative"
                        />
                        
                        {/* Screen Reflection/Gloss */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none z-20" />
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
              className="flex flex-col order-1 md:order-2 mt-10 md:mt-0"
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
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-orange-500/60 backdrop-blur-md border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:bg-orange-500 hover:text-white overflow-hidden group"
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
