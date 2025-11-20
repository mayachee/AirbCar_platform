'use client';

import Link from 'next/link';
import { Car, MapPin, Star, Calendar } from 'lucide-react';

export default function FleetSection({ listings = [] }) {
  if (!listings || listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center my-8">
        <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles available</h3>
        <p className="text-gray-600">
          This partner hasn't listed any vehicles yet.
        </p>
      </div>
    );
  }

  return (
    <section className="my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Vehicles ({listings.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => {
          const vehicleName = listing.name || `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim();
          const imageUrl = listing.images?.[0] || listing.image || '/carsymbol.jpg';
          const price = listing.price_per_day || listing.price || listing.dailyRate || 0;
          const location = listing.location || 'Location not specified';
          const rating = listing.rating || 0;
          const reviewCount = listing.review_count || 0;

          return (
            <Link
              key={listing.id}
              href={`/car/${listing.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Image */}
              <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={vehicleName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/carsymbol.jpg';
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {vehicleName}
                </h3>

                {/* Rating */}
                {rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
                    {reviewCount > 0 && (
                      <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
                    )}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{location}</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {price.toLocaleString()} MAD
                    </span>
                    <span className="text-sm text-gray-600 ml-1">/day</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

