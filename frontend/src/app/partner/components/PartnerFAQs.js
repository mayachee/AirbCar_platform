'use client';

import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { ArrowRight } from 'lucide-react';

export default function PartnerFAQs() {
  const faqs = [
    { q: 'How fast can I get verified?', a: 'Most partners are verified within 1–3 business days after submitting documents.' },
    { q: 'When do I get paid?', a: 'Payouts are processed instantly after each completed booking to your bank account.' },
    { q: 'Can I manage multiple vehicles?', a: 'Yes. Our dashboard supports multi-vehicle fleets with bulk editing and calendar tools.' },
  ];

  return (
    <section id="faqs" className="bg-orange-50/60 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.h2 
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Frequently asked questions
        </motion.h2>
        <Accordion.Root type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <Accordion.Item 
              key={i}
              value={`item-${i}`}
              className="bg-white border rounded-lg overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full px-4 py-3 font-medium text-left flex items-center justify-between group">
                  {faq.q}
                  <motion.div
                    animate={{ rotate: 0 }}
                    className="transition-transform group-data-[state=open]:rotate-180"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-3 text-gray-600 text-sm">
                {faq.a}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

