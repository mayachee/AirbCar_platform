'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MOROCCAN_CITIES } from '@/constants';
import { motion, useInView } from 'framer-motion';
import { SelectField } from '@/components/ui/select-field';
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

      <div className="relative max-w-7xl mx-auto h-full flex md:items-end px-4 sm:px-6 lg:px-8 pt-36 md:pt-0 pb-14 md:pb-20">
        {/* Intentional asymmetry — wider left margin on desktop */}
        <div className="w-full max-w-5xl md:ml-4 lg:ml-8">
          {/* Editorial headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="display-lg sm:text-5xl md:text-7xl text-[var(--text-primary)] leading-[0.95]">
              {t('hero_heading')}
            </h1>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg mt-4 max-w-lg leading-relaxed font-light">
              {t('hero_subheading')}
            </p>
          </motion.div>

          {/* Search Form — glass card with surface-container-lowest */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 md:mt-10 rounded-xl p-5 md:p-7 max-w-4xl bg-[var(--surface-container-lowest)]/90 backdrop-blur-xl shadow-ambient-lg"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pickup Location */}
              <div>
                <label htmlFor="hero-location" className="label-xs text-[var(--text-muted)] mb-2 block">
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
                  className="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-[var(--radius)] transition-all duration-200 focus:ring-[var(--color-orange-500)]/30"
                />
              </div>

              {/* Pickup Date */}
              <div>
                <label htmlFor="hero-pickup-date" className="label-xs text-[var(--text-muted)] mb-2 block">
                  {t('hero_pickup_date')}
                </label>
                <SelectField
                  id="hero-pickup-date"
                  value={searchForm.pickupDate}
                  onChange={handlePickupDateChange}
                  options={buildDateOptions(todayStr, 180)}
                  triggerProps={{ 'aria-label': 'Pickup date' }}
                  required
                  className="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius)] transition-all duration-200 focus:ring-[var(--color-orange-500)]/30"
                />
              </div>

              {/* Drop-off Date */}
              <div>
                <label htmlFor="hero-dropoff-date" className="label-xs text-[var(--text-muted)] mb-2 block">
                  {t('hero_dropoff_date')}
                </label>
                <SelectField
                  id="hero-dropoff-date"
                  value={searchForm.dropoffDate}
                  onChange={handleDropoffDateChange}
                  options={buildDateOptions(searchForm.pickupDate || todayStr, 180)}
                  triggerProps={{ 'aria-label': 'Drop-off date' }}
                  required
                  className="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius)] transition-all duration-200 focus:ring-[var(--color-orange-500)]/30"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="btn-brand w-full py-4 px-6 text-base tracking-wide"
                >
                  {t('hero_search_button')}
                </motion.button>
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
