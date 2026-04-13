'use client';

import { motion } from 'framer-motion';

export default function SafetyProtectionSection() {
  return (
    <section className="py-32 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-none blur-[120px]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                     <div className="inline-block px-4 py-1.5 rounded-none border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-semibold mb-6">
                        Added Value Protection
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
                        <span className="text-orange-600">5000DH</span>
                        <span className="block text-white mt-2">Coverage Guarantee</span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        We cover every trip automatically. If something small goes wrong, we are here to help you pay for it, so you don't have to worry.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: "Why we do it",
                            content: "We want to help fast. We fix small problems quickly so you don't lose your own money on accidents.",
                            delay: 0.1
                        },
                        {
                            title: "What we pay for",
                            content: "We cover things like cleaning a dirty car, fixing small scratches, or small medical bills that normal insurance skips.",
                            delay: 0.2
                        },
                        {
                            title: "How it works",
                            content: "It is free to use. No extra costs. Just tell us what happened, and we will check it in 24 hours.",
                            delay: 0.3
                        }
                    ].map((item, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: item.delay, duration: 0.5 }}
                            className="bg-white/5 backdrop-blur-md border border-white/5 p-8 rounded-none relative group overflow-hidden hover:bg-white/10 transition-colors duration-500"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-none blur-2xl -mr-12 -mt-12 group-hover:bg-orange-500/20 transition-colors duration-500" />
                            
                            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-300">
                                {item.title}
                            </h3>
                            <div className="h-1 w-12 bg-orange-500/50 rounded-none mb-6 group-hover:w-20 transition-all duration-300" />
                            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                {item.content}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
  );
}
