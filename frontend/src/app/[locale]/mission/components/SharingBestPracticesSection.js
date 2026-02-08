'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const contentSlides = [
  { 
    id: 1, 
    title: 'Sharing best practices',
    description: "We're able to provide insights that help local authorities make their cities more connected and liveable.",
    link: 'Learn more'
  },
  { 
    id: 2, 
    title: 'Urban planning insights',
    description: "Our data helps city planners understand mobility patterns and optimize infrastructure for better urban living.",
    link: 'Explore insights'
  },
  { 
    id: 3, 
    title: 'Sustainable solutions',
    description: "We partner with cities to implement sustainable transportation solutions that reduce congestion and emissions.",
    link: 'See solutions'
  },
];

export default function SharingBestPracticesSection() {
  const ref = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const isDragging = useRef(false);
  const scrollTimeout = useRef(null);

  // Snap to nearest slide
  const snapToNearestSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    
    if (slideWidth > 0) {
      const nearestIndex = Math.round(scrollLeft / slideWidth);
      const clampedIndex = Math.max(0, Math.min(nearestIndex, contentSlides.length - 1));
      
      const targetScroll = clampedIndex * slideWidth;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      setCurrentIndex(clampedIndex);
    }
  }, []);

  // Check scroll position and update button states
  const updateScrollState = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScroll - 5);
    
    // Calculate current slide index based on scroll position
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const newIndex = Math.round(scrollLeft / slideWidth);
      const clampedIndex = Math.max(0, Math.min(newIndex, contentSlides.length - 1));
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    }
  }, [currentIndex]);

  // Scroll to specific slide
  const scrollToSlide = useCallback((index) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    const targetScroll = index * slideWidth;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial state update
    const timer = setTimeout(() => {
      updateScrollState();
    }, 100);

    const handleScroll = () => {
      updateScrollState();
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Snap to nearest slide after scroll ends
      if (!isDragging.current) {
        scrollTimeout.current = setTimeout(() => {
          snapToNearestSlide();
        }, 150);
      }
    };

    const handleResize = () => {
      updateScrollState();
      // Snap to current slide after resize
      setTimeout(() => {
        scrollToSlide(currentIndex);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, snapToNearestSlide, scrollToSlide, currentIndex]);

  // Scroll functions with snap behavior
  const scrollContent = useCallback((direction) => {
    if (direction === 'right') {
      const nextIndex = Math.min(currentIndex + 1, contentSlides.length - 1);
      scrollToSlide(nextIndex);
    } else {
      const prevIndex = Math.max(currentIndex - 1, 0);
      scrollToSlide(prevIndex);
    }
  }, [currentIndex, scrollToSlide]);

  // Handle mouse drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    
    const deltaX = dragStartX.current - e.clientX;
    scrollContainerRef.current.scrollLeft = scrollStartX.current + deltaX;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    isDragging.current = false;
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.scrollBehavior = 'smooth';
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Snap to nearest slide after drag ends
    setTimeout(() => {
      snapToNearestSlide();
      updateScrollState();
    }, 100);
  }, [handleMouseMove, snapToNearestSlide, updateScrollState]);

  const handleMouseDown = useCallback((e) => {
    if (!scrollContainerRef.current) return;
    
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.scrollBehavior = 'auto';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseLeave = useCallback(() => {
    if (scrollContainerRef.current && isDragging.current) {
      isDragging.current = false;
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);

  return (
    <section ref={ref} className="relative bg-gray-900 text-white py-24 sm:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Content - Horizontally Scrollable */}
          <div className="mb-12 relative">
            {/* Scroll Buttons with fade in/out */}
            <motion.button
              onClick={() => scrollContent('left')}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: canScrollLeft ? 1 : 0.3,
                scale: canScrollLeft ? 1 : 0.9
              }}
              whileHover={{ scale: canScrollLeft ? 1.1 : 0.9 }}
              whileTap={{ scale: 0.95 }}
              disabled={!canScrollLeft}
              className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center hover:bg-green-500/20 transition-all bg-gray-900/90 backdrop-blur-sm disabled:cursor-not-allowed shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
            
            <motion.button
              onClick={() => scrollContent('right')}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: canScrollRight ? 1 : 0.3,
                scale: canScrollRight ? 1 : 0.9
              }}
              whileHover={{ scale: canScrollRight ? 1.1 : 0.9 }}
              whileTap={{ scale: 0.95 }}
              disabled={!canScrollRight}
              className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center hover:bg-green-500/20 transition-all bg-gray-900/90 backdrop-blur-sm disabled:cursor-not-allowed shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>

            {/* Scroll Progress Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50 rounded-full overflow-hidden z-10">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: '0%' }}
                animate={{
                  width: `${((currentIndex + 1) / contentSlides.length) * 100}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="overflow-x-auto scroll-smooth scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                scrollPadding: '0',
              }}
            >
              <div 
                className="flex pb-4" 
                style={{ 
                  minWidth: 'max-content',
                  gap: '0',
                }}
              >
                {contentSlides.map((slide, index) => (
                  <motion.div
                    key={slide.id}
                    data-slide
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="space-y-6 flex-shrink-0 px-4 sm:px-8"
                    style={{ 
                      width: '100%',
                      minWidth: '100%',
                      maxWidth: '100%',
                      scrollSnapAlign: 'start',
                      scrollSnapStop: 'always',
                    }}
                  >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                      {slide.title}
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                      {slide.description}
                    </p>
                    <motion.a
                      href="#"
                      whileHover={{ x: 5 }}
                      className="inline-block text-green-500 underline text-lg font-medium cursor-pointer"
                    >
                      {slide.link}
                    </motion.a>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mt-12"
          >
            {contentSlides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => scrollToSlide(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`relative transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-3'
                    : 'w-3 h-3'
                } rounded-full ${
                  index === currentIndex
                    ? 'bg-green-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              >
                {index === currentIndex && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute inset-0 bg-green-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
