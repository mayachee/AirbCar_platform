'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Shield, Lock, Eye, FileText, Mail, Share2, Clock, UserCheck, RefreshCw, Cookie, Globe } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
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
            <p className="text-center text-blue-200 text-lg">
              {t('commitment')}
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
                <Eye className="w-6 h-6 text-blue-500" />
                {t('heading_1')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_1')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('collect_desc')}
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-300">
                <li><strong className="text-white">{t('personal_info')}:</strong> {t('personal_info_desc')}</li>
                <li><strong className="text-white">{t('payment_data')}:</strong> {t('payment_data_desc')}</li>
                <li><strong className="text-white">{t('social_login')}:</strong> {t('social_login_desc')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
                {t('heading_2')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>{t('simply_put_2')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('use_desc')}
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/50 p-4 rounded-none border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">{t('account_management')}</h3>
                  <p className="text-sm text-gray-400">{t('account_management_desc')}</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-none border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">{t('order_fulfillment')}</h3>
                  <p className="text-sm text-gray-400">{t('order_fulfillment_desc')}</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-none border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">{t('security')}</h3>
                  <p className="text-sm text-gray-400">{t('security_desc')}</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-none border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">{t('communication')}</h3>
                  <p className="text-sm text-gray-400">{t('communication_desc')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Share2 className="w-6 h-6 text-blue-500" />
                {t('heading_3')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_3')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('share_desc')}
                <span className="block mt-2 pl-4 border-l-2 border-gray-700">
                  • <strong>{t('compliance')}:</strong> {t('compliance_desc')}<br/>
                  • <strong>{t('business_transfers')}:</strong> {t('business_transfers_desc')}<br/>
                  • <strong>{t('vendors')}:</strong> {t('vendors_desc')}
                </span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-500" />
                {t('heading_4')}
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_4')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('cookies_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-500" />
                {t('heading_5')}
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_5')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('retention_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-500" />
                {t('heading_6')}
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_6')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('security_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-blue-500" />
                {t('heading_7')}
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_7')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('rights_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-blue-500" />
                {t('heading_8')}
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>{t('simply_put_8')}</strong>
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                {t('updates_desc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-blue-500" />
                {t('heading_9')}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
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
