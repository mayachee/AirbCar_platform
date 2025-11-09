'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Plane, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export default function BookRideSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const router = useRouter();

  const features = [
    { icon: Plane, text: 'Airport transfers' },
    { icon: Briefcase, text: 'Important meetings' },
    { icon: Clock, text: 'Any occasion requiring punctuality' },
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 right-20 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span 
                className="inline-block text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider mb-4"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                Latest features
              </motion.span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 leading-tight">
                Book a ride in advance
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Planning a trip? Schedule a Bolt ride in advance for even more convenient airport transfers, important meetings, or any occasion that requires punctuality. Simply enter your details and secure your ride up to 90 days ahead.
              </p>
              
              {/* Features with enhanced styling */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 group cursor-default"
                    >
                      <motion.div 
                        className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className="h-6 w-6 text-orange-600" />
                      </motion.div>
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{feature.text}</span>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/search')}
                  className="relative bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all flex items-center gap-2 group overflow-hidden"
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-orange-600"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: 'linear',
                    }}
                  />
                  <span className="relative z-10">Book now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Image Placeholder with enhanced glass-morphism */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.div 
                className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glass-morphism border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400/20 via-blue-400/20 to-purple-400/20 backdrop-blur-sm">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="text-center space-y-6 p-8"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Calendar className="h-24 w-24 text-orange-500 mx-auto drop-shadow-lg" />
                      <div className="space-y-2">
                        <h3 className="text-3xl font-bold text-gray-900">Schedule Your Ride</h3>
                        <p className="text-gray-600">Book up to 90 days in advance</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

