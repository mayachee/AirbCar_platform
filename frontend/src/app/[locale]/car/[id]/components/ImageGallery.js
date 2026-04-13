"use client";

import { MapPin } from "lucide-react";

export default function ImageGallery({ vehicle }) {
  return (
    <div className="relative h-[500px] md:h-[600px] rounded-3xl shadow-xl overflow-hidden">
      {/* Main Image */}
      <img
        src={vehicle?.images?.[0] || "/api/placeholder/1200/800"}
        alt="Vehicle Image"
        className="w-full h-full object-cover"
      />

      {/* Title Block - Bottom Left */}
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-tr-3xl p-8 pb-20 md:pb-6 absolute bottom-0 left-0 max-w-2xl">
        <h1 className="font-bold text-4xl md:text-5xl text-black leading-tight">
          {vehicle?.make} {vehicle?.model} {vehicle?.year}
        </h1>
        <div className="flex items-center gap-2 mt-3 text-[#ea580c] font-bold">
          <MapPin className="w-5 h-5" />
          <span>{vehicle?.location || "Casablanca, Morocco"}</span>
        </div>
      </div>

      {/* Thumbnails - Bottom Right */}
      <div className="absolute bottom-6 right-6 flex gap-3">
        <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg overflow-hidden">
          <img src={vehicle?.images?.[1] || "/api/placeholder/200/200"} alt="Thumbnail 1" className="w-full h-full object-cover" />
        </div>
        <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg overflow-hidden hidden sm:block">
          <img src={vehicle?.images?.[2] || "/api/placeholder/200/200"} alt="Thumbnail 2" className="w-full h-full object-cover" />
        </div>
        <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-[#ea580c] text-white font-bold text-lg flex items-center justify-center">
          +12
        </div>
      </div>
    </div>
  );
}
