'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Cookie, Settings, ShieldCheck, BarChart3, Megaphone, Info, Globe } from 'lucide-react';

export default function CookiesPage() {
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
            <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
            <p className="text-lg text-white/60">
              Transparency about how we use cookies to improve your experience.
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
                  What are cookies?
                </h2>
                <div className="pl-14 space-y-4">
                  <p className="text-base leading-relaxed text-white/70">
                    Cookies are small digital text files that websites save on your computer or mobile device when you visit them. They act like a "memory" for the website, allowing it to recognize you when you come back or browse between pages.
                  </p>
                  <p className="text-base leading-relaxed text-white/70">
                    They are widely used to make websites work more efficiently and to provide information to the owners of the site. Without cookies, a website would forget you every time you open a new page (for example, it wouldn't be able to keep you logged in).
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
                  How do we use cookies?
                </h2>
                <div className="pl-14">
                  <p className="text-base leading-relaxed text-white/70 mb-4">
                     At AirbCar, we use cookies to improve your experience and to make our services work as expected. Specifically, we use them for:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-white/70">
                     <li><strong>Authentication:</strong> Keeping you signed in as you navigate.</li>
                     <li><strong>Security:</strong> Detecting and preventing fraudulent activity.</li>
                     <li><strong>Preferences:</strong> Remembering your settings (like language or currency).</li>
                     <li><strong>Analytics:</strong> Understanding how users interact with our platform to improve it.</li>
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
                  Types of cookies we use
                </h2>
                
                <div className="grid gap-6 pl-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <ShieldCheck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Essential Cookies</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            These are strictly necessary for the website to function. They allow you to browse the website and use its features, such as accessing secure areas. The website cannot function properly without these.
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Settings className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Functional Cookies</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             These allow the website to remember choices you make (such as your user name, language or the region you are in) and provide enhanced, more personal features.
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <BarChart3 className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Analytics Cookies</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             These help us understand how visitors interact with the website. We use this information to improve the user experience and performance of our services. All information these cookies collect is aggregated and therefore anonymous.
                        </p>
                    </div>
                  </div>

                   <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Megaphone className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Marketing Cookies</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                             These are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.
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
                  Managing Cookies
                </h2>
                <div className="pl-14">
                   <p className="text-base leading-relaxed text-white/70">
                    Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
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
