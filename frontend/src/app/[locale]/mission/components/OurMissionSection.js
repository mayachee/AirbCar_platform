'use client';

import { motion } from 'framer-motion';

export default function OurMissionSection() {

  return (
    <section className="pt-0 pb-4 md:pb-12">
        {/* Vision Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 space-y-6 sm:p-12 mb-4 md:mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Our Vision</h2>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed font-light">
              At <span className="text-orange-400 font-semibold">AirbCar</span>, we believe in creating a future where mobility is 
              <span className="text-white font-medium"> sustainable</span>, 
              <span className="text-white font-medium"> accessible</span>, and 
              <span className="text-white font-medium"> community-driven</span>. 
              We're transforming how people move through cities by providing innovative transportation solutions that reduce environmental impact while connecting communities.
            </p>
          </motion.div>
    </section>
  );
}
