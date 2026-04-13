import React from 'react'

export default function OwnerBlock() {
  return (
    <div className="my-12">
      <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row gap-8 items-start border border-gray-100">
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="Owner" className="w-full h-full object-cover bg-gray-100" />
        </div>
        <div className="flex-1 w-full">
          <div className="font-mono text-xs uppercase tracking-widest text-[#ea580c] font-bold mb-4">
            Karim Mansour &mdash; FOUNDER, ELITE AUTO HUB
          </div>
          <div className="font-serif text-2xl md:text-3xl italic leading-relaxed text-gray-900 mb-8">
            "For us, driving isn't just about reaching a destination; it's about the feeling of the machine, the precision of the engineering, and the luxury of the journey."
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">EXPERIENCE</span>
              <span className="font-bold text-gray-900 text-lg">12+ Years</span>
            </div>
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">FLEET SIZE</span>
              <span className="font-bold text-gray-900 text-lg">15 Premium Cars</span>
            </div>
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">RESPONSE TIME</span>
              <span className="font-bold text-gray-900 text-lg">&lt; 15 mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
