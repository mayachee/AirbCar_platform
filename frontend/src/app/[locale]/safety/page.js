'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  SafetyHero, 
  SafetyFeatures,
  SafetyDriverSection,
  SafetyRiderSection,
  SafetyProtectionSection,
} from './components';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans text-white">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-[120px]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative z-20">
        <SafetyHero />
        <SafetyFeatures />
        <SafetyProtectionSection />
        <SafetyDriverSection />
        <SafetyRiderSection />
      </main>

      <Footer />
    </div>
  );
}
