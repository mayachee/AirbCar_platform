'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PopularDestinations() {
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
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = getCardElements();
    // Expect: [lastClone, ...realItems, firstClone]
    if (cards.length < 3) return;

    const firstReal = cards[1];
    const lastReal = cards[cards.length - 2];

    // With scroll snap + touchpads, scrollLeft may not match offsetLeft exactly.
    // So find the nearest card and only wrap if that nearest is a clone.
    const scrollLeft = container.scrollLeft;
    let nearestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < cards.length; i += 1) {
      const dist = Math.abs(scrollLeft - cards[i].offsetLeft);
      if (dist < bestDist) {
        bestDist = dist;
        nearestIdx = i;
      }
    }

    if (nearestIdx === 0) {
      jumpScrollLeft(lastReal.offsetLeft);
    } else if (nearestIdx === cards.length - 1) {
      jumpScrollLeft(firstReal.offsetLeft);
    }
  }, [getCardElements, jumpScrollLeft]);

  const scheduleWrapIfNeeded = useCallback(() => {
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    // Debounce: treat "no scroll events for N ms" as scroll end.
    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null;
      if (!isPointerDownRef.current) wrapIfOnClone();
    }, 120);
  }, [wrapIfOnClone]);

  const handleDestinationClick = useCallback((destination) => {
    // Navigate to search page with destination pre-filled
    const searchParams = new URLSearchParams({
      location: destination,
      pickupDate: new Date().toISOString().split('T')[0], // Today's date
      dropoffDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow's date
    });
    
    router.push(`/search?${searchParams.toString()}`);
  }, [router]);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // With looping enabled, arrows (if rendered) should always be available
    // as long as there is enough content to scroll.
    const canScroll = container.scrollWidth - container.clientWidth > 4;
    setShowLeftArrow(canScroll);
    setShowRightArrow(canScroll);
  }, []);

  const scrollToLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollToRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const handlePointerDown = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (e.button !== undefined && e.button !== 0) return;

    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = container.scrollLeft;

    container.style.cursor = 'grabbing';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  const handlePointerMove = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) didDragRef.current = true;
    container.scrollLeft = startScrollLeftRef.current - dx;
  };

  const endPointerDrag = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isPointerDownRef.current = false;
    container.style.cursor = 'grab';

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }

    // If scroll snap lands us on a clone, silently jump to the real card.
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

    // Use native scrollend when available; fallback is the debounced onScroll.
    const handleScrollEnd = () => {
      if (!isPointerDownRef.current) wrapIfOnClone();
      checkScrollPosition();
    };

    container.addEventListener('scrollend', handleScrollEnd);
    return () => {
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [checkScrollPosition, wrapIfOnClone]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Start on the first real card (index 1) so user can scroll both ways.
    const raf = requestAnimationFrame(() => {
      const cards = getCardElements();
      if (cards.length >= 2) {
        jumpScrollLeft(cards[1].offsetLeft);
      }
      checkScrollPosition();
    });

    return () => cancelAnimationFrame(raf);
  }, [checkScrollPosition, getCardElements, jumpScrollLeft]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = null;
      }
    };
  }, []);

  const destinations = [
    {
      destination: 'Marrakech',
      image: '/cities/marrakesh.jpg',
      kicker: 'Coming soon',
      subtitle: 'Imperial City • Red City',
      note: null
    },
    {
      destination: 'Agadir',
      image: '/cities/agadir.jpg',
      kicker: 'Coming soon',
      subtitle: 'Beach Resort • Atlantic Coast',
      note: null
    },
    {
      destination: 'Tangier',
      image: '/cities/tangier.jpg',
      kicker: 'Coming soon',
      subtitle: 'Gateway to Africa • Mediterranean',
      note: null
    },
    {
      destination: 'Casablanca',
      image: '/cities/casablanca.jpg',
      kicker: null,
      subtitle: 'Economic Capital • Modern City',
      note: 'Most popular: Business Class'
    },
    {
      destination: 'Rabat',
      image: '/cities/rabat.jpg',
      kicker: null,
      subtitle: 'Royal Capital • UNESCO Heritage',
      note: 'Most popular: Luxury & Economy'
    },
    {
      destination: 'Tetouan',
      image: '/cities/tetouan.jpg',
      kicker: null,
      subtitle: 'White Dove • Andalusian Heritage',
      note: 'Most popular: Compact Cars'
    }
  ];

  const destinationsForLoop =
    destinations.length > 1
      ? [destinations[destinations.length - 1], ...destinations, destinations[0]]
      : destinations;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="border-b border-gray-200 pb-6 md:pb-8 mb-8 md:mb-10 flex items-end justify-between gap-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">Destinations</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight">
              Popular destinations
            </h2>
          </div>
          <p className="hidden md:block max-w-md text-sm text-gray-600 leading-relaxed">
            Explore top cities. Drag to scroll or use the arrows.
          </p>
        </div>

        {/* City Cards Horizontal Scroll */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide cursor-grab select-none pb-6 px-1 snap-x snap-mandatory scroll-smooth touch-pan-y"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={() => {
              checkScrollPosition();
              scheduleWrapIfNeeded();
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            onPointerLeave={endPointerDrag}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {destinationsForLoop.map((d, idx) => {
              const isFeatured = Boolean(d.note);
              return (
                <div
                  key={`${d.destination}-${idx}`}
                  data-destination-card="true"
                  onClick={() => safeNavigate(d.destination)}
                  className={
                    [
                      'flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer border border-gray-200',
                      'transition-all duration-300 hover:border-gray-400',
                      'snap-start',
                      'h-[420px] w-[260px] sm:h-[480px] sm:w-[300px] lg:h-[560px] lg:w-[340px]',
                      isFeatured ? 'shadow-lg hover:shadow-2xl transform hover:-translate-y-1' : ''
                    ].join(' ')
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      safeNavigate(d.destination);
                    }
                  }}
                  aria-label={`Explore cars in ${d.destination}`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${d.image})` }}
                  ></div>
                  <div
                    className={
                      isFeatured
                        ? 'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300'
                        : 'absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent'
                    }
                  ></div>

                  <div
                    className={
                      isFeatured
                        ? 'absolute bottom-0 left-0 right-0 p-6 text-white transform transition-transform duration-300 group-hover:-translate-y-2'
                        : 'absolute bottom-0 left-0 right-0 p-6 text-white'
                    }
                  >
                    <div className="mb-4">
                      {d.kicker && (
                        <p className="text-[10px] tracking-[0.22em] uppercase text-white/70 mb-2">
                          {d.kicker}
                        </p>
                      )}
                      <h3
                        className={
                          isFeatured
                            ? 'text-3xl font-bold mb-2 group-hover:text-orange-500 transition-colors duration-300'
                            : 'text-3xl font-bold mb-2 group-hover:text-orange-500 transition-colors duration-300'
                        }
                      >
                        {d.destination}
                      </h3>
                      <p className={isFeatured ? 'text-sm font-medium opacity-90 mb-1' : 'text-sm text-white/80 mt-2'}>
                        {d.subtitle}
                      </p>
                      {d.note && <p className="text-xs opacity-75">{d.note}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        safeNavigate(d.destination);
                      }}
                      className={
                        isFeatured
                          ? 'backdrop-blur-md px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                          : 'backdrop-blur-md px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                      }
                    >
                      Explore Cars
                    </button>
                  </div>

                  {isFeatured && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </section>
  );
}
