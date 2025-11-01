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
      className="bg-slate-800 py-40 px-4 relative h-[800px] overflow-hidden"
      style={{ backgroundImage: 'url(/image_homepage.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* animated blobs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 0.5, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 bg-orange-600/30 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 0.4, scale: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center items-center">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full backdrop-blur-sm mb-5">
            <span className="h-2 w-2 rounded-full bg-orange-600"></span>
            <span className="text-sm font-medium">Best price, instant booking</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 leading-tight">
            Find the best car rental deals
          </h1>
          <p className="text-white/80 text-lg">Compare offers and book in seconds</p>
        </motion.div>
        
        {/* Search Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-6xl w-full mx-auto shadow-2xl border border-white/20"
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
    </section>
  );
}
