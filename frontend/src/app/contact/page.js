'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ContactHero, ContactInfo, TeamContact } from './components';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans text-white">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <ContactHero />
        <ContactInfo />
        <TeamContact />
      </main>

      <Footer />
    </div>
  );
}
