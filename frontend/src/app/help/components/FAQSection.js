'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "How do I book a car?",
    answer: "To book a car, search for your destination and dates on our homepage. Browse the available listings, select the car that suits your needs, and click 'Book Now'. Follow the prompts to complete your payment and confirm your booking."
  },
  {
    question: "What items do I need to rent a car?",
    answer: "You will need a valid driver's license, a credit or debit card in your name, and proof of identity (like a passport or ID card). Some hosts may have additional requirements which will be listed on their car page."
  },
  {
    question: "Can I cancel my booking?",
    answer: "Yes, you can cancel your booking. Refunds depend on the host's cancellation policy and how far in advance you cancel. You can view the specific cancellation policy on your booking details page."
  },
  {
    question: "How does insurance work?",
    answer: "AirbCar provides basic insurance coverage for all trips. You can choose to upgrade to a protection plan for lower deductibles. In case of an accident, please contact our support team immediately."
  },
  {
    question: "Is there a mileage limit?",
    answer: "Mileage limits are set by the host. Some cars offer unlimited mileage, while others have a daily limit. If you exceed the limit, you may be charged an additional fee per kilometer/mile."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-bold text-white mb-4 md:mb-6">Frequently Asked Questions</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg">Quick answers to common questions about using AirbCar.</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openIndex === index ? 'bg-[#15171e] border-orange-500/30 ring-1 ring-orange-500/20 shadow-lg shadow-orange-500/5' : 'bg-[#15171e]/50 border-white/5 hover:border-white/10'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left focus:outline-none"
              >
                <span className={`text-base md:text-xl font-bold transition-colors duration-300 pr-4 ${openIndex === index ? 'text-orange-400' : 'text-white'}`}>
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-orange-400' : 'text-gray-500'}`}>
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border ${openIndex === index ? 'border-orange-500/30 bg-orange-500/10' : 'border-white/10 bg-white/5'}`}>
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 md:px-8 md:pb-8 text-gray-300 leading-relaxed text-sm md:text-lg border-t border-white/5 pt-4 md:pt-6">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
