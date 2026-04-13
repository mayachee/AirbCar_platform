'use client'

import { useTranslations } from 'next-intl'
import { Heart, MessageSquare, Share2, Send } from 'lucide-react'

export default function VehicleThread({ vehicle }) {
  const t = useTranslations('car_details')

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-gray-900 pb-8 mt-12">
      {/* Pinned Post Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
               <img src="/api/placeholder/40/40" alt="Karim Mansour" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Karim Mansour</span>
                <span className="bg-[#ea580c] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">HOST</span>
              </div>
            </div>
          </div>
          <span className="text-gray-400 text-sm">2h ago</span>
        </div>

        {/* Content */}
        <p className="text-gray-700 leading-relaxed text-sm">
          Just detailed and ready for your weekend drive! The interior has been fully sanitized and we've added a complimentary bottle of sparkling water in the cooler. Drive safe and enjoy the smooth ride!
        </p>

        {/* Image */}
        <div className="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden">
          <img src={vehicle?.images?.[0] || "/carsymbol.jpg"} alt="Detailed interior" className="w-full h-full object-cover" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-[#ea580c] transition-colors">
              <Heart className="w-5 h-5" />
              <span className="font-medium text-sm">48</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium text-sm">Reply</span>
            </button>
          </div>
          <button className="text-gray-400 hover:text-gray-900 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* REPLIES Divider */}
      <div className="flex items-center justify-center my-6 gap-4">
        <div className="h-px bg-gray-100 flex-1"></div>
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">REPLIES</span>
        <div className="h-px bg-gray-100 flex-1"></div>
      </div>

      {/* Replies Section */}
      <div className="space-y-4">
        {/* Reply 1 */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1">
             <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">MA</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-900">Mehdi Alaoui</span>
              <span className="text-xs text-gray-400">Yesterday</span>
            </div>
            <p className="text-sm text-gray-600">Is it available for a multi-day trip starting next Thursday? Planning a run down to Taghazout.</p>
          </div>
        </div>

        {/* Reply 2 */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1">
             <img src="/api/placeholder/40/40" alt="Host" className="w-full h-full object-cover" />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 w-full">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">Karim Mansour</span>
                <span className="text-[#ea580c] text-[9px] uppercase font-bold">HOST</span>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            <p className="text-sm text-gray-600">Yes Mehdi! The schedule is open from Thursday morning. We can even arrange a delivery to your location in Casa. Send us a message!</p>
          </div>
        </div>
      </div>

      {/* Input box bottom */}
      <div className="pt-4 flex justify-center">
        <div className="w-full flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 shadow-sm focus-within:ring-1 focus-within:ring-[#ea580c]/50 focus-within:border-[#ea580c]/50 transition-all">
          <input 
            type="text" 
            placeholder="Write a reply..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          <button className="bg-[#ea580c] hover:bg-[#c2410a] text-white p-2 rounded-full transition-colors flex items-center justify-center ml-2">
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
      </div>
