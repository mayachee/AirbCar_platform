'use client';

import { motion } from 'framer-motion';
import { Building2, Car, CheckCircle2 } from 'lucide-react';

export default function PartnerRequirements() {
  const requirements = [
    { 
      title: 'Business Requirements', 
      icon: Building2,
      items: [
        'Valid company registration and tax ID', 
        'Active bank account for payouts', 
        'Agreement to our Partner Terms',
        'Professional liability insurance'
      ] 
    },
    { 
      title: 'Vehicle Standards', 
      icon: Car,
      items: [
        'Roadworthy and insured vehicles', 
        'Accurate photos and descriptions', 
        'Regular maintenance records',
        'Clean title with no major accidents'
      ] 
    },
  ];

  return (
    <section id="requirements" className="relative scroll-mt-16 py-20">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">Partner Requirements</h2>
          <p className="text-gray-400">We maintain high standards to ensure the best experience for both hosts and guests.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {requirements.map((req, i) => (
            <motion.div
              key={i}
              className="group p-8 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:shadow-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors border border-orange-500/20">
                  <req.icon className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {req.title}
                </h3>
              </div>
              
              <ul className="space-y-4">
                {req.items.map((item, j) => (
                  <motion.li 
                    key={j} 
                    className="flex items-start gap-3 text-gray-300"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (j * 0.1) }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

