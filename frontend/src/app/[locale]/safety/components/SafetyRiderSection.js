'use client';

import { motion } from 'framer-motion';

export default function SafetyRiderSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <motion.div 
            className="flex-1 space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Tools for your <span className="text-orange-500">Peace of Mind</span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
               AirbCar provides a suite of in-app features designed to keep you connected and secure throughout your journey.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-colors">
                    <h3 className="text-xl font-semibold mb-2 text-white">Share Your Trip</h3>
                    <p className="text-sm text-gray-400">Let loved ones see your route and ETA in real-time.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-colors">
                    <h3 className="text-xl font-semibold mb-2 text-white">Number Masking</h3>
                    <p className="text-sm text-gray-400">Calls and texts are anonymized to protect your privacy.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-colors">
                    <h3 className="text-xl font-semibold mb-2 text-white">Trusted Contacts</h3>
                    <p className="text-sm text-gray-400">Pre-select friends to enable 1-tap sharing.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-colors">
                    <h3 className="text-xl font-semibold mb-2 text-white">24/7 Support</h3>
                    <p className="text-sm text-gray-400">Our team is available around the clock for urgent issues.</p>
                </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
             <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="aspect-[4/3] relative bg-gray-800">
                    <img 
                     src="https://ik.imagekit.io/szcfr7vth/New%20folder/helena-lopes-e3OUQGT9bWU-unsplash.jpg" 
                     alt="Rider Safety"
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay" />
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
