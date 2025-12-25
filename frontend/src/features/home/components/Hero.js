'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MOROCCAN_CITIES } from '@/constants';
import { motion, useInView } from 'framer-motion';
import { SelectField } from '@/components/ui/select-field';

export default function Hero() {
  // Get current date and default drop-off date (2 days later)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 2);

  const pad2 = (n) => String(n).padStart(2, '0');
  const dateToYmd = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const todayStr = dateToYmd(today);
  const tomorrowStr = dateToYmd(tomorrow);

  const ymdToLocalDate = (dateStr) => {
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((p) => Number(p));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatDateLabel = (dateStr) => {
    const date = ymdToLocalDate(dateStr);
    if (!date || Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const buildDateOptions = (startDateStr, days) => {
    const start = ymdToLocalDate(startDateStr);
    if (!start || Number.isNaN(start.getTime())) return [];

    const options = [];
    const seen = new Set();
    for (let i = 0; i <= days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const value = dateToYmd(d);
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: formatDateLabel(value) });
    }
    return options;
  };

  const heroBlurFieldClass =
    'bg-white/10 hover:bg-white/15 ' +
    'dark:bg-white/10 dark:hover:bg-white/15 ' +
    'border border-white/25 hover:border-white/35 ' +
    'dark:border-white/25 dark:hover:border-white/35 ' +
    'text-white ' +
    'backdrop-blur-xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 ' +
    'focus:ring-orange-500/30 focus:border-orange-400';

  const heroBlurContentClass =
    'border border-white/20 bg-white/10 text-white ' +
    'dark:border-white/20 dark:bg-white/10 dark:text-white ' +
    'backdrop-blur-2xl backdrop-saturate-150 ' +
    'supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150';
  
  const [searchForm, setSearchForm] = useState({
    location: 'Tetouan',
    pickupDate: todayStr,
    dropoffDate: tomorrowStr,
  });
  const router = useRouter();

  const handleInputChange = (e) => {
    setSearchForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePickupDateChange = (e) => {
    const nextPickupDate = e.target.value;
    setSearchForm((prev) => {
      const next = { ...prev, pickupDate: nextPickupDate };
      if (next.dropoffDate && nextPickupDate && next.dropoffDate < nextPickupDate) {
        next.dropoffDate = nextPickupDate;
      }
      return next;
    });
  };

  const handleDropoffDateChange = (e) => {
    const nextDropoffDate = e.target.value;
    setSearchForm((prev) => {
      const next = { ...prev, dropoffDate: nextDropoffDate };
      if (next.dropoffDate && next.pickupDate && next.dropoffDate < next.pickupDate) {
        next.pickupDate = next.dropoffDate;
      }
      return next;
    });
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
      className="relative overflow-hidden min-h-[800px] md:min-h-0 md:h-[680px] bg-slate-800"
      style={{ backgroundImage: 'url(/sven-d-a4S6KUuLeoM-unsplash.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* overlays */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="relative max-w-7xl mx-auto h-full flex md:items-end px-4 pt-40 md:pt-0 pb-12 md:pb-16">
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
            className="mt-6 md:mt-8 rounded-2xl p-5 md:p-8 max-w-6xl w-full border border-white/25 shadow-2xl bg-transparent supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-120"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Pickup Location */}
            <div className="md:col-span-1">
              <label htmlFor="hero-location" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
                Pickup location
              </label>
              <SelectField
                id="hero-location"
                value={searchForm.location}
                placeholder="Select a city"
                onChange={(e) =>
                  setSearchForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                options={MOROCCAN_CITIES.map((city) => ({ value: city, label: city }))}
                triggerProps={{ 'aria-label': 'Pickup location' }}
                contentProps={{ className: heroBlurContentClass }}
                className={heroBlurFieldClass}
              />
            </div>
            
            {/* Pickup Date */}
            <div className="md:col-span-1">
              <label htmlFor="hero-pickup-date" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
                Pickup date
              </label>
              <SelectField
                id="hero-pickup-date"
                value={searchForm.pickupDate}
                onChange={handlePickupDateChange}
                options={buildDateOptions(todayStr, 180)}
                triggerProps={{ 'aria-label': 'Pickup date' }}
                contentProps={{ className: heroBlurContentClass }}
                required
                className={heroBlurFieldClass}
              />
            </div>
            
            {/* Drop-off Date */}
            <div className="md:col-span-1">
              <label htmlFor="hero-dropoff-date" className="block text-xs font-semibold tracking-wide text-white/90 mb-2">
                Drop-off date
              </label>
              <SelectField
                id="hero-dropoff-date"
                value={searchForm.dropoffDate}
                onChange={handleDropoffDateChange}
                options={buildDateOptions(searchForm.pickupDate || todayStr, 180)}
                triggerProps={{ 'aria-label': 'Drop-off date' }}
                contentProps={{ className: heroBlurContentClass }}
                required
                className={heroBlurFieldClass}
              />
            </div>
            
            {/* Search Button */}
            <div className="md:col-span-1 flex items-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white border border-orange/20 bg-orange-500 shadow-lg hover:shadow-xl hover:bg-orange-700/[0.65] focus:outline-none focus:ring-4 focus:ring-orange-500/40 backdrop-blur-2xl backdrop-saturate-150 transition-colors"
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
