'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Globe, Shield, Users, Leaf, Heart, 
  ArrowRight, CheckCircle2, ChevronRight 
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import {
  BoltHeroSection,
  EarnMoneySection,
  BookRideSection,
  DownloadAppsSection,
  AboutUsSection,
  ChallengeSection,
  ImpactSection,
} from './components';

export default function MissionPage() {
  const [activeSection, setActiveSection] = useState('mission');

  // Handle scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['mission', 'earn', 'ride', 'impact', 'about', 'download'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  const sidebarItems = [
    { id: 'mission', label: 'Our Mission', icon: Globe },
    { id: 'earn', label: 'Earn with AirbCar', icon: Users },
    { id: 'ride', label: 'Book a Ride', icon: MapPin },
    { id: 'impact', label: 'Social Impact', icon: Leaf },
    { id: 'about', label: 'About Us', icon: Shield },
    { id: 'download', label: 'Get the App', icon: ArrowRight },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left - Primary Orange Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent blur-[100px]" 
        />
        
        {/* Top Right - Secondary Cool Glow for Contrast */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-b from-blue-600/10 to-purple-600/10 blur-[120px]" 
        />

        {/* Bottom Center - Rising Orange Mist */}
        <motion.div 
          animate={{ 
            y: [0, -50, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-1/4 w-[50%] h-[40%] rounded-full bg-gradient-to-t from-orange-600/10 to-transparent blur-[100px]" 
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      {/* Hero Section */}
      <div id="mission">
        <BoltHeroSection />
      </div>

      {/* Main Content Section */}
      <main className="relative z-20 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Navigation - Sticky */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-6 px-2">
                    Contents
                  </h3>
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive 
                              ? 'bg-orange-500/20 text-orange-400 shadow-sm border border-orange-500/20' 
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-orange-400' : 'text-gray-400'}`} />
                          {item.label}
                          {isActive && (
                            <ChevronRight className="h-4 w-4 ml-auto text-orange-400" />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Quick Stats or Info */}
                  <div className="mt-8 pt-8 border-t border-white/10 px-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Leaf className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Carbon Offset</p>
                        <p className="text-sm font-bold text-white">100% Neutral</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Community</p>
                        <p className="text-sm font-bold text-white">5M+ Users</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-24 pb-24">
              
              {/* Sections */}
              <section id="earn" className="scroll-mt-24">
                <EarnMoneySection />
              </section>

              <section id="ride" className="scroll-mt-24">
                <BookRideSection />
              </section>

              <section id="impact" className="scroll-mt-24">
                <ImpactSection />
              </section>

              <section id="about" className="scroll-mt-24">
                <AboutUsSection />
              </section>

              <section id="download" className="scroll-mt-24">
                <DownloadAppsSection />
              </section>

              {/* Challenge Section as a footer-like element in content */}
              <section className="pt-12">
                <ChallengeSection />
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
