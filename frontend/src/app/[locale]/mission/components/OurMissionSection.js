'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function OurMissionSection() {
  const t = useTranslations('mission_vision');

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
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('heading')}</h2>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed font-light">
              {t('intro')} 
              <span className="text-white font-medium"> {t('sustainable')}</span>, 
              <span className="text-white font-medium"> {t('accessible')}</span>, and 
              <span className="text-white font-medium"> {t('community_driven')}</span>. 
              {t('description')}
            </p>
          </motion.div>
    </section>
  );
}
