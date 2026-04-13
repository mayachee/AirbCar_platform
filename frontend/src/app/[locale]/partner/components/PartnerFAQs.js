'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

export default function PartnerFAQs() {
  const t = useTranslations('partner_faqs');
  const faqs = [
    { q: t('faq_1_q'), a: t('faq_1_a') },
    { q: t('faq_2_q'), a: t('faq_2_a') },
    { q: t('faq_3_q'), a: t('faq_3_a') },
    { q: t('faq_4_q'), a: t('faq_4_a') },
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
          <h2 className="text-3xl font-bold mb-4 text-white">{t('heading')}</h2>
          <p className="text-gray-400">{t('description')}</p>
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
                className="bg-white/5 border border-white/10 rounded-none overflow-hidden backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full px-6 py-4 font-semibold text-lg text-left flex items-center justify-between group text-white">
                    {faq.q}
                    <div className="p-1 rounded-none bg-white/10 group-hover:bg-orange-500/20 group-data-[state=open]:bg-orange-500/20 transition-colors duration-200">
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-data-[state=open]:text-orange-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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

