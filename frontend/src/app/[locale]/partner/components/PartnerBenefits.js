'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { DollarSign, Calendar, Shield } from 'lucide-react';

export default function PartnerBenefits() {
  const t = useTranslations('partner_benefits');
  const benefits = [
    { 
      icon: DollarSign, 
      title: t('benefit_1_title'), 
      desc: t('benefit_1_desc'),
      color: 'bg-green-500/20 text-green-400'
    },
    { 
      icon: Calendar, 
      title: t('benefit_2_title'), 
      desc: t('benefit_2_desc'),
      color: 'bg-blue-500/20 text-blue-400'
    },
    { 
      icon: Shield, 
      title: t('benefit_3_title'), 
      desc: t('benefit_3_desc'),
      color: 'bg-purple-500/20 text-purple-400'
    },
  ];

  return (
    <section id="benefits" className="relative scroll-mt-16 py-16">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">{t('heading')}</h2>
          <p className="text-gray-400">{t('description')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              className="p-8 rounded-none border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className={`p-4 rounded-none w-fit mb-6 ${benefit.color}`}>
                <benefit.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{benefit.title}</h3>
              <p className="text-gray-400 leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

