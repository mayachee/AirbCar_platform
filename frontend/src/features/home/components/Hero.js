'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MOROCCAN_CITIES } from '@/constants';
import { motion, useInView } from 'framer-motion';

export default function Hero() {
  // Get current date and tomorrow's date
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  const [searchForm, setSearchForm] = useState({
    location: '',
    pickupDate: today.toISOString().split('T')[0],
    dropoffDate: tomorrow.toISOString().split('T')[0]
  });
  const router = useRouter();

  const handleInputChange = (e) => {
    setSearchForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Create search params from form data
    const searchParams = new URLSearchParams({
      location: searchForm.location,
      pickupDate: searchForm.pickupDate,
      dropoffDate: searchForm.dropoffDate
    });
    
    // Navigate to search results page
    router.push(`/search?${searchParams.toString()}`);
  };

  // viewport reveal
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden h-[560px] md:h-[680px] bg-slate-800"
      style={{ backgroundImage: 'url(/sven-d-a4S6KUuLeoM-unsplash.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* overlays */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="relative max-w-7xl mx-auto h-full flex items-end px-4 pb-12 md:pb-16">
        <div className="w-full">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Find the best car rental deals
            </h1>
            <p className="text-white/80 text-lg mt-3">Compare offers and book in seconds</p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="mt-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-6xl w-full shadow-2xl border border-white/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Pickup Location */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pickup location
              </label>
              <select
                name="location"
                value={searchForm.location}
                onChange={handleInputChange}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-700"
                required
              >
                <option value="">Select a city</option>
                {MOROCCAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Pickup Date */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pickup date
              </label>
              <input
                type="date"
                name="pickupDate"
                value={searchForm.pickupDate}
                onChange={handleInputChange}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-700"
                required
              />
            </div>
            
            {/* Drop-off Date */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Drop-off date
              </label>
              <input
                type="date"
                name="dropoffDate"
                value={searchForm.dropoffDate}
                onChange={handleInputChange}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-700"
                required
              />
            </div>
            
            {/* Search Button */}
            <div className="md:col-span-1 flex items-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Search Cars
              </motion.button>
            </div>
          </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
