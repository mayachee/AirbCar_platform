'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PartnerHero() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });

  return (
    <section className="relative overflow-visible">
      {/* Background Decor - Removed overlapping decorations to show main abstract bg */}
      
      <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28 relative z-10">
        <motion.div 
          ref={heroRef}
          initial="initial"
          animate={heroInView ? "animate" : "initial"}
          variants={staggerChildren}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Text Content */}
          <motion.div variants={fadeInUp} className="relative z-10">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-orange-400 text-sm font-semibold mb-6 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Now Accepting New Partners
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Turn your vehicles into <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                passive income
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
              Join thousands of hosts who are earning more by sharing their cars on AirbCar. 
              We handle the insurance, payments, and verification so you can focus on scaling.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <motion.a 
                href="#partner-form" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-700/80 text-white font-semibold hover:bg-orange-700/80 backdrop-blur flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 border border-orange-500/20 backdrop-blur-sm transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Earning Now
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-black/20 hover:bg-black/40 text-white font-semibold border border-white/10 backdrop-blur-md shadow-lg shadow-black/5 flex items-center justify-center transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                How it works
              </motion.a>
            </div>

            <motion.div 
              className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-8"
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp}>
                <div className="text-3xl font-bold text-white mb-1">48h</div>
                <div className="text-sm text-gray-400 font-medium">Fast Verification</div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="text-3xl font-bold text-white mb-1">$2.5k+</div>
                <div className="text-sm text-gray-400 font-medium">Avg. Monthly/Car</div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="text-3xl font-bold text-white mb-1">0%</div>
                <div className="text-sm text-gray-400 font-medium">Listing Fees</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Image Content */}
          <motion.div 
            className="relative lg:h-[600px] flex items-center justify-center"
            variants={fadeInUp}
          >
            <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-3xl overflow-hidden shadow-2xl border border-orange-500/10 bg-orange-500/5 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay z-10 pointer-events-none" />
              <img 
                src="/bg_image.png" 
                alt="Partner Dashboard showing earnings and fleet management" 
                className="w-full h-full object-cover opacity-90" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent pointer-events-none z-20" />
            </div>
            
            {/* Floating Card 1 */}
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-[#1E293B] p-4 rounded-xl shadow-xl border border-white/10 hidden md:block z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={heroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  $
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Weekly Payout</div>
                  <div className="text-lg font-bold text-white">$1,240.50</div>
                </div>
              </div>
            </motion.div>

             {/* Floating Card 2 */}
             <motion.div 
              className="absolute top-10 -right-6 bg-[#1E293B] p-4 rounded-xl shadow-xl border border-white/10 hidden md:block z-30"
              initial={{ y: -20, opacity: 0 }}
              animate={heroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="text-sm font-semibold text-white">New Booking Received</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

