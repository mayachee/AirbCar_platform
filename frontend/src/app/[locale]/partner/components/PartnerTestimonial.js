'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';

export default function PartnerTestimonial() {
  const t = useTranslations('partner_testimonial');
  return (
    <section id="testimonials" className="relative py-24 scroll-mt-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          className="relative bg-orange-500/5 border border-orange-500/10 rounded-none p-8 md:p-16 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Decorative Quote Icon */}
          <div className="absolute top-8 left-8 text-orange-500/20">
            <Quote className="w-24 h-24 transform -scale-x-100" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.5fr_1fr] items-center gap-12">
            <div className="space-y-8">
              <motion.div 
                className="flex gap-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-orange-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </motion.div>
              
              <motion.blockquote
                className="text-2xl md:text-4xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                "{t('quote_start')} <span className="text-orange-500">{t('quote_highlight')}</span>{t('quote_middle')}"
              </motion.blockquote>
              
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <div className="font-bold text-xl text-white">{t('author_name')}</div>
                  <div className="text-gray-400 font-medium">{t('author_title')}</div>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            >
              <div className="absolute inset-0 bg-orange-500/20 rounded-none transform rotate-6 translate-x-4 translate-y-4" />
              <div className="relative rounded-none overflow-hidden shadow-2xl aspect-square border-2 border-white/10">
                <img 
                  src="https://pbs.twimg.com/profile_images/1917726086734979074/GupYtYsR_400x400.jpg" 
                  alt="M. Yassine AYACHE" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

