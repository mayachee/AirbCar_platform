'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Cookie, Settings, ShieldCheck, BarChart3, Megaphone } from 'lucide-react';

const CookieToggle = ({ id, label, description, icon: Icon, checked, onChange, disabled = false }) => (
  <div className="flex">
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="font-semibold text-white cursor-pointer select-none">
          {label}
        </label>
        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
            <input 
                type="checkbox" 
                id={id} 
                className="peer sr-only" 
                checked={checked} 
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={`block w-12 h-6 rounded-full transition-colors duration-200 ${disabled ? 'bg-indigo-400/20 cursor-not-allowed' : 'bg-gray-600 peer-checked:bg-indigo-600 cursor-pointer'}`}></div>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    functional: true
  });

  const handleToggle = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // In a real app, you would save these to a cookie or backend
    alert('Preferences saved! (This is a demo)');
  };

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
          <div className="px-8 py-10">
            <h1 className="text-4xl font-bold text-center mb-4 text-white">Cookie Settings</h1>
            <p className="text-center text-indigo-200 text-lg">
              Simple controls to manage your privacy.
            </p>
          </div>

          {/* Content */}
          <div className="px-2 py-8 text-gray-300">
            <div className="prose max-w-none text-gray-300 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-3">What are cookies?</h2>
                <p className="text-lg leading-relaxed text-gray-300">
                  Cookies are small digital text files that websites save on your computer or phone. Think of them like a "visitor's badge" or a memory note—they help the website recognize who you are when you come back.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-3">How do they work?</h2>
                <p className="text-lg leading-relaxed text-gray-300">
                  When you visit a site, it gives your browser a cookie. The next time you visit, your browser shows that cookie to the site. This allows the website to remember important things, like keeping you logged in, remembering what you put in your shopping cart, or saving your language preferences.
                </p>
              </section>

              <p className="text-lg leading-relaxed text-gray-300 pt-4">
                Below, you can choose which types of cookies you are comfortable with us using.
              </p>
            </div>

            <div className="space-y-6">
              <CookieToggle
                id="essential"
                label="Essential Cookies"
                description="These are vital for the site to work securely and correctly. They handle things like logging in and page navigation. Because the site breaks without them, they cannot be turned off."
                icon={ShieldCheck}
                checked={preferences.essential}
                onChange={() => {}}
                disabled={true}
              />

              <CookieToggle
                id="analytics"
                label="Analytics Cookies"
                description="These help us understand how people use our site—like which pages are most popular. This data is anonymous and helps us improve the experience for everyone."
                icon={BarChart3}
                checked={preferences.analytics}
                onChange={(val) => handleToggle('analytics', val)}
              />

              <CookieToggle
                id="functional"
                label="Functional Cookies"
                description="These remember your specific choices, such as your username, language, or region, to verify your identity and give you a more personal experience."
                icon={Settings}
                checked={preferences.functional}
                onChange={(val) => handleToggle('functional', val)}
              />

              <CookieToggle
                id="marketing"
                label="Marketing Cookies"
                description="These are used to show you ads that are relevant to your interests, instead of random advertisements. They may track your activity across other websites."
                icon={Megaphone}
                checked={preferences.marketing}
                onChange={(val) => handleToggle('marketing', val)}
              />
            </div>

            <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row gap-4 justify-end">
              <button 
                  onClick={() => setPreferences({ essential: true, analytics: false, marketing: false, functional: false })}
                  className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition"
              >
                Reject All
              </button>
              <button 
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition transform active:scale-95"
              >
                Save Preferences
              </button>
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
