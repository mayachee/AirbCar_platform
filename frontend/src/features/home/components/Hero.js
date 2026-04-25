'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MOROCCAN_CITIES } from '@/constants';
import { motion, useInView } from 'framer-motion';
import { SelectField } from '@/components/ui/select-field';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('home');
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

  const [searchForm, setSearchForm] = useState({
    location: 'Tetouan',
    pickupDate: todayStr,
    dropoffDate: tomorrowStr,
  });
  const router = useRouter();

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
    const searchParams = new URLSearchParams({
      location: searchForm.location,
      pickupDate: searchForm.pickupDate,
      dropoffDate: searchForm.dropoffDate,
    });
    router.push(`/search?${searchParams.toString()}`);
  };

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[860px] md:min-h-0 md:h-[740px]"
      style={{ backgroundImage: 'url(/sven-d-a4S6KUuLeoM-unsplash.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlays — warm tonal gradients */}
      <div className="absolute inset-0 bg-[var(--surface-base)]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-[var(--surface-base)]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-base)]/50 to-transparent" />

      {/* Ambient glow */}
      <div className="glow-orange absolute -bottom-40 -left-40 w-[600px] h-[600px] opacity-30" />

      <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center md:justify-end px-4 sm:px-6 lg:px-8 pt-36 md:pt-0 pb-14 md:pb-24">
        {/* Intentional asymmetry — wider left margin on desktop */}
        <div className="w-full max-w-5xl md:ml-4 lg:ml-8">
          {/* Editorial headline with staggered reveal */}
          <motion.div
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="display-lg sm:text-5xl md:text-7xl lg:text-[80px] text-[var(--text-primary)] leading-[1.05] tracking-tighter font-medium"
            >
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: "100%" }} 
                  animate={isInView ? { y: 0 } : { y: "100%" }} 
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block pb-2"
                >
                  {t('hero_heading')}
                </motion.span>
              </span>
            </motion.h1>
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-[var(--text-secondary)] text-base sm:text-lg md:text-xl mt-4 md:mt-6 max-w-lg leading-relaxed font-light"
            >
              {t('hero_subheading')}
            </motion.p>
          </motion.div>

          {/* Search Form — sleek, floating pill-shaped search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 md:mt-12 w-full max-w-[900px] bg-[var(--surface-base)]/80 hover:bg-[var(--surface-base)]/95 backdrop-blur-2xl border border-[var(--surface-border)]/50 rounded-[2rem] md:rounded-full p-2 md:p-3 shadow-[0_8px_32px_rgb(0,0,0,0.12)] transition-all duration-300 relative z-10"
          >
            <div className="flex flex-col md:flex-row w-full divide-y md:divide-y-0 md:divide-x divide-[var(--surface-border)]/40 relative">
              
              {/* Pickup Location */}
              <div className="flex-[1.2] relative group md:rounded-l-full">
                <div className="absolute inset-0 bg-[var(--surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl md:rounded-l-full md:rounded-r-none pointer-events-none" />
                <div className="relative px-5 py-3 md:py-2 h-full flex flex-col justify-center">
                  <label htmlFor="hero-location" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-0.5 cursor-pointer">
                    {t('hero_pickup_location')}
                  </label>
                  <SelectField
                    id="hero-location"
                    value={searchForm.location}
                    placeholder={t('hero_select_city')}
                    onChange={(e) =>
                      setSearchForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    options={MOROCCAN_CITIES.map((city) => ({ value: city, label: city }))}
                    triggerProps={{ 'aria-label': 'Pickup location' }}
                    className="bg-transparent hover:bg-transparent border-none p-0 h-auto text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:ring-0 text-sm md:text-base font-medium shadow-none truncate"
                  />
                </div>
              </div>

              {/* Pickup Date */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-[var(--surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl md:rounded-none pointer-events-none" />
                <div className="relative px-5 py-3 md:py-2 h-full flex flex-col justify-center">
                  <label htmlFor="hero-pickup-date" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-0.5 cursor-pointer">
                    {t('hero_pickup_date')}
                  </label>
                  <SelectField
                    id="hero-pickup-date"
                    value={searchForm.pickupDate}
                    onChange={handlePickupDateChange}
                    options={buildDateOptions(todayStr, 180)}
                    triggerProps={{ 'aria-label': 'Pickup date' }}
                    required
                    className="bg-transparent hover:bg-transparent border-none p-0 h-auto text-[var(--text-secondary)] focus:ring-0 text-sm md:text-base font-medium shadow-none"
                  />
                </div>
              </div>

              {/* Drop-off Date */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-[var(--surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl md:rounded-none pointer-events-none" />
                <div className="relative px-5 py-3 md:py-2 h-full flex flex-col justify-center">
                  <label htmlFor="hero-dropoff-date" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-0.5 cursor-pointer">
                    {t('hero_dropoff_date')}
                  </label>
                  <SelectField
                    id="hero-dropoff-date"
                    value={searchForm.dropoffDate}
                    onChange={handleDropoffDateChange}
                    options={buildDateOptions(searchForm.pickupDate || todayStr, 180)}
                    triggerProps={{ 'aria-label': 'Drop-off date' }}
                    required
                    className="bg-transparent hover:bg-transparent border-none p-0 h-auto text-[var(--text-secondary)] focus:ring-0 text-sm md:text-base font-medium shadow-none"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="p-2 md:pl-3 shrink-0 flex items-center justify-center md:justify-end">
                <MagneticButton
                  intensity={0.2}
                  className="w-full md:w-auto"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="w-full md:w-[64px] h-[52px] md:h-[64px] rounded-xl md:rounded-full bg-gradient-to-br from-[var(--color-orange-500)] to-[var(--color-orange-600)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-orange-500)]/20 hover:shadow-[var(--color-orange-500)]/40 transition-all font-bold tracking-wide"
                  >
                    <span className="md:hidden mr-2">{t('hero_search_button')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </motion.button>
                </MagneticButton>
              </div>
            </div>
          </motion.form>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2"
          >
            {[
              { label: t('hero_trust_cancellation') },
              { label: t('hero_trust_no_fees') },
              { label: t('hero_trust_support') },
            ].map((badge) => (
              <span key={badge.label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
                <svg className="w-3.5 h-3.5 text-[var(--color-kc-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {badge.label}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
