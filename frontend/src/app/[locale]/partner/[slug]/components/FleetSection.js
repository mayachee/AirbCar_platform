'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Car, MapPin, Star, Fuel, Settings2, Users, Eye, EyeOff } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export default function FleetSection({ listings = [] }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'available' | 'unavailable'

  const filteredListings = useMemo(() => {
    if (filter === 'available') return listings.filter(l => l.is_available !== false);
    if (filter === 'unavailable') return listings.filter(l => l.is_available === false);
    return listings;
  }, [listings, filter]);

  const availableCount = useMemo(() => listings.filter(l => l.is_available !== false).length, [listings]);
  const unavailableCount = useMemo(() => listings.filter(l => l.is_available === false).length, [listings]);

  if (!listings || listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 p-12 text-center my-8"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Car className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">No vehicles available</h3>
        <p className="text-gray-400">
          This partner hasn't listed any vehicles yet.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="my-12"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-white">
            Vehicles
            <span className="ml-3 text-orange-500">({listings.length})</span>
          </h2>
        </div>

        {/* Filter buttons */}
        {unavailableCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'available'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Available ({availableCount})
            </button>
            <button
              onClick={() => setFilter('unavailable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'unavailable'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
              Unavailable ({unavailableCount})
            </button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing, index) => {
          const vehicleName = listing.title || listing.name || `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim();
          const imageUrl = getVehicleImageUrl(listing);
          const price = listing.price_per_day || listing.price || listing.dailyRate || 0;
          const location = listing.location || 'Location not specified';
          const rating = listing.rating || 0;
          const reviewCount = listing.review_count || 0;
          const isUnavailable = listing.is_available === false;

          return (
            <motion.div
              key={listing.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              whileHover="hover"
            >
              <Link
                href={`/car/${listing.id}`}
                className={`block bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all overflow-hidden group ${
                  isUnavailable ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="relative w-full bg-gray-800 overflow-hidden">
                  <motion.img
                    src={imageUrl}
                    alt={vehicleName}
                    className="w-full h-full object-contain"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    onError={(e) => {
                      e.target.src = '/carsymbol.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-lg font-bold text-orange-400">
                      {Number(price).toLocaleString()} MAD
                    </span>
                    <span className="text-xs text-gray-300 ml-1">/day</span>
                  </div>

                  {/* Unavailable Badge */}
                  {isUnavailable && (
                    <div className="absolute top-4 left-4 bg-red-500/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/30">
                      <span className="text-xs font-semibold text-white">Unavailable</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-white mb-3 line-clamp-1 group-hover:text-orange-400 transition-colors">
                    {vehicleName}
                  </h3>

                  <div className="space-y-2">
                    {/* Rating */}
                    {rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="ml-1 text-sm font-semibold text-gray-200">{rating.toFixed(1)}</span>
                        </div>
                        {reviewCount > 0 && (
                          <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </div>

                    {/* Car specs row */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {listing.fuel_type && (
                        <div className="flex items-center gap-1">
                          <Fuel className="h-3.5 w-3.5" />
                          <span className="capitalize">{listing.fuel_type}</span>
                        </div>
                      )}
                      {listing.transmission && (
                        <div className="flex items-center gap-1">
                          <Settings2 className="h-3.5 w-3.5" />
                          <span className="capitalize">{listing.transmission}</span>
                        </div>
                      )}
                      {listing.seats && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{listing.seats}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <motion.div
                    className="mt-4 pt-4 border-t border-white/10"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-sm font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
                      View Details →
                    </span>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filteredListings.length === 0 && listings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400">No vehicles match this filter.</p>
          <button
            onClick={() => setFilter('all')}
            className="mt-3 text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            Show all vehicles
          </button>
        </motion.div>
      )}
    </motion.section>
  );
}

