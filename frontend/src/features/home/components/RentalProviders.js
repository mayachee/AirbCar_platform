'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export default function RentalProviders() {
  const router = useRouter()
  const scrollContainerRef = useRef(null);
  const didInitLoopScrollRef = useRef(false)
  const scrollRafRef = useRef(null)
  const isProgrammaticScrollRef = useRef(false)
  const lastAllowedScrollLeftRef = useRef(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const shouldLoop = !isLoading && !loadError && providers.length > 0
  const loopedProviders = shouldLoop ? [...providers, ...providers, ...providers] : providers

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

  const formatPrice = (value) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.round(num);
  }

  const toProvider = (partner) => {
    const name = partner?.business_name || partner?.businessName || partner?.companyName || 'Partner'
    const rating = Number(partner?.rating) || 0
    const reviewCount = Number(partner?.review_count) || 0
    const price = formatPrice(partner?.min_price_per_day)
    const city = partner?.city || partner?.user?.city || ''
    const isVerified = Boolean(partner?.is_verified)
    const businessType = partner?.business_type || ''

    return {
      id: partner?.id,
      name,
      rating: Math.max(0, Math.min(5, rating)),
      reviews: reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'New',
      logo: partner?.logo_url || null,
      price,
      city,
      isVerified,
      categories: [
        { name: 'City', value: city || '—' },
        { name: 'Type', value: businessType || '—' },
        { name: 'Bookings', value: typeof partner?.total_bookings === 'number' ? String(partner.total_bookings) : '—' },
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

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return

    // Infinite loop behavior: keep scroll position within the middle copy.
    if (shouldLoop) {
      const metrics = getLoopMetrics(container)
      const left = container.scrollLeft
      if (metrics) {
        // Keep scrollLeft within the middle copy range by shifting exactly one copy width.
        // This stays seamless because copy #1 and copy #2 are identical.
        if (left < metrics.startMiddle - 1) {
          container.scrollLeft = left + metrics.singleWidth
        } else if (left >= metrics.startThird - 1) {
          container.scrollLeft = left - metrics.singleWidth
        }
      }

      // In loop mode there are no true edges, so keep arrows available.
      setShowLeftArrow(true)
      setShowRightArrow(true)
      return
    }

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, [getLoopMetrics, shouldLoop])

  const scrollToLeft = () => {
    scrollToSnap('left')
  };

  const scrollToRight = () => {
    scrollToSnap('right')
  };

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
    ;(async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        const response = await apiClient.get(
          '/partners/',
          { page: 1, page_size: 12, sort: '-rating' },
          { skipAuth: true }
        )

        const partnerList = response?.data?.data
        const rows = Array.isArray(partnerList) ? partnerList : []
        const mapped = rows.map(toProvider).filter((p) => p?.id)

        if (isMounted) setProviders(mapped)
      } catch (err) {
        const message = err?.friendlyMessage || err?.message || 'Failed to load rental providers.'
        if (isMounted) setLoadError(message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Start in the middle copy so user can scroll both directions "forever".
      if (shouldLoop && !didInitLoopScrollRef.current) {
        const metrics = getLoopMetrics(container)
        if (metrics) {
          const prevBehavior = container.style.scrollBehavior
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = metrics.startMiddle
          container.style.scrollBehavior = prevBehavior
          didInitLoopScrollRef.current = true;
        }
      }

      const onScroll = () => {
        if (scrollRafRef.current != null) return
        scrollRafRef.current = window.requestAnimationFrame(() => {
          scrollRafRef.current = null

          // Disable user scrolling: if a scroll happens and it wasn't triggered by our code,
          // snap back to the last allowed scrollLeft.
          if (!isProgrammaticScrollRef.current) {
            setInstantScrollLeft(container, lastAllowedScrollLeftRef.current)
            return
          }

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
  }, [providers.length, shouldLoop, checkScrollPosition]);

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
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simple Header */}
        <div className="mb-12">
          <div className="text-center md:text-left md:flex md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gray-500">
                <span className="h-px w-8 bg-orange-500/70" aria-hidden="true" />
                <span>Providers</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 leading-tight sm:leading-[0.95] tracking-tight">
                Top Profile Providers
              </h2>
            </div>
            <p className="mt-4 md:mt-0 text-sm sm:text-base text-gray-600 max-w-2xl md:max-w-md md:text-right">
              Compare trusted providers and find the best deals for your trip.
            </p>
          </div>
          <div className="mt-8 h-px bg-gray-100" aria-hidden="true" />
        </div>

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
          `}</style>
          
          <div
            ref={scrollContainerRef}
            className="-mx-4 sm:mx-0 flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-2 snap-x snap-mandatory scroll-smooth overscroll-x-contain select-none touch-pan-y cursor-default"
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
                  className="flex-shrink-0 w-72 sm:w-80 md:w-[26rem] bg-white rounded-2xl p-6 sm:p-7 animate-pulse shadow-sm"
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
              <div className="w-full rounded-2xl bg-white p-6 text-gray-700 shadow-sm">
                <div className="font-semibold text-gray-900">Unable to load providers</div>
                <div className="mt-1 text-sm text-gray-600">{loadError}</div>
              </div>
            )}

            {!isLoading && !loadError && providers.length === 0 && (
              <div className="w-full rounded-2xl bg-white p-6 text-gray-700 shadow-sm">
                <div className="font-semibold text-gray-900">No providers yet</div>
                <div className="mt-1 text-sm text-gray-600">Check back soon for verified partners.</div>
              </div>
            )}

            {!isLoading && !loadError && loopedProviders.map((provider, idx) => (
              <div
                key={`${provider.id}-${idx}`}
                className="group relative flex-shrink-0 w-72 sm:w-80 md:w-[26rem] bg-white p-6 sm:p-7 snap-start shadow-sm transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                data-provider-card="true"
                style={{ scrollSnapStop: 'always' }}
              >

                {/* Provider Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center min-w-0">
                    <div className="w-11 h-11 bg-white flex items-center justify-center mr-3 overflow-hidden">
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
                      <h3 className="font-semibold text-gray-900 truncate tracking-tight">{provider.name}</h3>
                      {provider.city ? (
                        <div className="mt-0.5 text-xs text-gray-500 truncate">{provider.city}</div>
                      ) : null}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <div className="inline-flex items-center bg-white px-2.5 py-1">
                      <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
                      <span className="sr-only">Rating {provider.rating.toFixed(1)} out of 5</span>
                      <span className="mx-2 h-4 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />
                      <div className="hidden sm:flex items-center" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${provider.rating >= i + 1 ? 'text-orange-500' : 'text-gray-200'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{provider.reviews}</div>
                  </div>
                </div>

                {provider.isVerified ? (
                  <div className="mb-5">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
                      Verified partner
                    </span>
                  </div>
                ) : null}

                {/* Provider Facts */}
                <div className="space-y-2 sm:space-y-3 mb-6">
                  {provider.categories.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-900 font-medium truncate max-w-[9rem] sm:max-w-none">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                  <div>
                    {provider.price != null ? (
                      <>
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{provider.price} €</div>
                        <div className="text-xs sm:text-sm text-gray-500">from / day</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg sm:text-xl font-bold text-gray-900">—</div>
                        <div className="text-xs sm:text-sm text-gray-500">price varies</div>
                      </>
                    )}
                  </div>
                  <button
                    className="bg-orange-500 text-white px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap hover:bg-orange-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    type="button"
                    onClick={() => router.push(`/partner/${provider.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edge fade for a more premium look */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />


        </div>
      </div>
    </section>
  );
}
