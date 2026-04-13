'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import SectionWrapper from './SectionWrapper';

export default function ImpactSection() {
  const t = useTranslations('impact');
  const [activeTab, setActiveTab] = useState(t('tab_1_title'));

  const tabs = [
    t('tab_1_title'),
    t('tab_2_title'),
    t('tab_3_title')
  ];

  const tabContent = {
    [t('tab_1_title')]: {
      image: 'https://ik.imagekit.io/szcfr7vth/software.png',
      dataNote: t('tab_1_note'),
      facts: [
        t('tab_1_fact_1'),
        t('tab_1_fact_2'),
        t('tab_1_fact_3'),
        t('tab_1_fact_4'),
        t('tab_1_fact_5')
      ]
    },
    [t('tab_2_title')]: {
      image: 'https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_1w7h0z1w7h0z1w7h.png',
      dataNote: t('tab_2_note'),
      facts: [
        t('tab_2_fact_1'),
        t('tab_2_fact_2'),
        t('tab_2_fact_3'),
        t('tab_2_fact_4'),
        t('tab_2_fact_5'),
        t('tab_2_fact_6')
      ]
    },
    [t('tab_3_title')]: {
      image: 'https://ik.imagekit.io/szcfr7vth/image1.png',
      dataNote: t('tab_3_note'),
      facts: [
        t('tab_3_fact_1'),
        t('tab_3_fact_2'),
        t('tab_3_fact_3'),
        t('tab_3_fact_4'),
        t('tab_3_fact_5'),
        t('tab_3_fact_6')
      ]
    }
  };

  const currentContent = tabContent[activeTab];

  return (
    <div className="relative py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.06, 0.03],
            x: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-orange-400/20 rounded-none blur-3xl"
        />
      </div>

      <div className="space-y-16">
        {/* Top Section: The Impact */}
        <SectionWrapper delay={0.1}>
          <div className="flex flex-col-reverse lg:flex-row gap-14 lg:gap-28 items-center mb-20">
            {/* Image with enhanced styling */}
            <motion.div
              className="w-full lg:w-[560px] flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="relative rounded-none overflow-hidden shadow-2xl group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glass-morphism border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-none blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <img
                  src="https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_jl7bnojl7bnojl7b.png"
                   alt={t('heading')}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </motion.div>

            {/* Text Content with enhanced styling */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-[56px] tracking-[-0.48px]">
                {t('heading')}
              </h2>
              <div className="text-xl text-gray-300 leading-7  space-y-10">
                <p>{t('description')}</p>
              </div>
            </motion.div>
          </div>
        </SectionWrapper>

        {/* Bottom Section: Key Facts */}
        <SectionWrapper delay={0.2}>
          <div className="space-y-10">
            {/* Heading with enhanced styling */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-4xl sm:text-5xl font-bold text-white leading-[48px] tracking-[-0.4px]">
                {t('facts_heading')}
              </h3>
            </motion.div>

            {/* Enhanced Tabs with glass-morphism */}
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {tabs.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 rounded-none text-sm font-medium transition-all duration-300 overflow-hidden ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/5 backdrop-blur-sm text-gray-300 border border-white/10 hover:bg-white/10 hover:border-orange-500/50 hover:text-orange-400 shadow-md'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'linear',
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Tab Panel Content */}
            <motion.div
              key={activeTab}
              className="flex flex-col lg:flex-row gap-14 lg:gap-28 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Image with enhanced styling */}
              <motion.div
                className="w-full lg:w-[560px] flex-shrink-0"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="relative rounded-none overflow-hidden shadow-2xl group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Glass-morphism border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-none blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <img
                    src={currentContent.image}
                    alt={activeTab}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </motion.div>

              {/* Facts List with enhanced styling */}
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-8">
                  {/* Facts with enhanced animations */}
                  <ul className="space-y-6">
                    {currentContent.facts.map((fact, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-4 group"
                      >
                        <motion.div
                          className="w-8 h-8 bg-orange-600 rounded-none flex-shrink-0 mt-0.5 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <div className="w-3 h-3 rounded-none bg-white" />
                        </motion.div>
                        <p className="text-base text-gray-300 leading-6 tracking-[-0.176px] group-hover:text-white transition-colors">
                          {fact}
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
}
