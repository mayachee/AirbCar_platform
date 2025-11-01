'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Handshake, Rocket } from 'lucide-react';

export default function PartnerCTA() {
  return (
    <section className="bg-orange-50 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-8 flex-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Handshake className="w-12 h-12 md:w-16 md:h-16 text-orange-600" />
              </div>
            </motion.div>
            <div className="flex-1">
              <motion.div
                className="text-xs uppercase tracking-wider text-orange-600 font-semibold mb-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                REACH THE WORLD
              </motion.div>
              <motion.h2
                className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                Ready to get more rentals?
                <Rocket className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              </motion.h2>
              <motion.p
                className="text-base md:text-lg text-gray-700"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                Setting up takes <span className="font-bold">less than 5 minutes</span> to complete, <span className="font-bold">and its free!</span>
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          >
            <motion.a
              href="#partner-form"
              className="px-6 md:px-8 py-3 md:py-4 bg-orange-600 text-white font-semibold rounded-lg uppercase text-sm md:text-base flex items-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              SIGNUP NOW
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

