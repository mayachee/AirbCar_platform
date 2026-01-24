'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = Cookies.get('cookie_consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    Cookies.set('cookie_consent', 'accepted', { expires: 365, secure: true, sameSite: 'strict' });
    setIsVisible(false);
  };

  const handleReject = () => {
    Cookies.set('cookie_consent', 'rejected', { expires: 365, secure: true, sameSite: 'strict' });
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden"
          >
            {/* Header / Continue without accepting */}
            <div className="p-6 pb-2 relative">
              <button 
                onClick={handleReject}
                className="absolute top-6 right-6 text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors"
                aria-label="Refuse cookies"
              >
                Continue without accepting
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 flex items-center gap-2">
                AirbCar uses cookies 🍪
              </h2>
            </div>
            
            {/* Content Body */}
            <div className="px-6 py-2">
              <p className="text-gray-600 text-sm mb-4">
                AirbCar uses cookies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 mb-6">
                <li>
                  Allow you to navigate on the website and use our services efficiently. 
                  These cookies are mandatory and can't be deactivated.
                </li>
                <li>Analyze our website's audience.</li>
                <li>Improve our website's efficiency by measuring performance.</li>
                <li>Measure, improve and personalize our AirbCar ads.</li>
              </ul>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Some of these cookies are set by our partners. 
                You can visit the <Link href="/cookies" className="text-orange-600 hover:text-orange-700 underline underline-offset-2">Cookies</Link> page from the footer of the website any time to customize them and learn more about our policy.
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3 pt-4">
              <button
                onClick={handleAccept}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-98"
              >
                Accept and close
              </button>
              
              <button
                onClick={() => router.push('/cookies')}
                className="w-full py-3.5 px-4 bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors active:scale-98"
              >
                Customize
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
