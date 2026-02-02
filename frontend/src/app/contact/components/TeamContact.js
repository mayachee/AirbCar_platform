'use client';

import { motion } from 'framer-motion';

const teamMembers = [
  {
    category: "Development Team",
    members: [
      {
        name: "Mohamed Yassine Ayache.",
        role: "Lead Developer",
        email: "yassine@airbcar.com",
        phone: "+212696145103",
        linkedin: "https://www.linkedin.com/in/mayachee/",
        quote: "Building <span class='text-orange-500'>robust</span> solutions for modern mobility.",
        image: "https://ik.imagekit.io/szcfr7vth/IMG_2867.png" 
      },
      {
        name: "Amine S.",
        role: "Full Stack Engineer",
        email: "amine@airbcar.com",
        phone: "+212 600-333444",
        linkedin: "#",
        quote: "Code <span class='text-orange-500'>quality</span> and performance are our top priorities.",
        image: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg" 
      }
    ]
  },
  {
    category: "Business & Partnerships",
    members: [
      {
        name: "Zakaria M.",
        role: "Head of Marketing",
        email: "zakaria@airbcar.com",
        phone: "+212 661-555666",
        linkedin: "#",
        quote: "Connecting people with the cars they <span class='text-orange-500'>love</span>.",
        image: "https://ik.imagekit.io/szcfr7vth/New%20folder/marina_malkova-nIOK_GnEGeU-unsplash.jpg" 
      },
      {
        name: "Karam L.",
        role: "Partner Relations",
        email: "karam@airbcar.com",
        phone: "+212 661-777888",
        linkedin: "#",
        quote: "Ensuring our <span class='text-orange-500'>partners</span> succeed is our mission.",
        image: "https://ik.imagekit.io/szcfr7vth/New%20folder/helena-lopes-e3OUQGT9bWU-unsplash.jpg" 
      }
    ]
  }
];

export default function TeamContact() {
  return (
    <section className="relative py-12 md:py-24 scroll-mt-16 overflow-hidden">
      <div className="space-y-20 md:space-y-32 container mx-auto px-4 max-w-6xl">
        {teamMembers.map((section, sectionIndex) => (
          <div key={sectionIndex} className="relative">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 md:mb-20"
             >
                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">{section.category}</h2>
                 <div className="flex items-center justify-center gap-3">
                    <div className="h-[2px] w-12 md:w-16 bg-gradient-to-r from-transparent to-orange-500" />
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-orange-500 rotate-45 transform" />
                    <div className="h-[2px] w-12 md:w-16 bg-gradient-to-l from-transparent to-orange-500" />
                 </div>
            </motion.div>
            
            <div className="grid grid-cols-1 gap-12 md:gap-20">
              {section.members.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6, type: "spring", stiffness: 50 }}
                  className="bg-[#15171e] rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 relative overflow-hidden group shadow-2xl border border-white/5 hover:border-white/10 transition-colors duration-500"
                >
                    {/* Background Grid Pattern (Subtle) */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                        style={{backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}} 
                    />
                    
                    {/* Subtle Gradient Glow at top right */}
                    <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Decorative Quote Icon */}
                    <div className="absolute top-6 left-6 md:top-12 md:left-12 text-[#2a2d3a] opacity-60 z-0 select-none transform group-hover:scale-110 transition-transform duration-700">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="md:w-20 md:h-20"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9C9.00001 15 9.00001 13 11 13C12 13 12.017 12 12.017 12V10C12.017 9 11.017 9 11.017 9L11 9C8.00001 9 6.00001 11 6.00001 15V18C6.00001 19.6569 7.34316 21 9 21H12.017C13.1216 21 14.017 21 14.017 21ZM21.017 21L21.017 18C21.017 16.8954 20.1216 16 19.017 16H16C16.035 14.881 16.143 13.568 17.067 12.894C17.411 12.645 18 12.389 18 12V10C18 9 17.017 9 17.017 9L17 9C14 9 12 11 12 15V18C12 19.6569 13.3431 21 15 21H19.017C20.1216 21 21.017 21 21.017 21Z" /></svg>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 w-full">
                        <div className="space-y-6 md:space-y-8 order-2 md:order-1 relative">
                             {/* Stars & Verified */}
                             <div className="flex items-center gap-4 mb-2">
                                 <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-orange-500 fill-current drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                    ))}
                                 </div>
                                 <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] md:text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Verified
                                 </span>
                             </div>

                             {/* Quote/Bio Text */}
                             <div className="space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-4xl font-bold text-white leading-snug">
                                    "<span dangerouslySetInnerHTML={{ __html: member.quote }} />"
                                </h3>
                                <div className="pt-2 md:pt-4 space-y-4">
                                    <div className="group/email flex items-center gap-3 w-fit cursor-pointer">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/email:bg-orange-500 transition-colors duration-300">
                                            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover/email:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <span className="text-gray-400 group-hover/email:text-orange-400 transition-colors text-sm md:text-lg font-medium break-all">{member.email}</span>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <a href={`tel:${member.phone}`} className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/20 text-white font-medium transition-all border border-white/5 hover:border-white/20 active:scale-95 text-sm md:text-base">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            {member.phone}
                                        </a>
                                        <a href={member.linkedin} className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-[#0077b5] hover:bg-[#006396] text-white font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-sm md:text-base">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                            LinkedIn
                                        </a>
                                    </div>
                                </div>
                             </div>

                             {/* Name Block */}
                             <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                                 <div>
                                    <h4 className="text-lg md:text-2xl font-bold text-white uppercase tracking-wider">{member.name}</h4>
                                    <p className="text-orange-500 font-bold mt-1 text-xs md:text-sm tracking-wide">{member.role}</p>
                                 </div>
                                 <div className="block opacity-20">
                                    {/* Simplified Logo Fallback or SVG */}
                                    <svg className="h-6 md:h-8 w-auto text-white fill-current" viewBox="0 0 100 30">
                                        <text x="0" y="20" fontSize="20" fontWeight="bold">AIRBCAR</text>
                                    </svg>
                                 </div>
                             </div>
                        </div>

                        {/* Image Block */}
                        <div className="order-1 md:order-2 relative flex justify-center md:justify-end">
                             {/* Decorative Background Shape with Gradient */}
                             <div className="absolute top-[10%] right-[5%] w-[90%] h-[90%] bg-gradient-to-br from-[#3f2e24] to-[#1e1410] rounded-[2rem] transform translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4 -z-10 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4 md:group-hover:translate-x-6 md:group-hover:translate-y-6 shadow-2xl" />
                             
                             <div className="w-full max-w-[280px] md:max-w-md aspect-square relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 group-hover:border-orange-500/30 transition-colors duration-500 mx-auto md:mx-0">
                                <img 
                                    src={member.image} 
                                    alt={member.name} 
                                    className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700" 
                                />
                                {/* Overlay gradient for better text integration if needed, usually cleaner without on pure image cards */}
                             </div>
                        </div>
                    </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}