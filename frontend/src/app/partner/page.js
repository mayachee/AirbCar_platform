'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PartnerHero from './components/PartnerHero';
import PartnerRegistrationForm from './components/PartnerRegistrationForm';
import PartnerBenefits from './components/PartnerBenefits';
import PartnerRequirements from './components/PartnerRequirements';
import PartnerTestimonial from './components/PartnerTestimonial';
import PartnerCTA from './components/PartnerCTA';
import PartnerFAQs from './components/PartnerFAQs';

export default function PartnerLandingPage() {
  const [activeSection, setActiveSection] = useState('partner-form');

  useEffect(() => {
    const ids = ['partner-form','benefits','how-it-works','requirements','testimonials','pricing','faqs','contact'];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PartnerHero />
        <PartnerRegistrationForm />
        <PartnerBenefits />
        {/* How it works section - keeping inline due to complexity */}
        <section id="how-it-works" className="bg-gray-50 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How does it work?</h2>
              <p className="text-lg text-gray-700 mb-2">
                Simply put; <span className="text-orange-600 font-semibold">we are a vehicles rental search engine.</span>
              </p>
              <p className="text-base text-gray-600 max-w-3xl mx-auto mt-4">
                You upload your vehicles and price-list, and we put them in front of +2700 visitors everyday that come to Airbcar to find their next rental vehicle. You keep complete control of which reservations you accept, the pre-payment amounts and the cancellation policies.
              </p>
            </div>
            <div className="text-center text-gray-600">
              <p>For detailed steps, please refer to the full implementation in the components folder.</p>
            </div>
          </div>
        </section>
        <PartnerRequirements />
        <PartnerTestimonial />
        <PartnerCTA />
        <PartnerFAQs />
      </main>
      <Footer />
    </div>
  );
}
