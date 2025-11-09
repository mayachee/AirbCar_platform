'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PartnerHero from './components/PartnerHero';
import PartnerRegistrationForm from './components/PartnerRegistrationForm';
import PartnerBenefits from './components/PartnerBenefits';
import PartnerRequirements from './components/PartnerRequirements';
import PartnerTestimonial from './components/PartnerTestimonial';
import PartnerCTA from './components/PartnerCTA';
import PartnerFAQs from './components/PartnerFAQs';
import PartnerHowItWorks from './components/PartnerHowItWorks';

const floatingBitsPalette = [
  'from-orange-500/60 to-pink-500/60',
  'from-sky-500/50 to-indigo-500/50',
  'from-emerald-500/50 to-lime-500/50',
  'from-amber-500/60 to-rose-500/60',
  'from-violet-500/40 to-purple-500/40'
];

export default function PartnerLandingPage() {
  const [activeSection, setActiveSection] = useState('partner-form');
  const floatingBits = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const size = Math.floor(Math.random() * 180) + 140;
        const palette = floatingBitsPalette[index % floatingBitsPalette.length];
        return {
          id: `bit-${index}`,
          size,
          top: `${Math.random() * 120 - 10}%`,
          left: `${Math.random() * 80 + 10}%`,
          delay: Math.random() * 2,
          palette
        };
      }),
    []
  );

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
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-50 via-white to-white" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {floatingBits.map((bit) => (
              <motion.span
                key={bit.id}
                className={`absolute rounded-[46%] bg-gradient-to-br ${bit.palette} blur-3xl`}
                style={{
                  top: bit.top,
                  left: bit.left,
                  width: bit.size,
                  height: bit.size
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: activeSection === 'partner-form' ? 0.4 : 0.25,
                  scale: [0.8, 1.05, 0.95, 1],
                  rotate: [0, 10, -4, 0],
                  y: [0, -12, 8, 0]
                }}
                transition={{
                  duration: 12,
                  delay: bit.delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </motion.div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <PartnerHero />
            </motion.div>

            {[
              { key: 'partner-form-section', element: <PartnerRegistrationForm /> },
              { key: 'partner-benefits-section', element: <PartnerBenefits /> },
              { key: 'partner-how-it-works-section', element: <PartnerHowItWorks /> },
              { key: 'partner-requirements-section', element: <PartnerRequirements /> },
              { key: 'partner-testimonial-section', element: <PartnerTestimonial /> },
              { key: 'partner-cta-section', element: <PartnerCTA /> },
              { key: 'partner-faq-section', element: <PartnerFAQs /> }
            ].map(({ key, element }, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 55 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                className="relative"
              >
                {element}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
