import React from 'react'
import { BadgeCheck, Quote } from 'lucide-react'

export default function OwnerBlock({ partner }) {
  if (!partner) return null;

  const eliteStatus = partner?.elite_status ? 'Elite Auto Hub' : 'Auto Hub'
  const ownerName = partner?.business_name || partner?.businessName || [partner?.user?.first_name, partner?.user?.last_name].filter(Boolean).join(' ') || 'Partner'
  const fleetSize = partner?.listing_count || partner?.listings?.length || partner?.vehicles?.length || 0
  const expYears = partner?.experience_years || null
  const avatarUrl = partner?.logo_url || partner?.user?.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ownerName}`
  const formattedFleet = fleetSize > 0 ? `${fleetSize} Vehicles` : 'Growing Fleet'
  const responseTime = partner?.response_time || null
  return (
    <section className="bg-[#eff3ff] rounded-2xl p-8 border border-[#dee9fd]">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-white">
            <img
              alt={`${ownerName}, Agency Owner`}
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          </div>
          {partner?.is_verified && (
            <div className="absolute -bottom-2 -right-2 bg-[#9d4300] text-white p-1.5 rounded-lg shadow-lg">
              <BadgeCheck className="w-4 h-4 block" />
            </div>
          )}
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-2xl font-bold mb-1 text-[#121c2a]">{ownerName}</h3>
          <p className="text-[#9d4300] font-bold text-sm uppercase tracking-widest mb-4">Founder, {eliteStatus}</p>
          {quoteText && (
            <div className="relative">
              <Quote className="absolute -top-4 -left-6 text-[#d9e3f7] w-12 h-12 opacity-50 -z-10" />
              <p className="text-[#584237] italic leading-relaxed text-lg line-clamp-4">
                &quot;{quoteText}&quot;
              </p>
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[#121c2a]">
            {partner?.experience_years && (
              <>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Experience</span>
                  <span className="font-bold">{expYears}</span>
                </div>
                <div className="w-px h-8 bg-[#dee9fd] hidden md:block"></div>
              </>
            )}
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Fleet Size</span>
              <span className="font-bold">{formattedFleet}</span>
            </div>
            {responseTime && (
              <>
                <div className="w-px h-8 bg-[#dee9fd] hidden md:block"></div>       
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Response Time</span>
                  <span className="font-bold">{responseTime}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
