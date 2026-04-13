import React from 'react'

export default function OwnerBlock({ partner }) {
  const eliteStatus = partner?.elite_status ? 'ELITE AUTO HUB' : 'AUTO HUB'
  
  return (
    <div className="my-12">
      <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 border border-gray-100">
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
          <img src={partner?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim"} alt="Owner" className="w-full h-full object-cover bg-gray-100" />
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <div className="font-mono text-xs uppercase tracking-widest text-[#ea580c] font-bold mb-4">
            {partner?.name || 'Karim Mansour'} &mdash; FOUNDER, {eliteStatus}
          </div>
          <div className="font-serif text-2xl md:text-3xl italic leading-relaxed text-gray-900 mb-8">
            "For us, driving isn't just about reaching a destination; it's about the feeling of the machine, the precision of the engineering, and the luxury of the journey."
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">EXPERIENCE</span>
              <span className="font-bold text-gray-900 text-lg">{partner?.experience_years || '5+'} Years</span>
            </div>
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">FLEET SIZE</span>
              <span className="font-bold text-gray-900 text-lg">{partner?.fleet_size || '15'} Premium Cars</span>
            </div>
            <div className="flex flex-col bg-gray-50 rounded-2xl p-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">RESPONSE TIME</span>
              <span className="font-bold text-gray-900 text-lg">{partner?.response_time || '< 1 hour'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
