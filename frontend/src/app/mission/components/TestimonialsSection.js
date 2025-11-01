'use client';

import { useCallback } from 'react';
import { animations } from '@/hooks/useScrollAnimation';
import { TESTIMONIALS } from '../data';

export default function TestimonialsSection({ testimonialsVisible }) {
  const scrollLeft = useCallback(() => {
    const container = document.getElementById('testimonials-container');
    if (container) {
      const cardWidth = 350;
      const gap = 24;
      const scrollAmount = cardWidth + gap;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    const container = document.getElementById('testimonials-container');
    if (container) {
      const cardWidth = 350;
      const gap = 24;
      const scrollAmount = cardWidth + gap;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const testimonials = TESTIMONIALS;

  return (
    <section 
      className="py-20 bg-gray-50"
      style={animations.flipInY(testimonialsVisible, { duration: '0.7s' })}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">What our customers say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real experiences from real customers who trust Airbcar for their transportation needs
          </p>
        </div>
        
        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button 
            className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all duration-300 group"
            onClick={scrollLeft}
            aria-label="Previous testimonials"
          >
            <svg className="w-6 h-6 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all duration-300 group"
            onClick={scrollRight}
            aria-label="Next testimonials"
          >
            <svg className="w-6 h-6 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable Container */}
          <div 
            id="testimonials-container"
            className="flex overflow-x-auto scrollbar-hide space-x-6 pb-4 px-16 md:px-0 snap-x snap-mandatory"
          >
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-6 md:p-8 rounded-xl shadow-lg min-w-[320px] md:min-w-[350px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300 snap-start">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">{testimonial.initial}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-700">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

