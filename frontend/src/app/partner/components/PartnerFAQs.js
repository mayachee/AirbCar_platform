'use client';

import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

export default function PartnerFAQs() {
  const faqs = [
    { q: 'How fast can I get verified?', a: 'Most partners are verified within 1–3 business days after submitting documents. We manually review all documents to ensure safety.' },
    { q: 'When do I get paid?', a: 'Payouts are processed instantly after each completed booking to your bank account. You can withdraw your earnings at any time.' },
    { q: 'Can I manage multiple vehicles?', a: 'Yes. Our dashboard supports multi-vehicle fleets with bulk editing and calendar tools. Many of our partners manage fleets of 10+ vehicles.' },
    { q: 'Is there an insurance provided?', a: 'We provide comprehensive insurance coverage for all trips. You can also use your own commercial insurance if preferred.' },
  ];

  return (
    <section id="faqs" className="scroll-mt-16 py-20 pb-40">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">Frequently ask questions</h2>
          <p className="text-gray-400">Have more questions? Contact our support team.</p>
        </motion.div>

        <Accordion.Root type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Accordion.Item 
                value={`item-${i}`}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full px-6 py-4 font-semibold text-lg text-left flex items-center justify-between group text-white">
                    {faq.q}
                    <div className="p-1 rounded-full bg-white/10 group-hover:bg-orange-500/20 group-data-[state=open]:bg-orange-500/20 transition-colors">
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-data-[state=open]:text-orange-500 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-6 pb-6 text-gray-400 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <p className="border-t border-white/10 pt-3">{faq.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

