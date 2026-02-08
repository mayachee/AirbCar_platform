'use client';

import { motion } from 'framer-motion';

const categories = [
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Getting Started",
    description: "New to AirbCar? Learn the basics of how it works.",
    color: "text-yellow-400",
    bg: "from-yellow-400/20 to-orange-400/20",
    border: "group-hover:border-yellow-400/30"
  },
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Account & Profile",
    description: "Manage your settings, verification, and preferences.",
    color: "text-purple-400",
    bg: "from-purple-400/20 to-pink-400/20",
    border: "group-hover:border-purple-400/30"
  },
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: "Booking & Trips",
    description: "Everything about making, changing, or canceling trips.",
    color: "text-blue-400",
    bg: "from-blue-400/20 to-cyan-400/20",
    border: "group-hover:border-blue-400/30"
  },
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Payments & Refunds",
    description: "Understand pricing, fees, and our refund policies.",
    color: "text-green-400",
    bg: "from-green-400/20 to-emerald-400/20",
    border: "group-hover:border-green-400/30"
  },
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.5 2.5 0 01-3.536 0l-.733-.733a1.5 1.5 0 00-2.122 0l-.733.733a2.5 2.5 0 01-3.536 0L9 12.5M15 7a2 2 0 00-2 2" />
      </svg>
    ),
    title: "Hosting a Car",
    description: "List your vehicle, set your rules, and earn money.",
    color: "text-orange-400",
    bg: "from-orange-400/20 to-red-400/20",
    border: "group-hover:border-orange-400/30"
  },
  {
    icon: (
      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Safety & Insurance",
    description: "Protection plans, insurance, and trust & safety.",
    color: "text-red-400",
    bg: "from-red-400/20 to-pink-400/20",
    border: "group-hover:border-red-400/30"
  }
];

export default function HelpCategories() {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">Browse by Category</h2>
            <div className="w-16 h-1 md:w-20 bg-gradient-to-r from-orange-500 to-amber-500 mx-auto rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`group relative bg-[#15171e]/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:bg-[#1a1d24] transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-2xl ${cat.border}`}
            >
              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${cat.bg} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-inner`}>
                <div className={cat.color}>{cat.icon}</div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 group-hover:text-orange-400 transition-colors flex items-center gap-2">
                    {cat.title}
                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{cat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
