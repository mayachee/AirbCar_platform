'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function CitiesForPeopleSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative bg-black text-white py-24 sm:py-32 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-6"
          >
            {/* Main Headline */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              Making cities for people,<br />not cars.
            </h2>
            
            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed pt-4">
              By sharing our knowledge of the industry and real-time data we're helping to improve our cities.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

