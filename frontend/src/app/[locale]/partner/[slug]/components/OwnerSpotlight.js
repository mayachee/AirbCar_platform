"use client";

import { MapPin, CheckCircle2, Award, Star, Route, Share2, ArrowRight } from "lucide-react";

export default function OwnerSpotlight({ partner }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
          <img 
            src={partner?.image || "/api/placeholder/64/64"} 
            alt={partner?.name || "Atlas Premium Rentals"} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            {partner?.name || "Atlas Premium Rentals"}
            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
          </h2>
          <div className="flex items-center gap-1.5 text-gray-500 mt-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wide">{partner?.location || "MUNICH, GERMANY"}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between py-4 border-y border-gray-100">
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#ea580c]" />
            <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wider">Elite Status</span>
          </div>
          <span className="font-bold text-gray-900">Level 5</span>
        </div>
        <div className="w-px h-8 bg-gray-100"></div>
        <div className="flex flex-col gap-1 items-center">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wider">Rating</span>
          </div>
          <span className="font-bold text-gray-900">{partner?.rating || "4.9"} <span className="text-gray-400 font-normal">/ 5.0</span></span>
        </div>
        <div className="w-px h-8 bg-gray-100"></div>
        <div className="flex flex-col gap-1 items-end">
          <div className="flex items-center gap-1.5">
            <Route className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wider">Journeys</span>
          </div>
          <span className="font-bold text-gray-900">{partner?.trips || "1.2k+"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl py-3 font-medium transition-colors text-sm uppercase tracking-wider">
          FOLLOW AGENCY
        </button>
        <button className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3 font-medium transition-colors text-sm uppercase tracking-wider">
          SHARE PROFILE
        </button>
        <button className="w-full flex items-center justify-center gap-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-3 font-medium transition-colors mt-4 text-sm">
          Plan Your Next Journey
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
