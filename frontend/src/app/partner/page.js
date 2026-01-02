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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
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
      <Footer />
    </div>
  );
}
