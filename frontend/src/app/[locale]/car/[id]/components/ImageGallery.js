"use client";

import { MapPin } from "lucide-react";

export default function ImageGallery() {
  return (
    <div className="relative h-[500px] md:h-[600px] rounded-3xl shadow-xl overflow-hidden">
      {/* Main Image */}
      <img
        src="/api/placeholder/1200/800"
        alt="2024 Porsche 911 Carrera"
        className="w-full h-full object-cover"
      />

      {/* Title Block - Bottom Left */}
      <div className="bg-white/80 backdrop-blur-md rounded-tr-3xl p-8 absolute bottom-0 left-0">
        <h1 className="font-bold text-5xl md:text-6xl text-gray-900">
          2024 Porsche 911 Carrera
        </h1>
        <div className="flex items-center gap-2 mt-2 text-orange-600 font-bold">
          <MapPin className="w-5 h-5" />
          <span>Casablanca, Morocco</span>
        </div>
      </div>

      {/* Thumbnails - Bottom Right */}
      <div className="absolute bottom-6 right-6 flex gap-3">
        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
          <img src="/api/placeholder/200/200" alt="Thumbnail 1" className="w-full h-full object-cover" />
        </div>
        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
          <img src="/api/placeholder/200/200" alt="Thumbnail 2" className="w-full h-full object-cover" />
        </div>
        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
          <img src="/api/placeholder/200/200" alt="Thumbnail 3" className="w-full h-full object-cover" />
        </div>
        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white text-gray-900 font-bold text-lg flex items-center justify-center">
          +12
        </div>
      </div>
    </div>
  );
}
