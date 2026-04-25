'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function PopularDestinations() {
  const t = useTranslations('home');
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isPointerDownRef = useRef(false);
  const scrollEndTimerRef = useRef(null);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);
  const router = useRouter();

  const getCardElements = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-destination-card="true"]'));
  }, []);

  const jumpScrollLeft = useCallback((nextScrollLeft) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const prevBehavior = container.style.scrollBehavior;
    const prevSnapType = container.style.scrollSnapType;
    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';
    container.scrollLeft = nextScrollLeft;
    requestAnimationFrame(() => {
      container.style.scrollBehavior = prevBehavior;
      container.style.scrollSnapType = prevSnapType;
    });
  }, []);

  const wrapIfOnClone = useCallback(() => {
    // Loop clones were removed; keep as no-op to avoid stale scroll listeners.
  }, []);

  const scheduleWrapIfNeeded = useCallback(() => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null;
      if (!isPointerDownRef.current) wrapIfOnClone();
    }, 120);
  }, [wrapIfOnClone]);

  const handleDestinationClick = useCallback((destination) => {
    const searchParams = new URLSearchParams({
      location: destination,
      pickupDate: new Date().toISOString().split('T')[0],
      dropoffDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    router.push(`/search?${searchParams.toString()}`);
  }, [router]);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const canScroll = container.scrollWidth - container.clientWidth > 4;
    setShowLeftArrow(canScroll);
    setShowRightArrow(canScroll);
  }, []);

  const handlePointerDown = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.pointerType === 'touch') return;
    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e) => {
    if (!scrollContainerRef.current || !isPointerDownRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) didDragRef.current = true;
    scrollContainerRef.current.scrollLeft = startScrollLeftRef.current - dx;
  };

  const endPointerDrag = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isPointerDownRef.current = false;
    container.style.cursor = 'grab';
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    scheduleWrapIfNeeded();
  };

  const safeNavigate = (destination) => {
    if (didDragRef.current) return;
    handleDestinationClick(destination);
  };

  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollPosition]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScrollEnd = () => { if (!isPointerDownRef.current) wrapIfOnClone(); checkScrollPosition(); };
    container.addEventListener('scrollend', handleScrollEnd);
    return () => container.removeEventListener('scrollend', handleScrollEnd);
  }, [checkScrollPosition, wrapIfOnClone]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => {
      checkScrollPosition();
    });
    return () => cancelAnimationFrame(raf);
  }, [checkScrollPosition]);

  useEffect(() => {
    return () => { if (scrollEndTimerRef.current) { clearTimeout(scrollEndTimerRef.current); scrollEndTimerRef.current = null; } };
  }, []);

  const destinations = [
    { destination: 'Tetouan', image: 'https://ik.imagekit.io/szcfr7vth/tetouan.jpg', kicker: null, subtitle: 'White Dove', note: 'Most popular: Compact Cars' },
    { destination: 'Marrakech', image: 'https://ik.imagekit.io/szcfr7vth/unnamed5.jpg', kicker: 'Coming soon', subtitle: 'Imperial City', note: null },
    { destination: 'Agadir', image: 'https://ik.imagekit.io/szcfr7vth/agadir.jpg', kicker: 'Coming soon', subtitle: 'Atlantic Coast', note: null },
    { destination: 'Tangier', image: 'https://ik.imagekit.io/szcfr7vth/shutterstock2625490969.jpg', kicker: 'Coming soon', subtitle: 'Gateway to Africa', note: null },
    { destination: 'Casablanca', image: 'https://ik.imagekit.io/szcfr7vth/casablanca.jpg', kicker: null, subtitle: 'Economic Capital', note: 'Most popular: Business Class' },
    { destination: 'Rabat', image: 'https://ik.imagekit.io/szcfr7vth/rabat.jpg', kicker: null, subtitle: 'Royal Capital', note: 'Most popular: Luxury & Economy' },
  ];

  const destinationsForLoop = destinations;

  return (
    <section className="relative py-20 md:py-28 surface-base overflow-hidden">
      {/* Ambient glow */}
      <div className="glow-blue absolute -top-40 right-0 w-[500px] h-[500px] opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="label-xs text-[var(--color-orange-500)] mb-3">
                {t('destinations_kicker')}
              </p>
              <h2 className="headline-lg sm:text-4xl md:text-6xl text-[var(--text-primary)] leading-[0.95]">
                {t('destinations_heading')}
              </h2>
            </div>
            <p className="hidden md:block max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('destinations_description')}
            </p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-[var(--border-medium)] to-transparent" />
        </motion.div>

        {/* City Cards container with arrows */}
        <div className="relative group/carousel mt-10 md:mt-14">
          {/* Left Arrow */}
          <div className={`absolute top-1/2 -left-4 -translate-y-1/2 z-10 transition-all duration-300 ${showLeftArrow ? 'opacity-0 md:group-hover/carousel:opacity-100 translate-x-4 md:group-hover/carousel:translate-x-0' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                }
              }}
              className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-3 md:p-4 rounded-full shadow-xl transition-all duration-300 border border-white/10 flex items-center justify-center group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange-500)]"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 transform transition-transform group-hover/btn:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-5 md:gap-8 overflow-x-auto scrollbar-hide cursor-grab select-none pb-8 pt-4 px-2 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maskImage: 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)' }}
            onScroll={() => { checkScrollPosition(); scheduleWrapIfNeeded(); }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            onPointerLeave={endPointerDrag}
          >
            {destinationsForLoop.map((d, idx) => {
              const isFeatured = Boolean(d.note);
              return (
                <motion.div
                  key={`${d.destination}-${idx}`}
                  data-destination-card="true"
                  onClick={() => safeNavigate(d.destination)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                  className={[
                    'flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer',
                    'shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]',
                    'snap-center md:snap-start transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]',
                    'h-[400px] w-[260px] sm:h-[460px] sm:w-[300px] lg:h-[540px] lg:w-[340px]',
                  ].join(' ')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); safeNavigate(d.destination); } }}
                  aria-label={`Explore cars in ${d.destination}`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{ backgroundImage: `url(${d.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-75" />

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white transform transition-transform duration-300 group-hover:-translate-y-1">
                    {d.kicker && (
                      <span className="inline-block label-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/70 mb-3">
                        {d.kicker}
                      </span>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-1 group-hover:text-[var(--color-orange-500)] transition-colors duration-300">
                      {d.destination}
                    </h3>
                    <p className="text-xs text-white/50 font-medium mb-1">{d.subtitle}</p>
                    {d.note && <p className="text-[10px] text-[var(--color-orange-500)]/70 font-medium">{d.note}</p>}

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); safeNavigate(d.destination); }}
                      className="mt-4 w-full py-2.5 rounded-[var(--radius)] text-xs font-bold tracking-wide uppercase bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      {t('destinations_explore_cars')}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <div className={`absolute top-1/2 -right-4 -translate-y-1/2 z-10 transition-all duration-300 ${showRightArrow ? 'opacity-0 md:group-hover/carousel:opacity-100 -translate-x-4 md:group-hover/carousel:translate-x-0' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                }
              }}
              className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-3 md:p-4 rounded-full shadow-xl transition-all duration-300 border border-white/10 flex items-center justify-center group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange-500)]"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 transform transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
