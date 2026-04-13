'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Handshake, Rocket } from 'lucide-react';

export default function PartnerCTA() {
  const t = useTranslations('partner_cta');
  return (
    <section className="py-12 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="bg-orange-500/5 border border-orange-500/10 rounded-none p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center text-center md:text-left gap-6 md:gap-8 flex-1 w-full">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-none bg-orange-500/20 flex items-center justify-center border border-orange-500/20">
                <Handshake className="w-12 h-12 md:w-16 md:h-16 text-orange-500" />
              </div>
            </motion.div>
            <div className="flex-1 w-full">
              <motion.div
                className="text-xs uppercase tracking-wider text-orange-500 font-semibold mb-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                {t('label')}
              </motion.div>
              <motion.h2
                className="text-2xl md:text-4xl font-bold text-white mb-3 flex flex-wrap items-center justify-center md:justify-start gap-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                {t('heading')}
              </motion.h2>
              <motion.p
                className="text-base md:text-lg text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                {t('description')}
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <motion.a
              href="/auth?mode=signup&role=partner"
              className="px-6 md:px-8 py-3 md:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-none uppercase text-sm md:text-base flex items-center gap-2 shadow-lg transition-colors"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              {t('button')}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

