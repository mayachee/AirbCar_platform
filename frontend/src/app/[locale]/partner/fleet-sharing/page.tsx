"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Calendar, Star, ChevronRight, Car, Loader2 } from "lucide-react";

import { vehicleService } from "@/features/vehicle/services/vehicleService";
import type { Vehicle } from "@/types";



const CATEGORIES = ["All", "Electric", "SUV", "Sedan", "Coupe", "Convertible", "Truck", "Standard"];

export default function FleetSharingMarketplace() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res: any = await vehicleService.getVehicles();
        const fetchedData = res?.data?.results || res?.data?.data || res?.data || res || [];
        setVehicles(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const filteredInventory = vehicles.filter((car: any) => {
    const make = car.brand || car.make || "";
    const partnerName = car.partner?.businessName || car.partner?.user?.firstName || "Unknown Partner";
    const category = car.style || car.fuelType || "Standard";
    
    const matchesSearch = 
      make.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (car.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      partnerName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === "All" || category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header section with Kinetic Concierge styling */}
      <div className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400">
                Fleet Sharing Marketplace
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
                Source vehicles from trusted partners to fulfill your booking demands
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative relative-group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search brand, model, partner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-80 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm transition-all text-neutral-100 placeholder:text-neutral-500"
                />
              </div>
              <button className="p-2 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center justify-center backdrop-blur-xl">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    : "bg-neutral-800/50 text-neutral-400 border border-neutral-700 hover:border-neutral-600 hover:text-neutral-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-200">
            Available Inventory <span className="text-neutral-500 text-sm font-normal ml-2">({filteredInventory.length} results)</span>
          </h2>
        </div>

        {/* Dynamic Inventory Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#F97316] animate-spin mb-4" />
            <p className="text-neutral-400">Loading marketplace inventory...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredInventory.map((car, index) => (
              <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group flex flex-col bg-neutral-800/30 backdrop-blur-xl border border-neutral-800 hover:border-neutral-700 overflow-hidden rounded-lg transition-all"
              >
                {/* Image container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-md ${
                      car.isAvailable !== false
                        ? "bg-green-500/20 text-green-400 border border-green-500/20" 
                        : "bg-neutral-900/60 text-neutral-300 border border-neutral-700"
                    }`}>
                      {car.isAvailable !== false ? "Available Now" : "In Trip"}
                    </span>
                  </div>
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={car.images?.[0] || 'https://placehold.co/800x600/1a1a1a/FFF?text=No+Image'}
                    alt={`${car.brand || (car as any).make} ${car.model}`}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/20 to-transparent opacity-80" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <h3 className="text-lg font-semibold text-white leading-tight">
                        {car.brand || (car as any).make} {car.model}
                      </h3>
                      <p className="text-sm text-neutral-300">{car.year} • {car.style || car.fuelType || 'Standard'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#F97316]">${car.dailyRate || (car as any).price_per_day || 0}</span>
                      <span className="text-xs text-neutral-400 block">/ day</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-neutral-300 gap-1.5">
                        <Star className="h-4 w-4 text-[#F97316] fill-[#F97316]" />
                        <span className="font-medium">{car.rating || 5.0}</span>
                        <span className="text-neutral-500">({(car as any).totalBookings || car.reviewCount || 0} trips)</span>
                      </div>
                      <div className="flex items-center text-neutral-400 gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{typeof car.location === 'string' ? car.location : ((car.location as any)?.city || (car.location as any)?.address || 'Unknown Location')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                      <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-neutral-300 border border-neutral-600">
                        {(car.partner?.businessName || car.partner?.user?.firstName || 'O').substring(0, 1)}
                      </div>
                      <span className="text-sm text-neutral-300 truncate font-medium">
                        {car.partner?.businessName || car.partner?.user?.firstName || 'Unknown Partner'}
                      </span>
                    </div>
                  </div>

                  <button 
                    disabled={car.isAvailable === false}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      car.isAvailable !== false
                        ? "bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316] hover:text-white border border-[#F97316]/20"
                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-800"
                    }`}
                  >
                    {car.isAvailable !== false ? (
                      <>
                        Request Vehicle <ChevronRight className="h-4 w-4" />
                      </>
                    ) : (
                      "Currently Unavailable"
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}
        {!loading && filteredInventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-300">No inventory found</h3>
            <p className="text-neutral-500 mt-2 max-w-md">
              We couldn't find any vehicles matching your current filters. Try adjusting your search criteria.
            </p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-6 px-4 py-2 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
