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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/60" />
      <div className="relative max-w-6xl mx-auto px-4 py-16">
        <motion.div 
          ref={heroRef}
          initial="initial"
          animate={heroInView ? "animate" : "initial"}
          variants={staggerChildren}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        >
          <motion.div variants={fadeInUp}>
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4"
              whileHover={{ scale: 1.05 }}
            >
              Partner Program
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Grow your rental business with Airbcar
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mb-6">
              List vehicles, manage bookings, and get paid fast — all in one dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <motion.a 
                href="#partner-form" 
                className="px-5 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                className="px-5 py-3 rounded-lg border font-medium hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                How it works
              </motion.a>
            </div>
            <motion.div 
              className="mt-6 grid grid-cols-3 gap-4 max-w-md"
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp}>
                <div className="text-2xl font-bold text-gray-900">48h</div>
                <div className="text-xs text-gray-500">Avg. verification</div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="text-2xl font-bold text-gray-900">+30%</div>
                <div className="text-xs text-gray-500">Avg. utilization</div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="text-2xl font-bold text-gray-900">Instant</div>
                <div className="text-xs text-gray-500">Payouts</div>
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div 
            className="lg:pl-8"
            variants={fadeInUp}
          >
            <div className="aspect-[4/3] w-full rounded-2xl border bg-white shadow-sm grid place-items-center">
              <img src="/bg_image.png" alt="Partner Dashboard Preview" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

