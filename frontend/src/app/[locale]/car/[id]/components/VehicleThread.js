'use client'

import { useTranslations } from 'next-intl'
import { Heart, MessageSquare, Share2, Send, Pin } from 'lucide-react'

export default function VehicleThread({ vehicle }) {
  const t = useTranslations('car_details')

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-gray-900 pb-8 mt-12">
      {/* Pinned Post Header */}
      <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-4">
        {/* Pinned Badge */}
        <div className="absolute -top-3 right-6 bg-[#ea580c] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <Pin className="w-3 h-3" /> Pinned by Owner
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 shadow-sm border-2 border-white">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="Karim Mansour" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">Karim Mansour</span>
                <span className="bg-orange-100 text-[#ea580c] text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">HOST</span>
              </div>
              <span className="text-gray-400 text-xs font-medium">2h ago</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-700 leading-relaxed text-sm">
          Just detailed and ready for your weekend drive! The interior has been fully sanitized and we've added a complimentary bottle of sparkling water in the cooler. Drive safe and enjoy the smooth ride!
        </p>

        {/* Image */}
        <div className="w-full aspect-video rounded-2xl bg-gray-100 overflow-hidden border border-gray-100">
          <img src={vehicle?.images?.[0] || "/carsymbol.jpg"} alt="Detailed interior" className="w-full h-full object-cover" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-gray-500 hover:text-[#ea580c] transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-orange-50 transition-colors">
                <Heart className="w-5 h-5 group-hover:fill-[#ea580c]" />
              </div>
              <span className="font-bold text-sm">48</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Reply</span>
            </button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* REPLIES Divider */}
      <div className="flex items-center justify-center my-8 gap-4 px-4">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">REPLIES</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* Replies Section */}
      <div className="space-y-5 px-2">
        {/* Reply 1 */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1 border-2 border-white shadow-sm">
             <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold">MA</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-5 w-full shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-gray-900">Mehdi Alaoui</span>
              <span className="text-xs font-medium text-gray-400">Yesterday</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Is it available for a multi-day trip starting next Thursday? Planning a run down to Taghazout.</p>
          </div>
        </div>

        {/* Reply 2 */}
        <div className="flex gap-4 ml-8">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1 border-2 border-white shadow-sm">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="Host" className="w-full h-full object-cover" />
          </div>
          <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-5 w-full shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">Karim Mansour</span>
                <span className="text-[#ea580c] bg-orange-100 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md">HOST</span>
              </div>
              <span className="text-xs font-medium text-gray-400">2h ago</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">Yes Mehdi! The schedule is open from Thursday morning. We can even arrange a delivery to your location in Casa. Send us a message!</p>
          </div>
        </div>
      </div>

      {/* Input box bottom */}
      <div className="pt-8 flex justify-center">
        <div className="w-full flex items-center bg-white rounded-full border border-gray-200 p-2 shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#ea580c]/20 focus-within:border-[#ea580c] transition-all">
          <input 
            type="text" 
            placeholder="Write a reply..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 px-4"
          />
          <button className="bg-[#ea580c] hover:bg-[#c2410a] text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-md">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
