'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  BoltHeroSection,
  OurMissionSection,
  DownloadAppsSection,
  AboutUsSection,
  ChallengeSection,
  ImpactSection,
} from './components';

export default function MissionPage() {
  
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden font-sans">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      {/* Main Content */}
      <main className="relative z-20">
        
        {/* Hero Section */}
        <section id="hero">
           <BoltHeroSection />
        </section>

        {/* Challenge Section */}
        <section id="challenge" className="relative pb-24">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ChallengeSection />
           </div>
        </section>

        {/* Impact Section */}
        <section id="impact" className="relative pb-24">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ImpactSection />
           </div>
        </section>

        {/* About Section (Has its own container and full-width background) */}
        <section id="about" className="">
          <AboutUsSection />
        </section>
        
        {/* Download Section (Has its own container) */}
        <section id="download" className="relative">
          <DownloadAppsSection />
        </section>
        
        {/* Vision Section */}
        <section id="mission" className="relative pt-0 pb-10 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <OurMissionSection />
          </div>
        </section>

      </main>

      {/* Smooth transition to footer */}
      <div className="h-24 bg-gradient-to-b from-[#0F172A] to-[#0B0F19]" />
      <Footer />
    </div>
  );
}
