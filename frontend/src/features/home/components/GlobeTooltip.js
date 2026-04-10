'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function GlobeTooltip({ marker, position }) {
  return (
    <AnimatePresence>
      {marker && (
        <motion.div
          key={marker.city}
          initial={{ opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            left: position.x + 18,
            top:  position.y - 10,
          }}
          className="pointer-events-none absolute z-30 min-w-[170px] max-w-[220px]
                     rounded-2xl border border-white/10
                     bg-black/60 backdrop-blur-xl
                     px-4 py-3 shadow-2xl shadow-black/60"
        >
          {/* City name */}
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_2px_rgba(234,88,12,0.7)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400">
              {marker.city}
            </p>
          </div>

          {/* Partners list (max 3) */}
          <div className="space-y-1.5">
            {marker.partners.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-white/90 max-w-[130px]">
                  {p.name}
                </span>
                {p.rating > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-orange-400">
                    ★ {p.rating.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Overflow count */}
          {marker.partners.length > 3 && (
            <p className="mt-2 text-xs text-white/40">
              +{marker.partners.length - 3} more partner{marker.partners.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
