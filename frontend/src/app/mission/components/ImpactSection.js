'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import SectionWrapper from './SectionWrapper';

export default function ImpactSection() {
  const [activeTab, setActiveTab] = useState('Boosting partner earning opportunities');

  const tabs = [
    'Boosting partner earning opportunities',
    'Diversity and inclusion',
    'Sustainable communities'
  ];

  const tabContent = {
    'Boosting partner earning opportunities': {
      image: '/image_homepage.png',
      dataNote: '*Data: Thailand, Nigeria, South Africa, Netherlands, UK',
      facts: [
        "3.5 million+ drivers and couriers worldwide, including 1 million+ partners in Africa",
        "Up to 80% of drivers on AirbCar's platform have a tenure longer than 5 years *",
        "Up to 90% of drivers agree that AirbCar platform offers autonomy and flexibility *",
        "50% of drivers on AirbCar platform use ride-hailing to supplement their main source of income *"
      ]
    },
    'Diversity and inclusion': {
      image: '/Figure.jpg',
      dataNote: '*Data: Various regions',
      facts: [
        "Committed to creating equal opportunities for all",
        "Supporting diverse communities across all markets",
        "Inclusive platform design and policies"
      ]
    },
    'Sustainable communities': {
      image: '/ChatGPT Image Jul 22, 2025, 02_32_15 PM.png',
      dataNote: '*Data: Global impact',
      facts: [
        "Reducing carbon footprint through shared mobility",
        "Supporting sustainable urban development",
        "Contributing to cleaner cities worldwide"
      ]
    }
  };

  const currentContent = tabContent[activeTab];

  return (
    <div className="relative py-20 bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden">
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
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Section: The Impact */}
        <SectionWrapper delay={0.1}>
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-28 items-center mb-20">
            {/* Image with enhanced styling */}
            <motion.div
              className="w-full lg:w-[560px] flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-2xl group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glass-morphism border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <img
                  src="/Figure1.jpg"
                  alt="The impact"
                  className="w-full h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </motion.div>

            {/* Text Content with enhanced styling */}
            <motion.div
              className="flex-1 max-w-[464px]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 leading-[56px] tracking-[-0.48px]">
                The impact
              </h2>
              <div className="text-xl text-gray-600 leading-7 tracking-[-0.176px] space-y-1 font-light">
                <p>By offering a convenient alternative to every</p>
                <p>purpose a private car serves, AirbCar's shared</p>
                <p>mobility platform can help reduce the number of</p>
                <p>trips made by private cars. This will ultimately lead</p>
                <p>to better cities with less traffic congestion,</p>
                <p>pollution, and land taken up by parking spaces.</p>
                <p>People will still go wherever they need to go, but</p>
                <p>will do so with a mix of ride-hailing, car-sharing,</p>
                <p>public transport, micromobility, walking and</p>
                <p>cycling, depending on a trip's purpose.</p>
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
              <h3 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-[48px] tracking-[-0.4px]">
                Key facts of our impact
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
                  className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 overflow-hidden ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-gray-600 shadow-lg shadow-orange-500/30'
                      : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:border-orange-300 hover:text-orange-600 shadow-md'
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
                  className="relative rounded-3xl overflow-hidden shadow-2xl group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Glass-morphism border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <img
                    src={currentContent.image}
                    alt={activeTab}
                    className="w-full h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </motion.div>

              {/* Facts List with enhanced styling */}
              <motion.div
                className="flex-1 max-w-[464px]"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-8">
                  {/* Data Note */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-500 tracking-[-0.176px] font-medium"
                  >
                    {currentContent.dataNote}
                  </motion.p>

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
                          className="w-8 h-8 bg-orange-600 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <div className="w-3 h-3 rounded-full" />
                        </motion.div>
                        <p className="text-base text-gray-600 leading-6 tracking-[-0.176px] group-hover:text-gray-900 transition-colors">
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
