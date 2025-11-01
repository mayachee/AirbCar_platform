'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Layout wrapper for mission page
 * Provides consistent structure with Header and Footer
 */
export default function MissionLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

