'use client';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslations } from 'next-intl';

export default function RentalProviders() {
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const t = useTranslations('home');
  const router = useRouter()
  const scrollContainerRef = useRef(null);
  const didInitLoopScrollRef = useRef(false)
  const scrollRafRef = useRef(null)
  const isProgrammaticScrollRef = useRef(false)
  const lastAllowedScrollLeftRef = useRef(0)
  
  // Drag-to-scroll refs
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const shouldLoop = !isLoading && !loadError && providers.length > 0
  const loopedProviders = useMemo(
    () => shouldLoop ? [...providers, ...providers, ...providers] : providers,
    [shouldLoop, providers]
  )

  const getLoopMetrics = useCallback((container) => {
    if (!container) return null
    if (!shouldLoop) return null
    if (providers.length <= 0) return null

    const cards = container.querySelectorAll('[data-provider-card="true"]')
    const startSecondIndex = providers.length
    const startThirdIndex = providers.length * 2
    if (!cards || cards.length <= startThirdIndex) return null

    const first = cards[0]
    const second = cards[startSecondIndex]
    const third = cards[startThirdIndex]
    if (!first || !second || !third) return null

    const firstLeft = first.offsetLeft
    const secondLeft = second.offsetLeft
    const thirdLeft = third.offsetLeft
    const singleWidth = secondLeft - firstLeft

    if (!Number.isFinite(singleWidth) || singleWidth <= 0) return null
    return { startMiddle: secondLeft, startThird: thirdLeft, singleWidth }
  }, [providers.length, shouldLoop])

  const toProvider = (partner) => {
    const rawName = partner?.business_name || partner?.businessName || partner?.companyName || 'Partner'
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1)
    const rating = Number(partner?.rating) || 0
    const reviewCount = Number(partner?.review_count) || 0
    const price = partner?.min_price_per_day ? formatCurrencyPrice(partner.min_price_per_day) : null
    const city = partner?.city || partner?.user?.city || ''
    const isVerified = Boolean(partner?.is_verified)
    const businessType = partner?.business_type || ''

    return {
      id: partner?.id,
      name,
      rating: Math.max(0, Math.min(5, rating)),
      reviews: reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : t('providers_new'),
      logo: partner?.logo_url || null,
      price,
      city,
      isVerified,
      categories: [
        { name: t('providers_category_city'), value: city || '—' },
        { name: t('providers_category_type'), value: businessType || '—' },
        { name: t('providers_category_bookings'), value: typeof partner?.total_bookings === 'number' ? String(partner.total_bookings) : '—' },
      ]
    }
  }

  const getScrollStep = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return 312

    const firstCard = container.querySelector('[data-provider-card="true"]')
    if (!firstCard) return 312

    const cardWidth = firstCard.getBoundingClientRect().width
    if (!Number.isFinite(cardWidth) || cardWidth <= 0) return 312

    const styles = window.getComputedStyle(container)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0')
    const gapValue = Number.isFinite(gap) ? gap : 0

    return Math.round(cardWidth + gapValue)
  }, [])

  const setInstantScrollLeft = useCallback((container, left) => {
    const prevBehavior = container.style.scrollBehavior
    container.style.scrollBehavior = 'auto'
    isProgrammaticScrollRef.current = true
    container.scrollLeft = left
    container.style.scrollBehavior = prevBehavior
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 0)
  }, [])

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return

    // Infinite loop behavior: keep scroll position within the middle copy.
    if (shouldLoop) {
      // In loop mode always show arrows for infinite scrolling
      setShowLeftArrow(true)
      setShowRightArrow(true)

      // Don't wrap while user is dragging, to avoid fighting with the drag logic
      if (isPointerDownRef.current) return;

      const metrics = getLoopMetrics(container)
      const left = container.scrollLeft
      if (metrics) {
        // Keep scrollLeft within the middle copy range by shifting exactly one copy width.
        // This stays seamless because copy #1 and copy #2 are identical.
        if (left < metrics.startMiddle - 1) {
          setInstantScrollLeft(container, left + metrics.singleWidth)
        } else if (left >= metrics.startThird - 1) {
          setInstantScrollLeft(container, left - metrics.singleWidth)
        }
      }
      return
    }

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, [getLoopMetrics, shouldLoop, setInstantScrollLeft])

  const handlePointerDown = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (e.button !== undefined && e.button !== 0) return;
    // Ignore touch events to allow native scrolling
    if (e.pointerType === 'touch') return;

    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = container.scrollLeft;

    container.style.cursor = 'grabbing';
    container.style.scrollBehavior = 'auto';
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

    e.preventDefault();
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) didDragRef.current = true;
    
    container.scrollLeft = startScrollLeftRef.current - dx;
  };

  const endPointerDrag = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isPointerDownRef.current = false;
    container.style.cursor = 'grab';
    container.style.scrollBehavior = 'smooth';

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
    
    // Force check/wrap now that drag is done
    checkScrollPosition();
  };

  const safeNavigate = (id) => {
    if (didDragRef.current) return;
    router.push(`/partner/${id}`);
  };

  const scrollToLeft = () => {
    scrollToSnap('left')
  };

  const scrollToRight = () => {
    scrollToSnap('right')
  };

  const normalizeLoopScrollLeft = useCallback((container) => {
    const metrics = getLoopMetrics(container)
    if (!metrics) return null

    const left = container.scrollLeft
    if (left < metrics.startMiddle - 1) {
      setInstantScrollLeft(container, left + metrics.singleWidth)
    } else if (left >= metrics.startThird - 1) {
      setInstantScrollLeft(container, left - metrics.singleWidth)
    }

    return metrics
  }, [getLoopMetrics, setInstantScrollLeft])

  const scrollToSnap = useCallback((direction) => {
    const container = scrollContainerRef.current
    if (!container) return

    const allCards = Array.from(container.querySelectorAll('[data-provider-card="true"]'))
    if (allCards.length === 0) {
      container.scrollBy({
        left: direction === 'right' ? getScrollStep() : -getScrollStep(),
        behavior: 'smooth'
      })
      return
    }

    const epsilon = 2

    // In loop mode, always navigate within the middle copy to prevent jumpy mid-animation recentering.
    let cards = allCards
    if (shouldLoop && providers.length > 0 && allCards.length >= providers.length * 3) {
      normalizeLoopScrollLeft(container)
      const start = providers.length
      const end = providers.length * 2
      cards = allCards.slice(start, end)
    }

    const offsets = cards.map((c) => c.offsetLeft).filter((n) => Number.isFinite(n))
    if (offsets.length === 0) return

    const left = container.scrollLeft
    let target

    if (direction === 'right') {
      target = offsets.find((x) => x > left + epsilon)
      if (target == null) target = offsets[0]
    } else {
      for (let i = offsets.length - 1; i >= 0; i -= 1) {
        if (offsets[i] < left - epsilon) {
          target = offsets[i]
          break
        }
      }
      if (target == null) target = offsets[offsets.length - 1]
    }

    isProgrammaticScrollRef.current = true
    container.scrollTo({ left: target, behavior: 'smooth' })
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 900)
  }, [getScrollStep, normalizeLoopScrollLeft, providers.length, shouldLoop])

  useEffect(() => {
    let isMounted = true
    
    const loadProviders = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        didInitLoopScrollRef.current = false

        const response = await apiClient.get(
          '/partners/',
          { page: 1, page_size: 12, sort: '-rating' },
          { skipAuth: true }
        )

        const partnerList = response?.data?.results || response?.data?.data || response?.data || []
        const rows = Array.isArray(partnerList) ? partnerList : []
        const mapped = rows.map(toProvider).filter((p) => p?.id)

        if (isMounted) {
          setProviders(mapped)
        }
      } catch (err) {
        console.error('Failed to load providers:', err)
        const message = err?.friendlyMessage || err?.message || 'Failed to load rental providers.'
        if (isMounted) setLoadError(message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    loadProviders()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Start in the middle copy so user can scroll both directions "forever".
      if (shouldLoop && !didInitLoopScrollRef.current) {
        // Initialize immediately without delay for faster load
        const metrics = getLoopMetrics(container)
        if (metrics) {
          const prevBehavior = container.style.scrollBehavior
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = metrics.startMiddle
          container.style.scrollBehavior = prevBehavior
          didInitLoopScrollRef.current = true;
          checkScrollPosition();
        }
      }

      const onScroll = () => {
        if (scrollRafRef.current != null) return
        scrollRafRef.current = window.requestAnimationFrame(() => {
          scrollRafRef.current = null
          checkScrollPosition()
          lastAllowedScrollLeftRef.current = container.scrollLeft
        })
      }

      container.addEventListener('scroll', onScroll, { passive: true });
      checkScrollPosition();
      lastAllowedScrollLeftRef.current = container.scrollLeft

      return () => {
        container.removeEventListener('scroll', onScroll);
        if (scrollRafRef.current != null) {
          window.cancelAnimationFrame(scrollRafRef.current)
          scrollRafRef.current = null
        }
      };
    }
  }, [providers.length, shouldLoop, checkScrollPosition, getLoopMetrics]);

  useEffect(() => {
    if (!shouldLoop) return

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      scrollToSnap('right')
    }, 5_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [shouldLoop, scrollToSnap])

  return (
    <section className="py-12 sm:py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simple Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="text-center md:text-left md:flex md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gray-500">
                <span className="h-px w-8 bg-orange-500/70" aria-hidden="true" />
                <span>{t('providers_kicker')}</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 leading-tight sm:leading-[0.95] tracking-tight">
                {t('providers_heading')}
              </h2>
            </div>
            <p className="mt-4 md:mt-0 text-sm sm:text-base text-gray-600 max-w-2xl md:max-w-md md:text-right">
              {t('providers_description')}
            </p>
          </div>
          <div className="mt-8 h-px bg-gray-100" aria-hidden="true" />
        </motion.div>

        {/* Scroll Container with Navigation */}
        <div className="relative">

          <style jsx global>{`
            .scrollbar-hide {
              scrollbar-width: none;
              -ms-overflow-style: none;
              -webkit-overflow-scrolling: touch;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .provider-scroll-container {
              cursor: grab;
              scroll-behavior: smooth;
            }
            .provider-scroll-container:active {
              cursor: grabbing;
            }
          `}</style>
          
          <div
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto py-8 scrollbar-hide px-4 sm:px-0 snap-x snap-mandatory overscroll-x-contain select-none provider-scroll-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            onPointerLeave={endPointerDrag}
            onWheel={(e) => {
              // Block horizontal wheel/trackpad scrolling (including Shift+wheel),
              // but allow vertical page scrolling.
              if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault()
              }
            }}
          >
            {isLoading && (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex-shrink-0 w-[280px] sm:w-80 md:w-96 bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 animate-pulse shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl mr-3" />
                      <div className="h-4 w-28 bg-gray-100 rounded" />
                    </div>
                    <div className="text-right">
                      <div className="h-5 w-10 bg-gray-100 rounded ml-auto" />
                      <div className="h-3 w-16 bg-gray-100 rounded mt-2 ml-auto" />
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <div className="h-6 w-14 bg-gray-100 rounded" />
                      <div className="h-3 w-16 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="h-9 w-24 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ))
            )}

            {!isLoading && loadError && (
              <div className="w-full rounded-2xl bg-white p-6 text-gray-700 shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-900">{t('providers_unable_to_load')}</div>
                <div className="mt-1 text-sm text-gray-600">{loadError}</div>
              </div>
            )}

            {!isLoading && !loadError && providers.length === 0 && (
              <div className="w-full rounded-2xl bg-white p-6 text-gray-700 shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-900">{t('providers_no_providers')}</div>
                <div className="mt-1 text-sm text-gray-600">{t('providers_no_providers_desc')}</div>
              </div>
            )}

            {!isLoading && !loadError && loopedProviders.map((provider, idx) => (
              <motion.div
                key={`${provider.id}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative flex-shrink-0 w-[280px] sm:w-80 md:w-96 bg-white p-5 sm:p-7 snap-start rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 ease-out hover:shadow-xl"
                data-provider-card="true"
                style={{ scrollSnapStop: 'always' }}
              >

                {/* Provider Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center min-w-0">
                    <div className="w-11 h-11 bg-white flex items-center justify-center mr-3 overflow-hidden rounded-xl border border-gray-50">
                      {provider.logo ? (
                        <img
                          src={provider.logo}
                          alt={provider.name}
                          className="max-h-9 max-w-9 object-contain transition-opacity duration-300 group-hover:opacity-90"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-200" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate tracking-tight text-lg">{provider.name}</h3>
                      {provider.city ? (
                        <div className="mt-0.5 text-xs text-gray-500 truncate flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {provider.city}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <div className="inline-flex items-center bg-gray-50/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-100">
                      <span className="text-sm font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
                      <span className="mx-1.5 h-3 w-px bg-gray-300" aria-hidden="true" />
                      <span className="text-xs text-orange-500">★</span>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500 font-medium">{provider.reviews}</div>
                  </div>
                </div>

                {provider.isVerified ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50/50 backdrop-blur-sm rounded-full border border-emerald-100">
                      <svg className="mr-1 h-2.5 w-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {t('providers_verified_partner')}
                    </span>
                  </div>
                ) : null}

                {/* Provider Facts */}
                <div className="space-y-2 mb-6 bg-gray-50/30 backdrop-blur-sm p-3 rounded-xl border border-gray-100/50">
                  {provider.categories.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">{item.name}</span>
                      <span className="text-gray-900 font-semibold truncate max-w-[9rem] sm:max-w-none">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    {provider.price != null ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('providers_starting_at')}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-bold text-gray-900">{provider.price}</span>
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">/day</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('providers_starting_at')}</span>
                         <span className="text-lg font-bold text-gray-900">{t('providers_price_varies')}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="group/btn relative overflow-hidden bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-95"
                    type="button"
                    onClick={() => safeNavigate(provider.id)}
                  >
                    <span className="relative z-10">{t('providers_view_profile')}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Edge fade for a more premium look */}
          <div 
            className={`pointer-events-none absolute inset-y-0 left-0 w-12 duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} 
            aria-hidden="true" 
          />
          <div 
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} 
            aria-hidden="true" 
          />


        </div>
      </div>
    </section>
  );
}
