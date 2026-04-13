import React from 'react'

export default function OwnerBlock() {
  return (
    <div className="my-12">
      <div className="border border-white p-8 bg-transparent text-white rounded-none">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-6">
          Karim Mansour - FOUNDER, ELITE AUTO HUB
        </div>
        <div className="font-serif text-3xl md:text-5xl italic leading-tight mb-12">
          "For us, driving isn't just about reaching a destination; it's about the feeling of the machine, the precision of the engineering, and the luxury of the journey."
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/20">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">EXPERIENCE</span>
            <span className="font-serif text-2xl">12+ Years</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">FLEET SIZE</span>
            <span className="font-serif text-2xl">15 Premium Cars</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">RESPONSE TIME</span>
            <span className="font-serif text-2xl">&lt; 15 mins</span>
          </div>
        </div>
      </div>
    </div>
  )
}
