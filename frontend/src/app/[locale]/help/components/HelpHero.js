'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HelpHero() {
  const t = useTranslations('help_hero');
  return (
    <section className="relative pt-24 pb-12 md:pt-48 md:pb-32 px-4 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-orange-600/10 to-transparent -z-10 blur-[100px] pointer-events-none" />
      
      {/* Floating Shapes */}
      <div className="absolute top-20 right-10 w-40 h-40 md:w-64 md:h-64 bg-orange-500/10 rounded-none blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-32 h-32 md:w-48 md:h-48 bg-amber-500/10 rounded-none blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border border-orange-500/20 bg-orange-500/5 backdrop-blur-md text-orange-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-none bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            {t('badge')}
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-tight">
            {t('heading_start')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 drop-shadow-sm">
              {t('heading_highlight')}
            </span>
          </h1>
          
          <p className="text-gray-400 text-sm sm:text-base md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed font-medium px-2">
            {t('description')}
          </p>

          <div className="pt-2 md:pt-4">
              <Link 
                  href="/contact"
                  className="inline-flex items-center gap-2 md:gap-3 bg-white text-black px-6 py-3 md:px-10 md:py-5 rounded-none font-bold text-sm md:text-lg hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1 transform duration-300"
              >
                  {t('button')}
                   <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
              </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
