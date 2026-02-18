'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function SafetyDriverSection() {
  const t = useTranslations('safety');
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            className="flex-1 space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              {t('driver_heading')} <span className="text-orange-500">{t('driver_highlight')}</span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t('driver_subtitle')}
            </p>
            
            <ul className="space-y-4">
              {[
                t('driver_check_1'),
                t('driver_check_2'),
                t('driver_check_3'),
                t('driver_check_4')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-200">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-sm">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
             <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="aspect-[4/3] relative bg-gray-800">
                   {/* Placeholder for Driver Image */}
                   <img 
                     src="https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_1w7h0z1w7h0z1w7h.png?updatedAt=1769818267071" 
                     alt="Verified Driver"
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <div>
                            <div className="font-semibold text-white">{t('driver_badge_title')}</div>
                            <div className="text-xs text-gray-300">{t('driver_badge_rating')}</div>
                        </div>
                    </div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
