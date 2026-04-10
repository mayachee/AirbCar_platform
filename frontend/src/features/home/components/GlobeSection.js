'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { getCityCoords } from '@/lib/moroccanCityCoords';

// WebGL components — never render server-side
const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
      <div className="h-12 w-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
    </div>
  ),
});

const GlobeTooltip = dynamic(() => import('./GlobeTooltip'), { ssr: false });

/** Group raw partner rows into CityMarker objects with resolved coordinates. */
function groupByCityWithCoords(rawPartners) {
  const map = new Map();

  for (const p of rawPartners) {
    const city = (
      p?.city ||
      p?.user?.city ||
      p?.location ||
      ''
    ).trim();
    if (!city) continue;

    const coords = getCityCoords(city);
    if (!coords) continue;

    const key = city.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { city, lat: coords.lat, lng: coords.lng, partners: [] });
    }
    map.get(key).partners.push({
      id:          p.id,
      name:        p.business_name || p.businessName || p.companyName || p.name || 'Partner',
      rating:      Math.max(0, Math.min(5, Number(p.rating) || 0)),
      reviewCount: Number(p.review_count) || 0,
      logo:        p.logo_url || p.logo || null,
    });
  }

  return Array.from(map.values());
}

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

export default function GlobeSection() {
  const [cityMarkers, setCityMarkers] = useState([]);
  const [tooltip, setTooltip] = useState({ marker: null, position: { x: 0, y: 0 } });
  const [globeSize, setGlobeSize] = useState(520);
  const containerRef = useRef(null);

  // Responsive globe size
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      if (vw < 640)       setGlobeSize(Math.min(vw - 32, 340));
      else if (vw < 1024) setGlobeSize(460);
      else                setGlobeSize(560);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fetch partners
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(
          `${API_BASE}/partners/?page=1&page_size=100&sort=-rating`,
          { headers }
        );
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.results || json?.data?.results || json?.data || json || [];
        if (mounted && Array.isArray(rows)) {
          setCityMarkers(groupByCityWithCoords(rows));
        }
      } catch {
        // Globe still shows without markers
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleMarkerHover = (marker, canvasX, canvasY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // canvasX/canvasY are relative to the canvas; offset by the container's position
    // The globe canvas is centered inside containerRef
    const containerCx = rect.width  / 2;
    const containerCy = rect.height / 2;
    const globeOffsetX = containerCx - globeSize / 2;
    const globeOffsetY = containerCy - globeSize / 2;

    setTooltip({
      marker,
      position: {
        x: globeOffsetX + canvasX,
        y: globeOffsetY + canvasY,
      },
    });
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#080808] py-20 sm:py-28">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[700px] w-[700px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-500">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/60" aria-hidden="true" />
            Notre Réseau
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500/60" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.05]">
            Partenaires à travers{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              le Maroc
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            Survolez une ville pour découvrir nos prestataires de location près de chez vous.
          </p>
        </motion.div>

        {/* Globe + tooltip wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          ref={containerRef}
          className="relative mx-auto flex items-center justify-center"
          style={{ width: globeSize, height: globeSize }}
        >
          {/* Outer glow ring */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)',
            }}
          />

          <GlobeCanvas
            markers={cityMarkers}
            size={globeSize}
            onMarkerHover={handleMarkerHover}
            onMarkerLeave={() => setTooltip({ marker: null, position: { x: 0, y: 0 } })}
          />

          <GlobeTooltip marker={tooltip.marker} position={tooltip.position} />
        </motion.div>

        {/* City pills legend */}
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
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20
                           bg-orange-500/[0.08] px-3 py-1 text-xs font-medium text-orange-300
                           transition-colors hover:border-orange-500/40 hover:bg-orange-500/[0.14]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  style={{ boxShadow: '0 0 4px 1px rgba(234,88,12,0.6)' }}
                />
                {city}
                <span className="text-orange-500/50 font-normal">({partners.length})</span>
              </span>
            ))}
          </motion.div>
        )}

        {/* Stats row */}
        {cityMarkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex justify-center gap-8 sm:gap-16"
          >
            {[
              {
                value: cityMarkers.reduce((a, c) => a + c.partners.length, 0),
                label: 'Partners',
              },
              { value: cityMarkers.length, label: 'Cities covered' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-white">{value}+</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
