"use client";

import { useTranslations } from 'next-intl';
import { Heart, Share2, MapPin, Star, Maximize } from 'lucide-react';

export default function ImageGallery({ vehicle, onShowFullGallery }) {
  const t = useTranslations('car_details');
  const mainImage = vehicle?.images?.[0] || "/api/placeholder/1200/800";
  const numExtraImages = Math.max(0, (vehicle?.images?.length || 0) - 3);

  return (
    <section className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl group">
      {/* Main Cinematic Hero */}
      <div className="relative h-[500px] md:h-[720px] w-full overflow-hidden">
        <img
          src={mainImage}
          alt={vehicle?.name || "Vehicle Image"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Floating Minimal Controls */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-lg border border-white/40">
            <Heart className="w-5 h-5 text-[#9d4300]" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-lg border border-white/40">
            <Share2 className="w-5 h-5 text-[#9d4300]" />
          </button>
        </div>

        <div className="absolute bottom-10 left-10 max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('available_now') || "Available Now"}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-4 drop-shadow-2xl">
            {vehicle?.name || `${vehicle?.make} ${vehicle?.model} ${vehicle?.year}`}
          </h1>
          <div className="flex items-center gap-6 text-white/90">
            <p className="flex items-center gap-2 font-medium">
              <MapPin className="w-4 h-4 text-[#ffdbca]" />
              {vehicle?.location || "Casablanca, Morocco"}
            </p>
            <div className="h-4 w-px bg-white/20"></div>
            <p className="flex items-center gap-2 font-medium">
              <Star className="w-4 h-4 text-[#ffdbca]" fill="currentColor" />
              {vehicle?.rating || "4.9"} ({vehicle?.reviewCount || 0} reviews)
            </p>
          </div>
        </div>
      </div>

      {/* Sophisticated Thumbnails Bar */}
      <div className="absolute bottom-6 right-6 flex gap-4 items-center">
        <div className="hidden md:flex gap-3 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
          {[0, 1, 2].map((idx) => {
            const img = vehicle?.images?.[idx] || `/api/placeholder/200/200?text=${idx + 1}`;
            return (
              <div 
                key={idx}
                className={`relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group/thumb transition-all ${idx === 0 ? 'outline outline-3 outline-offset-2 outline-[#9d4300]' : 'opacity-70 hover:opacity-100'}`}
                onClick={onShowFullGallery}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
              </div>
            );
          })}

          {/* +X More Indicator */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group/more" onClick={onShowFullGallery}>
            <img src={vehicle?.images?.[3] || "/api/placeholder/200/200"} className="w-full h-full object-cover blur-[2px] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/more:bg-black/20 transition-colors">
              <span className="text-white font-black text-xl tracking-tighter">+{numExtraImages > 0 ? numExtraImages : 12}</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Button */}
        <button 
          onClick={onShowFullGallery}
          className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-xl border border-white/40"
        >
          <Maximize className="w-6 h-6 text-[#121c2a]" />
        </button>
      </div>
    </section>
  );
}
