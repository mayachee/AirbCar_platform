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
      imageSrc: '/info-background.png',
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
      imageSrc: '/info-background.png',
      onClick: () => router.push('/partner'),
    },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-transparent overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.04, 0.08, 0.04],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.06, 0.03],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Earn money with Airbcar
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed font-light">
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
                  {/* Image Side - Enhanced with glass-morphism border */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                    className={isImageLeft ? 'order-1' : 'order-2'}
                  >
                    <motion.div 
                      className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 group"
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* Glass-morphism border effect */}
                      <motion.div 
                        className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{
                          background: [
                            'linear-gradient(90deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1), transparent)',
                            'linear-gradient(180deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1), transparent)',
                            'linear-gradient(90deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1), transparent)',
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      
                      {/* Image container */}
                      <div className="relative w-full h-full overflow-hidden rounded-3xl">
                        <img 
                          src={option.imageSrc}
                          alt={option.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        {/* Gradient overlay for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {/* Shine effect on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                          animate={{
                            x: ['-200%', '200%'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: 'linear',
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Text Side - Enhanced with modern styling */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className={isImageLeft ? 'order-2' : 'order-1'}
                  >
                    <div className="space-y-6">
                      {/* Small heading with gradient accent */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className="text-sm font-semibold text-orange-500 uppercase tracking-wide"
                      >
                        {option.smallHeading}
                      </motion.p>

                      {/* Large heading with gradient */}
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
                      >
                        {option.title}
                      </motion.h3>

                      {/* Description */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.6 }}
                        className="text-lg text-gray-300 leading-relaxed"
                      >
                        {option.description}
                      </motion.p>

                      {/* Button with enhanced glass-morphism */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.7 }}
                      >
                        <motion.button
                          onClick={option.onClick}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 overflow-hidden"
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
                          <span className="relative z-10">{option.buttonText}</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
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
