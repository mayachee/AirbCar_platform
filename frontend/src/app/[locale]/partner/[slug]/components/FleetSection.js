"use client";

import { MapPin, ArrowRight } from "lucide-react";

export default function FleetSection({ listings }) {
  // Mock data if listings not provided
  const fleet = listings || [
    {
      id: 1,
      name: "Ferrari F8 Tributo",
      price: "15,950",
      status: "AVAILABLE",
      location: "Munich Central Flagship",
      image: "/api/placeholder/400/250"
    },
    {
      id: 2,
      name: "Porsche 911 GT3 RS",
      price: "12,500",
      status: "IN JOURNEY",
      location: "Munich Central Flagship",
      image: "/api/placeholder/400/250"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Live Fleet</h3>
        <button className="bg-[#ea580c] hover:bg-[#c2410a] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
          Book a Journey
        </button>
      </div>

      {/* Fleet List */}
      <div className="flex flex-col gap-4">
        {fleet.map((car) => (
          <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Image Container */}
              <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img 
                  src={car.image} 
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider">
                    {car.status}
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="flex flex-col justify-between flex-1 py-1">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">{car.name}</h4>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-gray-900">{car.price}</span>
                    <span className="text-[10px] font-medium text-gray-500 uppercase ml-1">MAD / DAY</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400 mt-auto pt-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{car.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <button className="w-full flex items-center justify-center gap-2 py-4 text-gray-500 hover:text-gray-900 font-bold text-sm tracking-wider uppercase transition-colors group">
        VIEW ENTIRE COLLECTION
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
