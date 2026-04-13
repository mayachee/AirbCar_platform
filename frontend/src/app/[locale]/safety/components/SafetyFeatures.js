'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: "Verified Drivers",
    description: "Every driver undergoes a comprehensive background check and vehicle inspection."
  },
  {
    title: "24/7 Support",
    description: "Our support team is always available to help you with any questions or concerns."
  },
  {
    title: "Ride Tracking",
    description: "Share your trip status with friends and family in real-time for peace of mind."
  },
  {
    title: "Emergency Button",
    description: "In-app emergency button to contact authorities and our safety response team immediately."
  }
];

export default function SafetyFeatures() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group relative bg-[#1E293B]/40 backdrop-blur-md border border-white/5 p-8 rounded-none hover:bg-[#1E293B]/60 transition-all duration-300 overflow-hidden"
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 group-hover:from-orange-500/5 group-hover:to-orange-500/10 transition-all duration-500" />
            
            {/* Top Border Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

            <div className="relative z-10">
                <div className="text-4xl font-black text-white/10 mb-4 group-hover:text-orange-500/20 transition-colors duration-300">
                    0{index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-orange-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
