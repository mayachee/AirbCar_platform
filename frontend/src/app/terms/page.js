'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ScrollText, CheckCircle, AlertTriangle, Scale, Gavel, FileText, Link as LinkIcon, MessageSquare, Copyright, RefreshCw, Mail } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
        <div className="">
          {/* Header */}
          <div className="">
            <h1 className="text-4xl font-bold text-center mb-4 text-white">Terms of Service</h1>
            <p className="text-center text-emerald-200 text-lg">
              Please read these terms carefully before using our services.
            </p>
            <div className="text-center mt-4 text-sm font-medium text-gray-400">
              Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Content */}
          <div className="px-2 py-8 text-gray-300">
            
            <div className="prose max-w-none text-gray-300 mb-12">
              <p className="text-lg leading-relaxed text-gray-300">
                Welcome to AirbCar! These Terms of Service are like a contract between you and us. They explain your rights and responsibilities when using our platform. We've tried to make them as clear as possible, but please read them carefully.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <ScrollText className="w-6 h-6 text-emerald-500" />
                1. Agreement to Terms
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> By using our site, you agree to follow these rules.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to all of these Terms, 
                then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                2. User Accounts
              </h2>
              <div className="space-y-4">
                 <p className="leading-relaxed text-gray-300">
                  <strong>Simply put:</strong> You are responsible for your account. Keep your password safe and tell us if the information changes.
                </p>
                <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-800/50">
                  <h4 className="font-semibold text-emerald-300 mb-2">Your Responsibilities:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-200/80">
                    <li>Keep your password secret and secure.</li>
                    <li>Provide real and accurate information about yourself.</li>
                    <li>Let us know right away if you think someone else is using your account.</li>
                  </ul>
                </div>
                <p className="leading-relaxed text-gray-400 text-sm">
                  When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
                  Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-emerald-500" />
                3. Prohibited Activities
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> Be nice, don't break the law, and don't try to break our website.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="grid md:grid-cols-2 gap-3">
                {[
                  "Breaking any laws or regulations",
                  "Stealing or copying content that isn't yours",
                  "Sending spam or unwanted messages",
                  "Trying to hack or damage the website",
                  "Reverse engineering our software",
                  "Bullying, harassing, or threatening others"
                ].map((activity, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm bg-gray-800/50 p-3 rounded border border-gray-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 block" />
                    {activity}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Copyright className="w-6 h-6 text-emerald-500" />
                4. Intellectual Property
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We own the brand, logo, and code. You own your personal content.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of AirbCar and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of AirbCar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
                5. Your Content
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> You are responsible for what you post (like car listings and reviews).
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <LinkIcon className="w-6 h-6 text-emerald-500" />
                6. Links to Other Websites
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We aren't responsible for links that lead outside our website.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                Our Service may contain links to third-party web sites or services that are not owned or controlled by AirbCar. 
                AirbCar has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Gavel className="w-6 h-6 text-emerald-500" />
                7. Termination
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We can ban you if you break these rules.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
                including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
               <h2 className="text-lg font-bold text-white mb-2">8. Disclaimers & Limitation of Liability</h2>
               <p className="text-gray-300 mb-2">
                 <strong>Simply put:</strong> We do our best, but we aren't perfect. We provide the service "as is" and aren't liable for certain types of damages.
               </p>
               <p className="text-sm text-gray-400">
                 The service is provided on an "AS IS" and "AS AVAILABLE" basis. AirbCar expressly disclaims all warranties of any kind, whether express or implied.
                 In no event shall AirbCar, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, 
                 special, consequential or punitive damages.
               </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-emerald-500" />
                9. Changes to These Terms
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We might change these rules properly. If the changes are big, we'll tell you.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-emerald-500" />
                10. Contact Us
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> If you have questions, just ask!
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                If you have any questions about these Terms, please contact us at support@airbcar.com or via our contact page.
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
