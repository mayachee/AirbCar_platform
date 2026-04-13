'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  UploadCloud,
  Users,
  CheckCircle2,
  Zap,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const getSteps = (t) => [
  {
    title: t('step_1_title'),
    description: t('step_1_desc'),
    image: 'https://ik.imagekit.io/szcfr7vth/partner_dashboard/pic_9.png',
    accent: t('step_1_accent'),
    icon: UploadCloud
  },
  {
    title: t('step_2_title'),
    description: t('step_2_desc'),
    image: 'https://ik.imagekit.io/szcfr7vth/partner_dashboard/pci_8.png',
    accent: t('step_2_accent'),
    icon: Users
  },
  {
    title: t('step_3_title'),
    description: t('step_3_desc'),
    image: 'https://ik.imagekit.io/szcfr7vth/partner_dashboard/pic_7.png',
    accent: t('step_3_accent'),
    icon: CheckCircle2
  },
  {
    title: t('step_4_title'),
    description: t('step_4_desc'),
    image: 'https://ik.imagekit.io/szcfr7vth/partner_dashboard/pic_6.png',
    accent: t('step_4_accent'),
    icon: Zap
  },
  {
    title: t('step_5_title'),
    description: t('step_5_desc'),
    image: 'https://ik.imagekit.io/szcfr7vth/partner_dashboard/pic_5.png',
    accent: t('step_5_accent'),
    icon: BarChart3
  }
];

export default function PartnerHowItWorks() {
  const t = useTranslations('partner_how_it_works');
  const steps = getSteps(t);
  return (
    <section id="how-it-works" className="py-24 relative scroll-mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-white/10 border border-white/10 text-orange-400 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-none bg-orange-500 animate-pulse"></span>
            {t('badge')}
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t('heading')}
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-400 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {t('description')}
          </motion.p>
        </div>

        <div className="space-y-32">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16 lg:gap-24`}
            >
              <div className="flex-1 space-y-8 relative z-10">
                <div className="flex items-center gap-4 text-orange-400 font-bold tracking-wider text-sm uppercase">
                  <span className="flex items-center justify-center w-12 h-12 rounded-none bg-orange-500/20 text-orange-400 shadow-sm border border-orange-500/20">
                    <step.icon className="w-6 h-6" />
                  </span>
                  <span className="px-3 py-1 rounded-none bg-white/5 border border-white/10">{step.accent}</span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {step.title}
                  </h3>
                  <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-200/50 rounded-none" />
                </div>
                
                <p className="text-lg text-gray-400 leading-relaxed">
                  {step.description}
                </p>
                
                {index === 0 && (
                  <div className="pt-4">
                    <a href="/auth/signup?role=partner" className="inline-flex items-center px-6 py-3 rounded-none bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors">
                      {t('step_1_cta')} <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full relative group">
                 {/* Decorative elements */}
                <div className={`absolute top-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-orange-500/10 to-blue-500/10 rounded-none blur-3xl -z-10 ${index % 2 === 0 ? '-right-10' : '-left-10'}`} />
                
                <div className="relative rounded-none overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-900 transform transition-transform duration-500 hover:scale-[1.02]">
                   <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-auto relative z-10 opacity-90 hover:opacity-100 transition-opacity"
                   />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


