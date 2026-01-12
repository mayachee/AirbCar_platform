'use client';

import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PartnerHero from './components/PartnerHero';
import PartnerBenefits from './components/PartnerBenefits';
import PartnerRequirements from './components/PartnerRequirements';
import PartnerTestimonial from './components/PartnerTestimonial';
import PartnerCTA from './components/PartnerCTA';
import PartnerFAQs from './components/PartnerFAQs';
import PartnerHowItWorks from './components/PartnerHowItWorks';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

function Section({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PartnerLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] relative overflow-hidden">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <Header />
      <main className="flex-1 relative z-10">
        <PartnerHero />
        
        <div className="flex flex-col">
          <Section>
            <PartnerBenefits />
          </Section>
          
          <Section>
            <PartnerHowItWorks />
          </Section>

          <Section>
            <PartnerRequirements />
          </Section>

          <Section>
            <PartnerTestimonial />
          </Section>

          <Section>
            <PartnerCTA />
          </Section>

          <Section>
            <PartnerFAQs />
          </Section>
        </div>
      </main>
      
      {/* Smooth transition to footer */}
      <div className="h-24 bg-gradient-to-b from-[#0F172A] to-[#0B0F19]" />
      <Footer />
    </div>
  );
}
