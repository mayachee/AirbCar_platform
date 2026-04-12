'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getCityCoords } from '@/lib/moroccanCityCoords';

const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
      <div className="h-12 w-12 rounded-full border-2 border-[var(--color-orange-500)]/30 border-t-[var(--color-orange-500)] animate-spin" />
    </div>
  ),
});

const GlobeTooltip = dynamic(() => import('./GlobeTooltip'), { ssr: false });

function groupByCityWithCoords(rawPartners) {
  const map = new Map();
  for (const p of rawPartners) {
    const city = (p?.city || p?.user?.city || p?.location || '').trim();
    if (!city) continue;
    const coords = getCityCoords(city);
    if (!coords) continue;
    const key = city.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { city, lat: coords.lat, lng: coords.lng, partners: [] });
    }
    map.get(key).partners.push({
      id: p.id,
      name: p.business_name || p.businessName || p.companyName || p.name || 'Partner',
      rating: Math.max(0, Math.min(5, Number(p.rating) || 0)),
      reviewCount: Number(p.review_count) || 0,
      logo: p.logo_url || p.logo || null,
    });
  }
  return Array.from(map.values());
}

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

export default function GlobeSection() {
  const t = useTranslations('home');
  const [cityMarkers, setCityMarkers] = useState([]);
  const [tooltip, setTooltip] = useState({ marker: null, position: { x: 0, y: 0 } });
  const [globeSize, setGlobeSize] = useState(520);
  const containerRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      if (vw < 640) setGlobeSize(Math.min(vw - 32, 340));
      else if (vw < 1024) setGlobeSize(460);
      else setGlobeSize(560);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/partners/?page=1&page_size=100&sort=-rating`);
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.results || json?.data?.results || json?.data || json || [];
        if (mounted && Array.isArray(rows)) setCityMarkers(groupByCityWithCoords(rows));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const handleMarkerHover = (marker, canvasX, canvasY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerCx = rect.width / 2;
    const containerCy = rect.height / 2;
    const globeOffsetX = containerCx - globeSize / 2;
    const globeOffsetY = containerCy - globeSize / 2;
    setTooltip({ marker, position: { x: globeOffsetX + canvasX, y: globeOffsetY + canvasY } });
  };

  return (
    <section className="relative w-full overflow-hidden bg-[var(--surface-container-high)] py-20 sm:py-28">
      {/* Ambient background glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[700px] w-[700px] rounded-full bg-[var(--color-orange-500)]/[0.04] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2.5 label-xs text-[var(--text-muted)]">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--color-orange-500)]/60" aria-hidden="true" />
            {t('network_kicker')}
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--color-orange-500)]/60" aria-hidden="true" />
          </div>
          <h2 className="mt-3 headline-lg sm:text-5xl text-[var(--text-primary)] leading-[1.05]">
            {t('network_heading_prefix')}{' '}
            <span className="bg-gradient-to-r from-[var(--color-orange-600)] to-[var(--color-orange-500)] bg-clip-text text-transparent">
              {t('network_heading_highlight')}
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-secondary)] max-w-lg mx-auto">
            {t('network_description')}
          </p>
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          ref={containerRef}
          className="relative mx-auto flex items-center justify-center"
          style={{ width: globeSize, height: globeSize }}
        >
          <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
          <GlobeCanvas markers={cityMarkers} size={globeSize} onMarkerHover={handleMarkerHover} onMarkerLeave={() => setTooltip({ marker: null, position: { x: 0, y: 0 } })} />
          <GlobeTooltip marker={tooltip.marker} position={tooltip.position} />
        </motion.div>

        {/* City pills */}
        {cityMarkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-2"
          >
            {cityMarkers.map(({ city, partners }) => (
              <span
                key={city}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-orange-500)]/[0.08] px-3 py-1 text-xs font-medium text-[var(--color-orange-600)] transition-colors hover:bg-[var(--color-orange-500)]/[0.14]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-orange-500)]" style={{ boxShadow: '0 0 4px 1px rgba(249,115,22,0.6)' }} />
                {city}
                <span className="text-[var(--color-orange-500)]/50 font-normal">({partners.length})</span>
              </span>
            ))}
          </motion.div>
        )}

        {/* Stats */}
        {cityMarkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex justify-center gap-8 sm:gap-16"
          >
            {[
              { value: cityMarkers.reduce((a, c) => a + c.partners.length, 0), label: t('network_stat_partners') },
              { value: cityMarkers.length, label: t('network_stat_cities') },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]">{value}+</p>
                <p className="mt-1 label-xs text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
