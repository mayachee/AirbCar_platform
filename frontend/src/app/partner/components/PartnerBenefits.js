'use client';

import { motion } from 'framer-motion';
import { DollarSign, Calendar, Shield } from 'lucide-react';

export default function PartnerBenefits() {
  const benefits = [
    { icon: DollarSign, title: 'Predictable earnings', desc: 'Consistent demand and instant payouts with transparent fees.' },
    { icon: Calendar, title: 'Smart operations', desc: 'Calendar, pricing and fleet tools to optimize utilization.' },
    { icon: Shield, title: 'Trust & safety', desc: 'Verification workflows and secure payments built-in.' },
  ];

  return (
    <section id="benefits" className="bg-white border-t scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.h2 
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Benefits for partners
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            >
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600 w-fit mb-3">
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

