'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ScrollText, CheckCircle, AlertTriangle, Scale, Gavel, FileText, Link as LinkIcon, MessageSquare, Copyright, RefreshCw, Mail } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans text-gray-100">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-none bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-none bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />

      <main className="relative z-20 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="">
          {/* Header */}
          <div className="">
            <h1 className="text-4xl font-bold text-center mb-4 text-white">{t('page_title')}</h1>
            <p className="text-center text-emerald-200 text-lg">
              {t('subtitle')}
            </p>
            <div className="text-center mt-4 text-sm font-medium text-gray-400">
              {t('last_updated', { date: lastUpdated })}
            </div>
          </div>

          {/* Content */}
          <div className="px-2 py-8 text-gray-300">
            
            <div className="prose max-w-none text-gray-300 mb-12">
              <p className="text-lg leading-relaxed text-gray-300">
                {t('intro')}
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <ScrollText className="w-6 h-6 text-emerald-500" />
                {t('heading_1')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_1')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('agreement_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                {t('heading_2')}
              </h2>
              <div className="space-y-4">
                 <p className="leading-relaxed text-gray-300">
                  <strong>{t('simply_put_2')}</strong>
                </p>
                <div className="bg-emerald-900/20 p-4 rounded-none border border-emerald-800/50">
                  <h4 className="font-semibold text-emerald-300 mb-2">{t('responsibilities_title')}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-200/80">
                    <li>{t('responsibility_1')}</li>
                    <li>{t('responsibility_2')}</li>
                    <li>{t('responsibility_3')}</li>
                  </ul>
                </div>
                <p className="leading-relaxed text-gray-400 text-sm">
                  {t('account_desc')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-emerald-500" />
                {t('heading_3')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_3')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('prohibited_desc')}
              </p>
              <ul className="grid md:grid-cols-2 gap-3">
                {[
                  t('prohibited_1'),
                  t('prohibited_2'),
                  t('prohibited_3'),
                  t('prohibited_4'),
                  t('prohibited_5'),
                  t('prohibited_6')
                ].map((activity, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm bg-gray-800/50 p-3 rounded border border-gray-700/50">
                    <span className="w-1.5 h-1.5 rounded-none bg-red-400 mt-2 block" />
                    {activity}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Copyright className="w-6 h-6 text-emerald-500" />
                {t('heading_4')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_4')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('ip_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
                {t('heading_5')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_5')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('content_desc')}
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <LinkIcon className="w-6 h-6 text-emerald-500" />
                {t('heading_6')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_6')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('links_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Gavel className="w-6 h-6 text-emerald-500" />
                {t('heading_7')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_7')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('termination_desc')}
              </p>
            </section>

            <section className="bg-gray-800/50 rounded-none p-6 border border-gray-700">
               <h2 className="text-lg font-bold text-white mb-2">{t('heading_8')}</h2>
               <p className="text-gray-300 mb-2">
                 <strong>{t('simply_put_8')}</strong>
               </p>
               <p className="text-sm text-gray-400">
                 {t('disclaimer_desc')}
               </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-emerald-500" />
                {t('heading_9')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_9')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('changes_desc')}
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-emerald-500" />
                {t('heading_10')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_10')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('contact_desc')} <a href={`mailto:${t('contact_email')}`} className="text-blue-400 hover:text-blue-300 hover:underline">{t('contact_email')}</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Smooth transition to footer */}
      <div className="h-24 bg-gradient-to-b from-[#0F172A] to-[#0B0F19]" />
      <Footer />
    </div>
  );
}
