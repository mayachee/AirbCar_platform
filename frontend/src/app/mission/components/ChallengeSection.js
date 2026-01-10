'use client';

import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';

export default function ChallengeSection() {
  return (
    <div className="relative py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="">
        <SectionWrapper delay={0.1}>
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-28 items-center">
            
            {/* Text Content with enhanced styling */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent mb-6 leading-[56px] tracking-[-0.48px]">
                The challenge
              </h2>
              <div className="text-xl text-gray-300 leading-7 space-y-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <p>For decades, cities have been built for cars,
                  neglecting pedestrians and light vehicles.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <p>Today, cities devote up to 60% of urban land to
                  car infrastructure. Passenger transport accounts
                  for almost half of global transport emissions. It is
                  also the primary cause of air pollution that can
                  lead to serious health problems. That's
                  astonishing, given private cars sit idle for up to
                  95% of the time.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <p>As the global urban population is projected to
                  double by 2050, cities, their citizens, and the
                  transport sector must work together to drive
                  positive change.</p>
                </motion.div>
              </div>
            </motion.div>
            {/* Image with enhanced styling */}
            <motion.div
              className="w-full lg:w-[560px] flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-2xl group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glass-morphism border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <img
                  src="https://cdn.cosmos.so/5d771d19-58c5-4e06-b42c-7079a660f3b1?format=jpeg"
                  alt="The challenge"
                  className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </motion.div>
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
}
