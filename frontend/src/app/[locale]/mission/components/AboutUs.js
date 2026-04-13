'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Shield, Zap, Users, Leaf } from 'lucide-react';

const getValues = (t) => [
  {
    icon: Shield,
    title: t('value_safety'),
    description: t('value_safety_desc')
  },
  {
    icon: Zap,
    title: t('value_innovation'),
    description: t('value_innovation_desc')
  },
  {
    icon: Users,
    title: t('value_community'),
    description: t('value_community_desc')
  },
  {
    icon: Leaf,
    title: t('value_sustainability'),
    description: t('value_sustainability_desc')
  }
];

export default function AboutUs() {
  const t = useTranslations('about');
  const values = getValues(t);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
         <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-orange-500/30 rounded-none blur-[80px]" />
         <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-blue-500/20 rounded-none blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mx-auto text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {t('heading')}
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-6">
            {t('mission_intro')}
          </p>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
            {t('mission_vision')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-none border border-slate-700/50 hover:border-orange-500/50 hover:bg-slate-800/60 transition-all group"
                >
                    <div className="w-12 h-12 bg-orange-500/10 rounded-none flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                        <item.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                        {item.description}
                    </p>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
