'use client';

import { motion } from 'framer-motion';

export default function PartnerTestimonial() {
  return (
    <section id="testimonials" className="bg-white border-t scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          className="bg-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1">
            <motion.blockquote
              className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              "Getting Our vehicle online was quick.
              Managing all my reservations has been very
              easy. Customer support is excellent, they
              are always ready to help."
            </motion.blockquote>
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="font-semibold text-lg text-gray-900">M. Yassine AYACHE</div>
              <div className="text-sm text-gray-600">AirbCar Co-Founder</div>
            </motion.div>
          </div>
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-orange-100 shadow-xl bg-gray-100 flex items-center justify-center">
              <img src="https://pbs.twimg.com/profile_images/1917726086734979074/GupYtYsR_400x400.jpg" alt="M. Yassine AYACHE" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

