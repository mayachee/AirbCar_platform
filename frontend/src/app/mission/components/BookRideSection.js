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
    <section ref={ref} className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Latest features
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Book a ride in advance
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Planning a trip? Schedule a Bolt ride in advance for even more convenient airport transfers, important meetings, or any occasion that requires punctuality. Simply enter your details and secure your ride up to 90 days ahead.
              </p>
              
              {/* Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </motion.div>
                  );
                })}
              </div>

              <Button
                size="lg"
                onClick={() => router.push('/search')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
              >
                Book now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-blue-400/20 to-purple-400/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-6 p-8">
                    <Calendar className="h-24 w-24 text-orange-500 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-gray-900">Schedule Your Ride</h3>
                      <p className="text-gray-600">Book up to 90 days in advance</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

