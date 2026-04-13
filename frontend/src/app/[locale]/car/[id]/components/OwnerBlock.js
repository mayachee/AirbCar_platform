import React from 'react'
import { BadgeCheck, Quote } from 'lucide-react'

export default function OwnerBlock({ partner }) {
  const eliteStatus = partner?.elite_status ? 'Elite Auto Hub' : 'Auto Hub'
  const ownerName = partner?.name || 'Karim Mansour'
  const fleetSize = partner?.fleet_size || '15 Premium Cars'
  const expYears = partner?.experience_years || '12+ Years'
  
  return (
    <section className="bg-[#eff3ff] rounded-2xl p-8 border border-[#dee9fd]">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
            <img 
              alt={`${ownerName}, Agency Owner`} 
              className="w-full h-full object-cover" 
              src={partner?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim"} 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#9d4300] text-white p-1.5 rounded-lg shadow-lg">
            <BadgeCheck className="w-4 h-4 block" />
          </div>
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-2xl font-bold mb-1 text-[#121c2a]">{ownerName}</h3>
          <p className="text-[#9d4300] font-bold text-sm uppercase tracking-widest mb-4">Founder, {eliteStatus}</p>
          <div className="relative">
            <Quote className="absolute -top-4 -left-6 text-[#d9e3f7] w-12 h-12 opacity-50 -z-10" />
            <p className="text-[#584237] italic leading-relaxed text-lg">
              &quot;For us, driving isn&apos;t just about getting from A to B. It&apos;s about the rhythm of the road and the soul of the machine. We curate each vehicle to ensure every mile in Morocco becomes a story worth telling.&quot;
            </p>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[#121c2a]">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Experience</span>
              <span className="font-bold">{expYears}</span>
            </div>
            <div className="w-px h-8 bg-[#dee9fd] hidden md:block"></div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Fleet Size</span>
              <span className="font-bold">{fleetSize}</span>
            </div>
            <div className="w-px h-8 bg-[#dee9fd] hidden md:block"></div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Response Time</span>
              <span className="font-bold">{partner?.response_time || '< 15 mins'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
