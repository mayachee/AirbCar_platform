'use client';

import { useScrollAnimation, animations } from '@/hooks/useScrollAnimation';

export default function HeroSection() {
  const [heroRef, heroVisible] = useScrollAnimation({ delay: 100 });

  return (
    <section 
      ref={heroRef}
      className="relative bg-gradient-to-br from-orange-400 to-orange-600 min-h-[70vh] flex items-center justify-center text-white overflow-hidden"
      style={animations.fadeInUp(heroVisible, { duration: '1s' })}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 800\"><path fill=\"%23ffffff08\" d=\"M0,400 C300,500 600,300 1200,400 L1200,800 L0,800 Z\"/></svg>')"
        }}
      ></div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Make cities for<br />
          people, not cars.
        </h1>
        <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
          We're building a sustainable future where mobility is accessible, affordable, and environmentally conscious.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1">
            Start Your Journey
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-200">
            Learn More
          </button>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
    </section>
  );
}

