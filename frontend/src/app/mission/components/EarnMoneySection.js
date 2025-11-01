'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Truck, Store, ArrowRight, Users, Building2 } from 'lucide-react';

export default function EarnMoneySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const router = useRouter();

  const earnOptions = [
    {
      smallHeading: 'Earn money as a Airbcar driver',
      title: 'Drive and earn money',
      description: "Our 200+ million riders will send you plenty of ride requests. When demand is high, you can earn even more.",
      buttonText: 'Register to drive',
      imageSide: 'left',
      imageSrc: '/large_pexels_vlada_karpovich_4050388_caa0bc8107.jpg',
      onClick: () => router.push('/partner'),
    },
    {
      smallHeading: 'Become a Airbcar courier partner',
      title: 'Earn with every delivery',
      description: "You decide when and how often you deliver — weekdays, evenings, weekends, or just the occasional hour — it's up to you.",
      buttonText: 'Register as a courier',
      imageSide: 'right',
      imageSrc: '/hero-woman-orange.jpg',
      onClick: () => router.push('/partner'),
    },
    {
      smallHeading: 'Increase earnings as merchant',
      title: 'Increase your sales and reach new customers',
      description: 'Millions of our users are ordering food or goods from restaurants and stores just like yours.',
      buttonText: 'Register with Airbcar Food',
      imageSide: 'left',
      imageSrc: '/635798891991116891-ThinkstockPhotos-506493415.webp',
      onClick: () => router.push('/partner'),
    },
    {
      smallHeading: 'Join Airbcar with your fleet and earn more',
      title: 'Grow your transport business',
      description: 'As a fleet owner and Airbcar partner, you can manage your assets from one easy-to-use dashboard and grow your transport business.',
      buttonText: 'Register your fleet',
      imageSide: 'right',
      imageSrc: '/partner-cta-bg.jpg',
      onClick: () => router.push('/partner'),
    },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Earn money with Airbcar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
              Join over 4.5 million partners worldwide that earn with Airbcar. For drivers, couriers, merchants, and fleet owners looking for new ways to boost revenue.
            </p>
          </motion.div>

          {/* Earn Options - Alternating Layout */}
          <div className="space-y-24 sm:space-y-32">
            {earnOptions.map((option, index) => {
              const isImageLeft = option.imageSide === 'left';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
                >
                  {/* Image Side */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                    className={isImageLeft ? 'order-1' : 'order-2'}
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                      {/* Placeholder for image - replace with actual images */}
                      {/* <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            {index === 0 && <Car className="h-12 w-12 text-green-600" />}
                            {index === 1 && <Truck className="h-12 w-12 text-blue-600" />}
                            {index === 2 && <Store className="h-12 w-12 text-purple-600" />}
                            {index === 3 && <Building2 className="h-12 w-12 text-orange-600" />}
                          </div>
                          <p className="text-sm text-gray-500">Image placeholder</p>
                        </div>
                      </div> */}
                      <img 
                        src={option.imageSrc}
                        alt={option.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                     
                    </div>
                  </motion.div>

                  {/* Text Side */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className={isImageLeft ? 'order-2' : 'order-1'}
                  >
                    <div className="space-y-6">
                      {/* Small heading */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className="text-sm font-semibold text-orange-600 uppercase tracking-wide"
                      >
                        {option.smallHeading}
                      </motion.p>

                      {/* Large heading */}
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                      >
                        {option.title}
                      </motion.h3>

                      {/* Description */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.6 }}
                        className="text-lg text-gray-600 leading-relaxed"
                      >
                        {option.description}
                      </motion.p>

                      {/* Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.7 }}
                      >
                        <motion.button
                          onClick={option.onClick}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <span>{option.buttonText}</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
