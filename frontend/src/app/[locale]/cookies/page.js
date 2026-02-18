'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Cookie, Settings, ShieldCheck, BarChart3, Megaphone, Info, Globe } from 'lucide-react';

export default function CookiesPage() {
  const t = useTranslations('cookies');
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans text-gray-100">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />

      <main className="relative z-20 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className=" mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">{t('page_title')}</h1>
            <p className="text-lg text-white/60">
              {t('subtitle')}
            </p>
          </div>

          {/* Glass Card Content */}
          <div className="">
            <div className="space-y-10 text-gray-300">
              
              {/* What are cookies */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Cookie className="w-6 h-6" />
                  </span>
                  {t('heading_what')}
                </h2>
                <div className="pl-14 space-y-4">
                  <p className="text-base leading-relaxed text-white/70">
                    {t('what_desc_1')}
                  </p>
                  <p className="text-base leading-relaxed text-white/70">
                    {t('what_desc_2')}
                  </p>
                </div>
              </section>

              <div className="h-px bg-white/10" />

              {/* How we use them */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                   <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Info className="w-6 h-6" />
                  </span>
                  {t('heading_how')}
                </h2>
                <div className="pl-14">
                  <p className="text-base leading-relaxed text-white/70 mb-4">
                     {t('how_intro')}
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-white/70">
                     <li><strong>{t('how_auth')}:</strong> {t('how_auth_desc')}</li>
                     <li><strong>{t('how_security')}:</strong> {t('how_security_desc')}</li>
                     <li><strong>{t('how_preferences')}:</strong> {t('how_preferences_desc')}</li>
                     <li><strong>{t('how_analytics')}:</strong> {t('how_analytics_desc')}</li>
                  </ul>
                </div>
              </section>

              <div className="h-px bg-white/10" />

              {/* Types of Cookies */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                   <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Globe className="w-6 h-6" />
                  </span>
                  {t('heading_types')}
                </h2>
                
                <div className="grid gap-6 pl-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <ShieldCheck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t('type_essential')}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {t('type_essential_desc')}
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Settings className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t('type_functional')}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             {t('type_functional_desc')}
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <BarChart3 className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t('type_analytics')}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             {t('type_analytics_desc')}
                        </p>
                    </div>
                  </div>

                   <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Megaphone className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t('type_marketing')}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             {t('type_marketing_desc')}
                        </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/10" />

              {/* Management */}
              <section>
                 <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                   <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Settings className="w-6 h-6" />
                  </span>
                  {t('heading_managing')}
                </h2>
                <div className="pl-14">
                   <p className="text-base leading-relaxed text-white/70">
                    {t('managing_desc')}
                   </p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Smooth transition to footer */}
      <div className="h-24 bg-gradient-to-b from-[#0F172A] to-[#0B0F19]" />
      <Footer />
    </div>
  );
}
