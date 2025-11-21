'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Car, MapPin, Star, Calendar, Sparkles } from 'lucide-react';

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
  if (!listings || listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center my-8"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles available</h3>
        <p className="text-gray-600">
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
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Available Vehicles
            <span className="ml-3 text-orange-600">({listings.length})</span>
          </h2>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing, index) => {
          const vehicleName = listing.name || `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim();
          const imageUrl = listing.images?.[0] || listing.image || '/carsymbol.jpg';
          const price = listing.price_per_day || listing.price || listing.dailyRate || 0;
          const location = listing.location || 'Location not specified';
          const rating = listing.rating || 0;
          const reviewCount = listing.review_count || 0;

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
                className="block bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition-all overflow-hidden group"
              >
                {/* Image */}
                <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <motion.img
                    src={imageUrl}
                    alt={vehicleName}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    onError={(e) => {
                      e.target.src = '/carsymbol.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                    <span className="text-lg font-bold text-orange-600">
                      {price.toLocaleString()} MAD
                    </span>
                    <span className="text-xs text-gray-600 ml-1">/day</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {vehicleName}
                  </h3>

                  <div className="space-y-2">
                    {/* Rating */}
                    {rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="ml-1 text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                        </div>
                        {reviewCount > 0 && (
                          <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <motion.div
                    className="mt-4 pt-4 border-t border-gray-100"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-sm font-semibold text-orange-600 group-hover:text-orange-700 transition-colors">
                      View Details →
                    </span>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

