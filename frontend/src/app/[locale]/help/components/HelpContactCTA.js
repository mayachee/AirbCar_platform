'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HelpContactCTA() {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl md:rounded-[3rem] overflow-hidden bg-[#15171e] border border-white/10 p-8 md:p-20 text-center group"
        >
            {/* Background Decorations */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            
            {/* Ambient Colors */}
            <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-orange-500/10 to-transparent rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-colors duration-1000" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[80px]" />

            <div className="relative z-10 space-y-6 md:space-y-8">
                <div className="inline-flex items-center justify-center p-3 md:p-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 md:w-12 md:h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>

                <h2 className="text-2xl md:text-5xl font-bold text-white tracking-tight">
                    Still can't find what you're looking for?
                </h2>
                
                <p className="text-gray-300 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed">
                    Our dedicated support team is available <span className="text-orange-400 font-bold">24/7</span> to assist you with any issues or questions you may have.
                </p>
                
                <div className="pt-4">
                    <Link 
                        href="/contact"
                        className="inline-flex items-center gap-2 md:gap-3 bg-white text-black px-6 py-3 md:px-10 md:py-5 rounded-full font-bold text-sm md:text-lg hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1 transform duration-300"
                    >
                        Contact Support Team
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
