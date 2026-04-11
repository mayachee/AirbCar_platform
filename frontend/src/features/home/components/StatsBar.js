'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function StatsBar() {
  const t = useTranslations('home');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  const stats = [
    { value: '190+', label: t('stats_customers'), accent: false },
    { value: '48+',  label: t('stats_partners'), accent: true },
    { value: '49+',  label: t('stats_vehicles'), accent: false },
    { value: '6',    label: t('stats_cities'), accent: false },
  ];

  return (
    <section ref={ref} className="relative bg-[var(--surface-1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center md:px-8 first:pl-0 last:pr-0"
            >
              <p className={`text-3xl md:text-5xl font-black tracking-tight leading-none ${
                stat.accent ? 'text-[var(--color-orange-500)]' : 'text-[var(--text-primary)]'
              }`}>
                {stat.value}
              </p>
              <p className="mt-2 label-xs text-[var(--text-muted)]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
