'use client';

import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

export default function PartnerRequirements() {
  const requirements = [
    { title: 'Business', items: ['Valid company registration and tax ID', 'Active bank account for payouts', 'Agreement to our Partner Terms'] },
    { title: 'Vehicles', items: ['Roadworthy and insured vehicles', 'Accurate photos and descriptions', 'Regular maintenance and cleanliness'] },
  ];

  return (
    <section id="requirements" className="bg-white scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.h2 
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Requirements
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requirements.map((req, i) => (
            <motion.div
              key={i}
              className="p-6 border rounded-xl"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                {req.title}
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                {req.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

