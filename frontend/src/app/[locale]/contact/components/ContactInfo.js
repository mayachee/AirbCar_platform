'use client';

import { motion } from 'framer-motion';

const contactMethods = [
  {
    id: "email",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Chat to us",
    description: "Our friendly team is here to help.",
    info: "support@airbcar.com",
    href: "mailto:support@airbcar.com",
    gradient: "from-blue-500/20 to-cyan-500/20",
    textGradient: "from-blue-400 to-cyan-400"
  },
  {
    id: "office",
    icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    title: "Visit us",
    description: "Come say hello at our HQ.",
    info: "Tetouan, Morocco",
    href: "#",
    gradient: "from-orange-500/20 to-red-500/20",
    textGradient: "from-orange-400 to-red-400"
  },
  {
    id: "phone",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: "Call us",
    description: "Mon-Fri from 8am to 5pm.",
    info: "+212 600-000000",
    href: "tel:+212600000000",
    gradient: "from-green-500/20 to-emerald-500/20",
    textGradient: "from-green-400 to-emerald-400"
  }
];

export default function ContactInfo() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12 md:mb-24 container mx-auto px-4 max-w-6xl">
      {contactMethods.map((method, index) => (
        <motion.a
          key={index}
          href={method.href}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="group relative flex flex-col p-6 md:p-8 rounded-[2rem] bg-[#15171e] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
        >
          {/* Hover Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500 relative z-10 text-white">
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
            {method.icon}
          </div>

          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{method.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{method.description}</p>
            <p className={`text-base md:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r ${method.textGradient}`}>
              {method.info}
            </p>
          </div>

          {/* Arrow Icon at bottom right */}
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
             </svg>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
