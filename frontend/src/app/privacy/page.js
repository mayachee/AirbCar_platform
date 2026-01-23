'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Shield, Lock, Eye, FileText, Mail, Share2, Clock, UserCheck, RefreshCw, Cookie, Globe } from 'lucide-react';

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-center mb-4 text-white">Privacy Policy</h1>
            <p className="text-center text-blue-200 text-lg">
              We are committed to protecting your personal information and your right to privacy.
            </p>
            <div className="text-center mt-4 text-sm font-medium text-gray-400">
              Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Content */}
          <div className="px-2 py-8 text-gray-300">

            <div className="prose max-w-none text-gray-300 mb-12">
              <p className="text-lg leading-relaxed text-gray-300">
                Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights concerning your data. We've included simple summaries to help you understand exactly what's happening with your information.
              </p>
            </div>
            
            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-blue-500" />
                1. Information We Collect
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We collect info you give us (like your name) and info about how you use the site.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We collect personal information that you voluntarily provide to us when you register on the 
                Services, express an interest in obtaining information about us or our products and Services, 
                when you participate in activities on the Services, or otherwise when you contact us.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-300">
                <li><strong className="text-white">Personal Information:</strong> Names, phone numbers, email addresses, mailing addresses, billing addresses, debit/credit card numbers, and other similar information.</li>
                <li><strong className="text-white">Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number (such as a credit card number), and the security code associated with your payment instrument.</li>
                <li><strong className="text-white">Social Media Login Data:</strong> We provide you with the option to register with us using your existing social media account details, like your Facebook, Twitter, or other social media account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
                2. How We Use Your Information
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                <strong>Simply put:</strong> We use your info to run the site, take payments, and keep things secure.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We use personal information collected via our Services for a variety of business purposes described below. 
                We process your personal information for these purposes in reliance on our legitimate business interests, 
                in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">Account Management</h3>
                  <p className="text-sm text-gray-400">To facilitate account creation and logon process, and manage user accounts.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">Order Fulfillment</h3>
                  <p className="text-sm text-gray-400">To fulfill and manage your orders, payments, returns, and exchanges made through the Services.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">Security</h3>
                  <p className="text-sm text-gray-400">To protect our Services (e.g., fraud monitoring and prevention).</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">Communication</h3>
                  <p className="text-sm text-gray-400">To send you administrative information and marketing and promotional communications.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Share2 className="w-6 h-6 text-blue-500" />
                3. Who Will Your Information Be Shared With?
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> We only share info if we have to (like for payments) or if you give us permission.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We only share and disclose your information in the following situations: 
                <span className="block mt-2 pl-4 border-l-2 border-gray-700">
                  • <strong>Compliance with Laws:</strong> We may disclose your information where we are legally required to do so.<br/>
                  • <strong>Business Transfers:</strong> We may share or transfer your information in connection with a merger or sale of company assets.<br/>
                  • <strong>Vendors and Processors:</strong> We may share your data with third-party vendors who perform services for us (like payment processing or hosting).
                </span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-500" />
                4. Do We Use Cookies?
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> Yes, we use them to make the site work better. You can control them.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We may use cookies and other tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-500" />
                5. How Long Do We Keep Your Information?
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> We keep it as long as we need it to provide the service or as required by law.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-500" />
                6. Security of Your Information
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> We work hard to keep your data safe, but no system is perfect.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We have implemented appropriate technical and organizational security measures designed to protect the 
                security of any personal information we process. However, despite our safeguards and efforts to secure 
                your information, no electronic transmission over the Internet or information storage technology can be 
                guaranteed to be 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-blue-500" />
                7. Your Privacy Rights
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> Depending on where you live, you have rights like asking to see or delete your data.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-blue-500" />
                8. Updates to this Policy
              </h2>
               <p className="mb-4 leading-relaxed text-gray-300">
                 <strong>Simply put:</strong> We'll update this page if our practices change.
              </p>
              <p className="mb-4 leading-relaxed text-gray-400 text-sm">
                We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-blue-500" />
                9. Contact Us
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                If you have questions or comments about this policy, you may email us at <a href="mailto:privacy@airbcar.com" className="text-blue-400 hover:text-blue-300 hover:underline">privacy@airbcar.com</a>.
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
